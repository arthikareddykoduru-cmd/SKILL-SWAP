import { useEffect, useState } from 'react'
import { BellRing, Bell, CheckCircle2, UserPlus, Sparkles, Trash2, Video, Calendar, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { subscribeToNotifications } from '../services/api'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((data) => {
      setNotifications(data)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const handleAccept = async (notifId, connectionId) => {
    try {
      if (connectionId) {
        await updateDoc(doc(db, 'connections', connectionId), { status: 'accepted' })
      }
      await deleteDoc(doc(db, 'notifications', notifId))
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    } catch (e) {
      console.error(e)
      setError('Failed to accept connection.')
    }
  }

  const handleDecline = async (notifId, connectionId) => {
    try {
      if (connectionId) {
        await deleteDoc(doc(db, 'connections', connectionId))
      }
      await deleteDoc(doc(db, 'notifications', notifId))
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    } catch (e) {
      console.error(e)
      setError('Failed to decline connection.')
    }
  }

  const handleDismiss = async (notifId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notifId))
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Bell size={14} /> Activity Feed
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">
              Stay updated on skill swap requests, session reminders, and incoming messages.
            </p>
          </div>
          {notifications.length > 0 && (
            <Badge tone="purple">{notifications.length} Active</Badge>
          )}
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Notifications List */}
        <Card className="p-4 sm:p-6 space-y-3">
          {notifications.length > 0 ? (
            notifications.map(({ id, type, icon: Icon, tone, title, description, time, relatedEntityId, partnerId }) => (
              <div 
                key={id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:bg-white hover:border-slate-200 hover:shadow-2xs transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`rounded-2xl p-2.5 shrink-0 ${
                    tone === 'blue' 
                      ? 'bg-blue-100 text-blue-600' 
                      : tone === 'purple' 
                      ? 'bg-violet-100 text-violet-600' 
                      : tone === 'orange' 
                      ? 'bg-amber-100 text-amber-600' 
                      : tone === 'green' 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {Icon ? <Icon size={18} /> : <Bell size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{title}</span>
                      {type === 'session_starting' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                          Live Now
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{description}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{time || 'Recently'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {type === 'session_starting' || type === 'schedule_reminder' ? (
                    <div className="flex items-center gap-2">
                      <Button 
                        className={`px-3.5 py-1.5 text-xs font-bold ${
                          type === 'session_starting' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                            : 'bg-violet-600 hover:bg-violet-700 text-white'
                        }`}
                        onClick={() => navigate(partnerId ? `/call/${partnerId}` : '/classes')}
                      >
                        <Video size={14} className="mr-1" /> Join Call
                      </Button>
                      <button 
                        onClick={() => handleDismiss(id)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" 
                        title="Dismiss notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : title.includes('Connection') || title.includes('Request') ? (
                    <div className="flex items-center gap-2">
                      <Button className="px-3 py-1.5 text-xs font-bold" onClick={() => handleAccept(id, relatedEntityId)}>
                        Accept
                      </Button>
                      <Button variant="outline" className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50" onClick={() => handleDecline(id, relatedEntityId)}>
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleDismiss(id)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" 
                      title="Dismiss notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-600 mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">You're all caught up!</h3>
              <p className="mt-1 text-xs text-slate-500">
                No new notifications. 1-hour session reminders, live call alerts, and connection requests will appear here.
              </p>
            </div>
          )}
        </Card>

      </div>
    </AppLayout>
  )
}

export default NotificationsPage
