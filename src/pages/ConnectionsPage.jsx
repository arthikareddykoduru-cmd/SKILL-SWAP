import { useEffect, useState } from 'react'
import { Search, Phone, Video, MessageCircle, UserPlus, Check, Sparkles, UserCheck, Clock, Users, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'
import { sendConnectionRequest, startConversation, subscribeToConnections } from '../services/api'
import { doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

function ConnectionsPage() {
  const navigate = useNavigate()
  const [connectionsData, setConnectionsData] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [requestedIds, setRequestedIds] = useState(new Set())
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'requests' | 'suggestions'

  useEffect(() => {
    const unsubscribe = subscribeToConnections((data) => {
      setConnectionsData(data)
      setLoading(false)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const handleAccept = async (id, name, requesterId) => {
    try {
      if (id) {
        await updateDoc(doc(db, 'connections', id), { status: 'accepted' })
        if (requesterId) {
          await addDoc(collection(db, 'notifications'), {
            type: 'connection_accepted',
            content: `Your connection request was accepted`,
            recipientId: requesterId,
            relatedEntityId: id,
            created_at: serverTimestamp(),
            isRead: false
          })
        }
      }
      setConnectionsData((current) => {
        const existing = (current?.connections || []).filter(c => c.id !== requesterId)
        return {
          ...current,
          requests: (current?.requests || []).filter((item) => item.id !== id && item.requesterId !== requesterId),
          connections: [...existing, { id: requesterId, name, role: 'New Connection', status: 'online' }],
        }
      })
    } catch (e) {
      console.error(e)
      setError('Failed to accept request.')
    }
  }

  const handleReject = async (id, name) => {
    try {
      if (id) {
        await deleteDoc(doc(db, 'connections', id))
      }
      setConnectionsData((current) => ({
        ...current,
        requests: (current?.requests || []).filter((item) => item.name !== name),
      }))
    } catch (e) {
      console.error(e)
      setError('Failed to reject request.')
    }
  }

  const handleCancelSent = async (id) => {
    try {
      if (id) {
        await deleteDoc(doc(db, 'connections', id))
      }
      setConnectionsData((current) => ({
        ...current,
        sentRequests: (current?.sentRequests || []).filter((item) => item.id !== id),
      }))
    } catch (e) {
      console.error(e)
      setError('Failed to cancel sent request.')
    }
  }

  const handleConnect = async (personId) => {
    if (requestedIds.has(personId)) return
    try {
      const success = await sendConnectionRequest(personId)
      if (success) {
        setRequestedIds(prev => new Set(prev).add(personId))
      } else {
        setError('Failed to send connect request.')
      }
    } catch (e) {
      console.error(e)
      setError('Failed to send connect request.')
    }
  }

  const handleMessage = async (personId) => {
    try {
      const convId = await startConversation(personId)
      if (convId) {
        navigate('/messages', { state: { conversationId: convId } })
      } else {
        setError('Failed to start conversation.')
      }
    } catch (e) {
      console.error(e)
      setError('Failed to start conversation.')
    }
  }

  if (loading || !connectionsData) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-28 rounded-3xl bg-slate-200" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-slate-200" />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  const { connections = [], requests = [], sentRequests = [], suggestions = [] } = connectionsData
  const filteredConnections = connections.filter((person) => person.name?.toLowerCase().includes(query.toLowerCase()))
  const totalRequestsCount = requests.length + sentRequests.length

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Users size={14} /> My Skill Network
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Connections</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your skill swap network, review incoming and sent requests, and connect with peers.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-2xs">
            <Search size={16} className="text-slate-400" />
            <input
              className="w-full sm:w-48 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              placeholder="Filter connections..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search connections"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-violet-600 text-white shadow-xs shadow-violet-500/25'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Connections ({filteredConnections.length})
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-violet-600 text-white shadow-xs shadow-violet-500/25'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Requests
            {totalRequestsCount > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === 'requests' ? 'bg-white text-violet-700' : 'bg-violet-100 text-violet-700'
              }`}>
                {totalRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-violet-600 text-white shadow-xs shadow-violet-500/25'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Suggestions ({suggestions.length})
          </button>
        </div>

        {/* Active Tab View */}
        {activeTab === 'all' && (
          <div>
            {filteredConnections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredConnections.map((person) => (
                  <Card key={person.id || person.name} hover className="flex flex-col justify-between p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <Avatar name={person.name} size="md" status={person.status || 'online'} />
                      <div className="min-w-0 flex-1">
                        <h3 
                          className="font-bold text-slate-900 text-sm truncate hover:text-violet-600 transition cursor-pointer"
                          onClick={() => navigate(`/profile/${person.id}`)}
                        >
                          {person.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{person.role || 'Skill Swapper'}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 mt-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <Button 
                        variant="outline" 
                        className="px-3 py-1.5 text-xs" 
                        onClick={() => handleMessage(person.id)}
                      >
                        <MessageCircle size={14} /> Message
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button" 
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition cursor-pointer" 
                          aria-label={`Call ${person.name}`} 
                          onClick={() => navigate(`/call/${person.id}`)} 
                          title="Voice Call"
                        >
                          <Phone size={15} />
                        </button>
                        <button 
                          type="button" 
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition cursor-pointer" 
                          aria-label={`Video call ${person.name}`} 
                          onClick={() => navigate(`/call/${person.id}`)} 
                          title="Video Call"
                        >
                          <Video size={15} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center max-w-md mx-auto my-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-600 mb-3">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No connections yet</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Explore skills to connect with mentors and peers in your favorite subjects.
                </p>
                <Button onClick={() => navigate('/search')} className="mt-4 text-xs">
                  Explore Skills
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Requests Tab (Incoming & Outgoing Sent Requests) */}
        {activeTab === 'requests' && (
          <div className="space-y-8 max-w-3xl">
            
            {/* 1. Incoming Requests */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                  <ArrowDownLeft size={16} />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Received Requests ({requests.length})
                </h2>
              </div>

              {requests.length > 0 ? (
                <div className="space-y-2.5">
                  {requests.map((person) => (
                    <Card key={person.id || person.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-slate-200/80">
                      <div className="flex items-center gap-3.5">
                        <Avatar name={person.name} size="md" status="online" />
                        <div>
                          <h3 
                            className="text-sm font-bold text-slate-900 hover:text-violet-600 transition cursor-pointer"
                            onClick={() => navigate(`/profile/${person.requesterId || person.id}`)}
                          >
                            {person.name}
                          </h3>
                          <p className="text-xs text-slate-500">{person.role || 'Wants to connect with you'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          className="px-4 py-2 text-xs font-bold shadow-md shadow-violet-500/20" 
                          onClick={() => handleAccept(person.id, person.name, person.requesterId)}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          className="px-4 py-2 text-xs text-red-600 hover:bg-red-50" 
                          onClick={() => handleReject(person.id, person.name)}
                        >
                          Decline
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center text-xs text-slate-400 bg-slate-50/50">
                  No incoming connection requests.
                </Card>
              )}
            </div>

            {/* 2. Sent Outgoing Requests */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-violet-100 text-violet-700">
                  <ArrowUpRight size={16} />
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Sent Requests ({sentRequests.length})
                </h2>
              </div>

              {sentRequests.length > 0 ? (
                <div className="space-y-2.5">
                  {sentRequests.map((person) => (
                    <Card key={person.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-slate-200/80 bg-slate-50/40">
                      <div className="flex items-center gap-3.5">
                        <Avatar name={person.name} size="md" status="offline" />
                        <div>
                          <h3 
                            className="text-sm font-bold text-slate-900 hover:text-violet-600 transition cursor-pointer"
                            onClick={() => navigate(`/profile/${person.receiverId}`)}
                          >
                            {person.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Clock size={13} className="text-amber-500" />
                            <span className="font-semibold text-amber-600">Pending peer approval</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                          onClick={() => handleCancelSent(person.id)}
                        >
                          <X size={13} /> Cancel Request
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center text-xs text-slate-400 bg-slate-50/50">
                  No outgoing requests pending.
                </Card>
              )}
            </div>

          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.length > 0 ? (
              suggestions.map((person) => (
                <Card key={person.name} hover className="p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-3.5">
                    <Avatar name={person.name} size="md" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{person.name}</h3>
                      <p className="text-xs text-slate-500">{person.role || 'Recommended for you'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      className="px-3 py-1.5 text-xs" 
                      onClick={() => navigate(`/profile/${person.id}`)}
                    >
                      Profile
                    </Button>
                    <Button 
                      className="px-3.5 py-1.5 text-xs font-bold" 
                      onClick={() => handleConnect(person.id)}
                      disabled={requestedIds.has(person.id)}
                    >
                      {requestedIds.has(person.id) ? (
                        'Requested'
                      ) : (
                        <><UserPlus size={14} /> Connect</>
                      )}
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center text-xs text-slate-500">
                No new suggestions found right now.
              </Card>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  )
}

export default ConnectionsPage
