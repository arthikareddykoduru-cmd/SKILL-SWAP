import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  PhoneOff, 
  ArrowLeft, 
  Maximize, 
  Minimize,
  User,
  Clock,
  PhoneCall,
  RefreshCw
} from 'lucide-react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { WebRTCService, stopAllMediaTracks } from '../lib/webrtc'
import { useAuth } from '../context/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import Avatar from '../components/Avatar'

function CallPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const [micMuted, setMicMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [status, setStatus] = useState('connecting') // 'calling' | 'connecting' | 'active' | 'ended' | 'declined' | 'failed'
  const [errorMsg, setErrorMsg] = useState(null)
  const [remoteUser, setRemoteUser] = useState(null)
  const [callDuration, setCallDuration] = useState(0)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const rtcServiceRef = useRef(null)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  // Format call duration MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Timer effect for active call
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  // Initialize WebRTC Call
  useEffect(() => {
    if (authLoading || !user || !id) return

    let isSubscribed = true
    const service = new WebRTCService()
    rtcServiceRef.current = service

    // Status listener
    service.onStatusChange = (newStatus) => {
      if (isSubscribed) {
        setStatus(newStatus)
        if (newStatus === 'declined' || newStatus === 'ended') {
          setErrorMsg(newStatus === 'declined' ? 'The call was declined.' : 'The call has ended.')
          if (localVideoRef.current?.srcObject) {
            try {
              localVideoRef.current.srcObject.getTracks().forEach(t => t.stop())
            } catch (e) {}
            localVideoRef.current.srcObject = null
          }
          if (remoteVideoRef.current?.srcObject) {
            try {
              remoteVideoRef.current.srcObject.getTracks().forEach(t => t.stop())
            } catch (e) {}
            remoteVideoRef.current.srcObject = null
          }
          stopAllMediaTracks()
        }
      }
    }

    // Remote stream listener
    service.onRemoteStream = (remoteStream) => {
      if (remoteVideoRef.current && isSubscribed) {
        remoteVideoRef.current.srcObject = remoteStream
      }
    }

    const initCall = async () => {
      try {
        setStatus('connecting')
        setErrorMsg(null)

        // 1. Setup local video/audio media
        const stream = await service.setupLocalStream(!cameraOff, !micMuted)
        if (localVideoRef.current && isSubscribed) {
          localVideoRef.current.srcObject = stream
        }

        // 2. Determine whether :id is a target user UID or an existing call document
        if (location.state?.incoming) {
          // Definitely an incoming call document
          try {
            const callDocSnap = await getDoc(doc(db, 'calls', id))
            if (callDocSnap.exists()) {
              const callData = callDocSnap.data()
              const remoteUserId = callData.callerId === user.uid ? callData.calleeId : callData.callerId
              if (remoteUserId) {
                getDoc(doc(db, 'profiles', remoteUserId)).then((pSnap) => {
                  if (pSnap.exists() && isSubscribed) {
                    setRemoteUser({ id: remoteUserId, ...pSnap.data() })
                  }
                }).catch(console.warn)
              }

              if (callData.status === 'ended' || callData.status === 'declined') {
                if (isSubscribed) {
                  setStatus(callData.status)
                  setErrorMsg(`This call has already ${callData.status}.`)
                }
                return
              }

              await service.answerCall(id)
              return
            }
          } catch (e) {
            console.warn('Error reading incoming call doc:', e)
          }
        }

        // Check if :id is a user profile (initiating a call to that user)
        let isUserProfile = false
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', id))
          if (profileSnap.exists()) {
            isUserProfile = true
            if (isSubscribed) {
              setRemoteUser({ id, ...profileSnap.data() })
            }
          }
        } catch (e) {
          console.warn('Error checking profile doc:', e)
        }

        if (isUserProfile) {
          // Start outgoing call to this user
          setStatus('calling')
          await service.createOffer(id)
        } else {
          // Try checking if it's an existing call document
          let callDocSnap = null
          try {
            const snap = await getDoc(doc(db, 'calls', id))
            if (snap.exists()) callDocSnap = snap
          } catch (e) {
            console.warn('Call doc read not permitted or non-existent:', e)
          }

          if (callDocSnap && callDocSnap.exists()) {
            const callData = callDocSnap.data()
            const remoteUserId = callData.callerId === user.uid ? callData.calleeId : callData.callerId
            if (remoteUserId) {
              getDoc(doc(db, 'profiles', remoteUserId)).then((pSnap) => {
                if (pSnap.exists() && isSubscribed) {
                  setRemoteUser({ id: remoteUserId, ...pSnap.data() })
                }
              }).catch(console.warn)
            }

            if (callData.calleeId === user.uid) {
              await service.answerCall(id)
            } else {
              setStatus('calling')
            }
          } else {
            // Default to initiating outgoing offer with :id as target user ID
            setStatus('calling')
            await service.createOffer(id)
          }
        }
      } catch (err) {
        console.error('Call initialization error:', err)
        if (isSubscribed) {
          setErrorMsg(err.message || 'Failed to establish call connection.')
          setStatus('failed')
        }
      }
    }

    initCall()

    return () => {
      isSubscribed = false
      if (localVideoRef.current?.srcObject) {
        try {
          localVideoRef.current.srcObject.getTracks().forEach(t => t.stop())
        } catch (e) {}
        localVideoRef.current.srcObject = null
      }
      if (remoteVideoRef.current?.srcObject) {
        try {
          remoteVideoRef.current.srcObject.getTracks().forEach(t => t.stop())
        } catch (e) {}
        remoteVideoRef.current.srcObject = null
      }
      service.hangup()
      stopAllMediaTracks()
    }
  }, [id, authLoading, user])

  // Mic toggle handler
  const handleToggleMic = () => {
    const nextMuted = !micMuted
    setMicMuted(nextMuted)
    if (rtcServiceRef.current) {
      rtcServiceRef.current.toggleAudio(nextMuted)
    }
  }

  // Camera toggle handler
  const handleToggleCamera = () => {
    const nextCameraOff = !cameraOff
    setCameraOff(nextCameraOff)
    if (rtcServiceRef.current) {
      rtcServiceRef.current.toggleVideo(nextCameraOff)
    }
  }

  // Screen share handler
  const handleToggleScreenShare = async () => {
    if (!rtcServiceRef.current) return
    if (isScreenSharing) {
      await rtcServiceRef.current.stopScreenShare()
      setIsScreenSharing(false)
    } else {
      const stream = await rtcServiceRef.current.startScreenShare()
      if (stream) {
        setIsScreenSharing(true)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      }
    }
  }

  // Fullscreen handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.warn)
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.warn)
    }
  }

  // End Call Handler
  const handleEndCall = async () => {
    if (localVideoRef.current?.srcObject) {
      try {
        localVideoRef.current.srcObject.getTracks().forEach(t => t.stop())
      } catch (e) {}
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current?.srcObject) {
      try {
        remoteVideoRef.current.srcObject.getTracks().forEach(t => t.stop())
      } catch (e) {}
      remoteVideoRef.current.srcObject = null
    }
    if (rtcServiceRef.current) {
      await rtcServiceRef.current.hangup()
    }
    stopAllMediaTracks()
    navigate('/dashboard')
  }

  // Retry Handler
  const handleRetry = () => {
    window.location.reload()
  }

  const remoteName = remoteUser?.full_name || remoteUser?.username || 'Peer'

  return (
    <div ref={containerRef} className="flex min-h-screen flex-col bg-slate-950 text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 z-20 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <button 
          type="button" 
          onClick={handleEndCall} 
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20 active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={16} /> End & Exit
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-slate-300">
            <span className={`h-2 w-2 rounded-full ${status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
            {status === 'active' ? `Live (${formatDuration(callDuration)})` : status === 'calling' ? 'Ringing...' : 'Connecting...'}
          </div>
          <button 
            type="button"
            onClick={handleToggleFullscreen}
            className="rounded-full bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Main Video Call Area */}
      <div className="flex-1 px-4 py-4 sm:px-6 relative flex flex-col items-center justify-center overflow-hidden">
        
        {/* Error / Ended Call Overlay */}
        {(errorMsg || status === 'failed' || status === 'ended' || status === 'declined') && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center animate-in fade-in duration-200">
            <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
              {status === 'failed' ? <PhoneOff size={36} /> : <PhoneCall size={36} />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {status === 'declined' ? 'Call Declined' : status === 'ended' ? 'Call Ended' : 'Call Notice'}
            </h2>
            <p className="text-base text-slate-400 max-w-md mb-6">{errorMsg || 'The call session is not active.'}</p>
            <div className="flex gap-4">
              <button 
                onClick={handleRetry} 
                className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                <RefreshCw size={16} /> Retry
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-500 active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Video Canvas Container */}
        <div className="relative h-full w-full max-w-6xl min-h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex items-center justify-center">
          
          {/* Remote Video Stream */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="h-full w-full object-cover" 
          />

          {/* Remote User Placeholder (when video is not yet active or stream has no video track) */}
          {status !== 'active' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-center p-6">
              <div className="relative mb-4">
                <Avatar name={remoteName} size="lg" />
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-4 ring-slate-950 animate-pulse">
                  <PhoneCall size={12} className="text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white">{remoteName}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {status === 'calling' ? 'Ringing...' : 'Setting up secure WebRTC connection...'}
              </p>
            </div>
          )}

          {/* Callee / Status Floating Badge */}
          <div className="absolute left-5 top-5 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/10 px-4 py-3 z-10 flex items-center gap-3">
            <Avatar name={remoteName} size="sm" />
            <div>
              <p className="text-sm font-medium text-white">{remoteName}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {status === 'active' ? (
                  <>
                    <Clock size={12} className="text-green-400" />
                    <span>{formatDuration(callDuration)}</span>
                  </>
                ) : (
                  <span>{status === 'calling' ? 'Calling...' : 'Connecting...'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Local User Picture-in-Picture Video */}
          <div className="absolute bottom-6 right-6 h-44 w-32 sm:h-52 sm:w-40 overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-950 shadow-2xl z-10 group">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`h-full w-full object-cover scale-x-[-1] ${cameraOff ? 'hidden' : ''}`} 
            />
            {cameraOff && (
              <div className="flex h-full flex-col items-center justify-center bg-slate-900 text-slate-400 p-2 text-center">
                <User size={24} className="mb-1 text-slate-500" />
                <span className="text-[11px]">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              You {micMuted && '(Muted)'}
            </div>
          </div>

          {/* Floating Call Action Controls Bar */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-950/80 border border-white/15 px-4 py-3 shadow-2xl backdrop-blur-lg z-10">
            {/* Mic Toggle */}
            <button 
              type="button" 
              onClick={handleToggleMic} 
              className={`rounded-full p-3.5 text-white transition-all transform active:scale-90 ${
                micMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/15 hover:bg-white/25'
              }`} 
              title={micMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Camera Toggle */}
            <button 
              type="button" 
              onClick={handleToggleCamera} 
              className={`rounded-full p-3.5 text-white transition-all transform active:scale-90 ${
                cameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/15 hover:bg-white/25'
              }`} 
              title={cameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            {/* Screen Share Toggle */}
            <button 
              type="button" 
              onClick={handleToggleScreenShare} 
              className={`rounded-full p-3.5 text-white transition-all transform active:scale-90 ${
                isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/15 hover:bg-white/25'
              }`} 
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              <MonitorUp size={20} />
            </button>

            {/* End Call Button */}
            <button 
              type="button" 
              onClick={handleEndCall} 
              className="rounded-full bg-red-600 p-3.5 text-white shadow-lg shadow-red-600/30 transition-all transform hover:bg-red-700 active:scale-90 ml-2" 
              title="End call"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallPage
