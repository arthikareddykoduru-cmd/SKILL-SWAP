import { useEffect, useState } from 'react'
import { Clock3, Star, Video, CalendarDays, BookOpen, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'
import { getClasses } from '../services/api'

function ClassesPage() {
  const navigate = useNavigate()
  const [classesData, setClassesData] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getClasses().then((data) => {
      if (mounted) {
        setClassesData(data)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-28 rounded-3xl bg-slate-200" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-3xl bg-slate-200" />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  const { upcoming = [], completed = [] } = classesData || {}

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider mb-1">
              <CalendarDays size={14} /> My Learning Calendar
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Classes & Sessions</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your live 1-on-1 video sessions, reviews, and mentorship bookings.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'upcoming' 
                  ? 'bg-white text-violet-700 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcoming.length})
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'completed' 
                  ? 'bg-white text-violet-700 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completed.length})
            </button>
            <button 
              onClick={() => setActiveTab('cancelled')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'cancelled' 
                  ? 'bg-white text-violet-700 shadow-2xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Tab 1: Upcoming Classes */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcoming.length > 0 ? (
              upcoming.map((classItem) => (
                <Card 
                  key={classItem.id || classItem.title} 
                  hover 
                  className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-5"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <Avatar name={classItem.mentor} size="lg" status="online" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base">{classItem.title}</h3>
                        <Badge tone="purple" className="text-[10px]">1-on-1 Class</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">With Mentor: <span className="font-semibold text-slate-700">{classItem.mentor}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 border border-slate-200">
                      <Clock3 size={14} className="text-violet-600" /> {classItem.dateStr} at {classItem.time}
                    </div>
                    <div className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 border border-violet-100">
                      {classItem.duration || '60 mins'}
                    </div>
                    {classItem.joinStatus?.canJoin ? (
                      <Button 
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 animate-pulse" 
                        onClick={() => navigate(`/call/${classItem.mentorId}`)}
                      >
                        <Video size={14} className="mr-1" /> Join Live Call
                      </Button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => alert(`This class is scheduled for ${classItem.dateStr} at ${classItem.time}. The live room unlocks 15 minutes before the session starts.`)}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-200/80 text-slate-600 hover:bg-slate-300/80 transition cursor-pointer flex items-center gap-1.5"
                        title="Live room opens 15 mins before start time"
                      >
                        <Clock3 size={13} className="text-slate-500" /> Starts {classItem.joinStatus?.timeUntil || classItem.time}
                      </button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center max-w-md mx-auto my-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-600 mb-3">
                  <CalendarDays size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No upcoming classes scheduled</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Book a lesson with a mentor in Explore Skills to start learning.
                </p>
                <Button onClick={() => navigate('/search')} className="mt-4 text-xs">
                  Explore Skills
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Completed Classes */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completed.length > 0 ? (
              completed.map((classItem) => (
                <Card key={classItem.id || classItem.title} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-5">
                  <div className="flex items-center gap-4">
                    <Avatar name={classItem.mentor} size="md" status="offline" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{classItem.title}</h3>
                        <Badge tone="green" className="text-[10px]">
                          <CheckCircle2 size={11} /> Completed
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">With {classItem.mentor}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Star size={13} fill="currentColor" /> {classItem.rating || '5.0'}
                    </div>
                    <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => navigate('/search')}>
                      Book Again
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center text-xs text-slate-500">
                No completed classes yet.
              </Card>
            )}
          </div>
        )}

        {/* Tab 3: Cancelled Classes */}
        {activeTab === 'cancelled' && (
          <Card className="p-12 text-center text-xs text-slate-500">
            No cancelled classes.
          </Card>
        )}

      </div>
    </AppLayout>
  )
}

export default ClassesPage
