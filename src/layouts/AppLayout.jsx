import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../lib/firebaseClient'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Button from '../components/Button'
import Card from '../components/Card'
import Avatar from '../components/Avatar'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { WebRTCService } from '../lib/webrtc'

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [callerProfile, setCallerProfile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let unsubscribe = () => {}
    
    // Listen for auth state to setup listener
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const callsQuery = query(
          collection(db, 'calls'),
          where('calleeId', '==', user.uid),
          where('status', '==', 'ringing')
        )

        unsubscribe = onSnapshot(callsQuery, async (snapshot) => {
          if (!snapshot.empty) {
            const callDoc = snapshot.docs[0]
            const callData = { id: callDoc.id, ...callDoc.data() }
            setIncomingCall(callData)

            // Fetch caller profile details
            if (callData.callerId) {
              try {
                const callerSnap = await getDoc(doc(db, 'profiles', callData.callerId))
                if (callerSnap.exists()) {
                  setCallerProfile(callerSnap.data())
                }
              } catch (e) {
                console.warn('Could not fetch caller profile:', e)
              }
            }
          } else {
            setIncomingCall(null)
            setCallerProfile(null)
          }
        })
      } else {
        unsubscribe()
        setIncomingCall(null)
        setCallerProfile(null)
      }
    })

    return () => {
      authUnsubscribe()
      unsubscribe()
    }
  }, [])

  const handleAcceptCall = () => {
    if (incomingCall) {
      navigate(`/call/${incomingCall.id}`, { state: { incoming: true } })
      setIncomingCall(null)
    }
  }

  const handleDeclineCall = async () => {
    if (incomingCall) {
      const webrtc = new WebRTCService()
      await webrtc.declineCall(incomingCall.id)
      setIncomingCall(null)
      setCallerProfile(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-violet-500 selection:text-white">
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onMenuToggle={() => setIsSidebarOpen((value) => !value)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 relative">
          {children}
          
          {/* Incoming Video Call Modal */}
          {incomingCall && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <Card className="w-full max-w-sm p-6 text-center shadow-2xl border-slate-200/80 animate-in zoom-in-95 duration-200 space-y-4">
                
                {/* Ringing Avatar with Pulsing Rings */}
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-violet-500/10 animate-pulse" />
                  <Avatar name={callerProfile?.full_name || 'Caller'} size="lg" status="online" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-0.5 text-xs font-bold text-violet-700 mb-1">
                    <Video size={13} className="animate-pulse text-violet-600" />
                    <span>Incoming 1-on-1 Call</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {callerProfile?.full_name || 'SkillSwap Peer'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">is calling you for a live session...</p>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button 
                    onClick={handleAcceptCall} 
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 shadow-lg shadow-emerald-500/25"
                  >
                    <Phone size={16} /> Accept Call
                  </Button>
                  <Button 
                    onClick={handleDeclineCall} 
                    variant="outline" 
                    className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-bold text-xs py-3"
                  >
                    <PhoneOff size={16} /> Decline
                  </Button>
                </div>

              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
