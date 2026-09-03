import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const getUserId = () => auth.currentUser?.uid

// Create and initiate an outgoing real-time call
export async function startCall(calleeId, calleeName, topic = 'Skill Swap Session') {
  const uid = getUserId()
  const user = auth.currentUser
  if (!uid || !calleeId) throw new Error('Cannot start call without recipient')

  const callerName = user.displayName || 'Skill Partner'

  const callDocRef = await addDoc(collection(db, 'calls'), {
    callerId: uid,
    calleeId: calleeId,
    callerName: callerName,
    calleeName: calleeName || 'Partner',
    status: 'ringing',
    topic: topic,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  // Send real-time incoming call notification to recipient
  try {
    await addDoc(collection(db, 'notifications'), {
      recipientId: calleeId,
      fromUserId: uid,
      type: 'incoming_call',
      callId: callDocRef.id,
      title: 'Incoming Skill Call',
      message: `${callerName} is calling you for a 1:1 Skill Swap session!`,
      read: false,
      created_at: serverTimestamp()
    })
  } catch (err) {
    console.warn('Call notification notice:', err)
  }

  return callDocRef.id
}

// Subscribe to incoming calls for current user
export function subscribeToIncomingCalls(callback) {
  const uid = getUserId()
  if (!uid) return () => {}

  const q = query(
    collection(db, 'calls'),
    where('calleeId', '==', uid)
  )

  return onSnapshot(q, (snapshot) => {
    const ringingCall = snapshot.docs.find(d => d.data().status === 'ringing')
    if (ringingCall) {
      callback({ id: ringingCall.id, ...ringingCall.data() })
    } else {
      callback(null)
    }
  }, (err) => {
    console.warn('Incoming calls listener note:', err.message)
  })
}

// Subscribe to live status of an active call
export function subscribeToCallStatus(callId, callback) {
  if (!callId) return () => {}
  const callDocRef = doc(db, 'calls', callId)
  return onSnapshot(callDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() })
    } else {
      callback({ status: 'ended' })
    }
  })
}

// Callee accepts incoming call
export async function acceptCall(callId) {
  if (!callId) return
  const callDocRef = doc(db, 'calls', callId)
  await updateDoc(callDocRef, {
    status: 'active',
    answeredAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

// Callee declines incoming call
export async function declineCall(callId) {
  if (!callId) return
  const callDocRef = doc(db, 'calls', callId)
  await updateDoc(callDocRef, {
    status: 'declined',
    endedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

// Either party hangs up
export async function endCall(callId) {
  if (!callId) return
  try {
    const callDocRef = doc(db, 'calls', callId)
    await updateDoc(callDocRef, {
      status: 'ended',
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (err) {
    console.warn('End call notice:', err)
  }
}
