import { collection, doc, setDoc, addDoc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore'
import { db, auth } from './firebaseClient'

// Global active streams registry
if (typeof window !== 'undefined') {
  window.__ACTIVE_MEDIA_STREAMS__ = window.__ACTIVE_MEDIA_STREAMS__ || new Set()
}

// Helper to get current user
const getUser = () => auth.currentUser

// Complete hardware release of all active media streams and tracks
export function stopAllMediaTracks() {
  if (typeof window !== 'undefined' && window.__ACTIVE_MEDIA_STREAMS__) {
    window.__ACTIVE_MEDIA_STREAMS__.forEach(stream => {
      try {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            try {
              track.enabled = false
              track.stop()
            } catch (e) { }
          })
        }
      } catch (e) { }
    })
    window.__ACTIVE_MEDIA_STREAMS__.clear()
  }

  if (typeof document !== 'undefined') {
    document.querySelectorAll('video, audio').forEach((mediaEl) => {
      if (mediaEl.srcObject && mediaEl.srcObject instanceof MediaStream) {
        try {
          mediaEl.srcObject.getTracks().forEach((track) => {
            try {
              track.enabled = false
              track.stop()
            } catch (e) { }
          })
        } catch (e) { }
        mediaEl.srcObject = null
      }
      try {
        mediaEl.pause()
        mediaEl.removeAttribute('src')
        mediaEl.load()
      } catch (e) { }
    })
  }
}

export class WebRTCService {
  constructor() {
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = new MediaStream()
    this.screenStream = null
    this.callDocRef = null
    this.unsubscribeCandidates = null
    this.unsubscribeCall = null
    this.callId = null
    this.remoteDescSet = false
    this.candidateQueue = []
    this.onStatusChange = null
    this.onRemoteStream = null

    this.servers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    }
  }

  async setupLocalStream(videoEnabled = true, audioEnabled = true) {
    // Teardown any existing tracks before creating new stream
    stopAllMediaTracks()

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      })
      if (typeof window !== 'undefined' && window.__ACTIVE_MEDIA_STREAMS__) {
        window.__ACTIVE_MEDIA_STREAMS__.add(this.localStream)
      }
      return this.localStream
    } catch (error) {
      console.warn('Full media access failed, trying audio fallback:', error)
      try {
        if (audioEnabled) {
          this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          if (typeof window !== 'undefined' && window.__ACTIVE_MEDIA_STREAMS__) {
            window.__ACTIVE_MEDIA_STREAMS__.add(this.localStream)
          }
          return this.localStream
        }
      } catch (audioErr) {
        console.warn('Audio fallback also failed:', audioErr)
      }
      this.localStream = new MediaStream()
      return this.localStream
    }
  }

  toggleAudio(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted
      })
    }
  }

  toggleVideo(cameraOff) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !cameraOff
      })
    }
  }

  async startScreenShare() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      if (typeof window !== 'undefined' && window.__ACTIVE_MEDIA_STREAMS__) {
        window.__ACTIVE_MEDIA_STREAMS__.add(this.screenStream)
      }
      const screenTrack = this.screenStream.getVideoTracks()[0]

      if (this.peerConnection) {
        const senders = this.peerConnection.getSenders()
        const videoSender = senders.find(sender => sender.track?.kind === 'video')
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack)
        }
      }

      screenTrack.onended = () => {
        this.stopScreenShare()
      }

      return this.screenStream
    } catch (err) {
      console.warn('Screen share failed or was cancelled:', err)
      return null
    }
  }

  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        try {
          track.enabled = false
          track.stop()
        } catch (e) { }
      })
      if (typeof window !== 'undefined' && window.__ACTIVE_MEDIA_STREAMS__) {
        window.__ACTIVE_MEDIA_STREAMS__.delete(this.screenStream)
      }
      this.screenStream = null
    }

    if (this.localStream && this.peerConnection) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      const senders = this.peerConnection.getSenders()
      const videoSender = senders.find(sender => sender.track?.kind === 'video' || sender.track === null)
      if (videoSender && videoTrack) {
        await videoSender.replaceTrack(videoTrack)
      }
    }
  }

  _setupPeerConnection() {
    if (this.peerConnection) {
      try {
        this.peerConnection.close()
      } catch (e) { }
    }
    this.peerConnection = new RTCPeerConnection(this.servers)
    this.remoteDescSet = false
    this.candidateQueue = []

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream)
      })
    }

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track)
      })
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream)
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState
      if (state === 'connected') {
        if (this.onStatusChange) this.onStatusChange('active')
      } else if (state === 'disconnected' || state === 'failed') {
        if (this.onStatusChange) this.onStatusChange(state)
      } else if (state === 'closed') {
        if (this.onStatusChange) this.onStatusChange('ended')
      }
    }
  }

  async _processCandidateQueue() {
    if (!this.remoteDescSet || !this.peerConnection) return
    while (this.candidateQueue.length > 0) {
      const candidate = this.candidateQueue.shift()
      try {
        await this.peerConnection.addIceCandidate(candidate)
      } catch (err) {
        console.warn('Error adding queued ICE candidate:', err)
      }
    }
  }

  async createOffer(targetUserId) {
    const user = getUser()
    if (!user) throw new Error('Must be logged in to create a call')

    this.callDocRef = await addDoc(collection(db, 'calls'), {
      callerId: user.uid,
      calleeId: targetUserId,
      status: 'calling',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    this.callId = this.callDocRef.id

    this._setupPeerConnection()

    const callerCandidatesCol = collection(db, `calls/${this.callId}/callerCandidates`)
    const calleeCandidatesCol = collection(db, `calls/${this.callId}/calleeCandidates`)

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await addDoc(callerCandidatesCol, event.candidate.toJSON())
        } catch (e) {
          console.warn('Error adding caller ICE candidate to db:', e)
        }
      }
    }

    const offerDescription = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })
    await this.peerConnection.setLocalDescription(offerDescription)

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    }

    await updateDoc(this.callDocRef, {
      offer: offer,
      status: 'calling',
      updatedAt: serverTimestamp()
    })

    this.unsubscribeCall = onSnapshot(this.callDocRef, async (snapshot) => {
      const data = snapshot.data()
      if (!data) return

      if (data.status === 'active' && data.answer && !this.remoteDescSet) {
        const answerDescription = new RTCSessionDescription(data.answer)
        await this.peerConnection.setRemoteDescription(answerDescription)
        this.remoteDescSet = true
        await this._processCandidateQueue()
        if (this.onStatusChange) this.onStatusChange('active')
      } else if (data.status === 'ended' || data.status === 'declined') {
        if (this.onStatusChange) this.onStatusChange(data.status)
      }
    })

    this.unsubscribeCandidates = onSnapshot(calleeCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data())
          if (this.remoteDescSet && this.peerConnection?.remoteDescription) {
            try {
              await this.peerConnection.addIceCandidate(candidate)
            } catch (err) {
              console.warn('Error adding callee ICE candidate:', err)
            }
          } else {
            this.candidateQueue.push(candidate)
          }
        }
      })
    })

    return this.callId
  }

  async answerCall(callId) {
    const user = getUser()
    if (!user) throw new Error('Must be logged in to answer a call')

    this.callId = callId
    this.callDocRef = doc(db, 'calls', callId)

    this._setupPeerConnection()

    const callerCandidatesCol = collection(db, `calls/${this.callId}/callerCandidates`)
    const calleeCandidatesCol = collection(db, `calls/${this.callId}/calleeCandidates`)

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await addDoc(calleeCandidatesCol, event.candidate.toJSON())
        } catch (e) {
          console.warn('Error adding callee ICE candidate to db:', e)
        }
      }
    }

    const processOffer = async (offerData) => {
      if (this.remoteDescSet || !offerData) return
      try {
        const offerDescription = new RTCSessionDescription(offerData)
        await this.peerConnection.setRemoteDescription(offerDescription)
        this.remoteDescSet = true
        await this._processCandidateQueue()

        const answerDescription = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answerDescription)

        const answer = {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        }

        await updateDoc(this.callDocRef, {
          status: 'active',
          answer: answer,
          updatedAt: serverTimestamp()
        })

        if (this.onStatusChange) this.onStatusChange('active')
      } catch (err) {
        console.error('Error processing call offer:', err)
      }
    }

    this.unsubscribeCall = onSnapshot(this.callDocRef, async (snapshot) => {
      const data = snapshot.data()
      if (!data) return

      if (data.status === 'ended' || data.status === 'declined') {
        if (this.onStatusChange) this.onStatusChange(data.status)
        return
      }

      if (data.offer && !this.remoteDescSet) {
        await processOffer(data.offer)
      }
    })

    this.unsubscribeCandidates = onSnapshot(callerCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data())
          if (this.remoteDescSet && this.peerConnection?.remoteDescription) {
            try {
              await this.peerConnection.addIceCandidate(candidate)
            } catch (err) {
              console.warn('Error adding caller ICE candidate:', err)
            }
          } else {
            this.candidateQueue.push(candidate)
          }
        }
      })
    })
  }

  async declineCall(callId) {
    try {
      const callDocRef = doc(db, 'calls', callId)
      await updateDoc(callDocRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      console.warn('Error declining call:', err)
    }
  }

  async hangup() {
    // 1. Immediate synchronous hardware release of all tracks
    stopAllMediaTracks()

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          track.enabled = false
          track.stop()
        } catch (e) { }
      })
      this.localStream = null
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        try {
          track.enabled = false
          track.stop()
        } catch (e) { }
      })
      this.screenStream = null
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        try {
          track.enabled = false
          track.stop()
        } catch (e) { }
      })
    }

    // 2. Unsubscribe listeners
    if (this.unsubscribeCall) {
      this.unsubscribeCall()
      this.unsubscribeCall = null
    }
    if (this.unsubscribeCandidates) {
      this.unsubscribeCandidates()
      this.unsubscribeCandidates = null
    }

    // 3. Close peer connection senders & transport
    if (this.peerConnection) {
      try {
        this.peerConnection.getSenders().forEach(sender => {
          if (sender.track) {
            try {
              sender.track.enabled = false
              sender.track.stop()
            } catch (e) { }
          }
        })
        this.peerConnection.close()
      } catch (e) { }
      this.peerConnection = null
    }

    // 4. Update Firestore
    if (this.callDocRef) {
      try {
        await updateDoc(this.callDocRef, {
          status: 'ended',
          updatedAt: serverTimestamp()
        })
      } catch (e) { }
    }
  }
}
