import { useEffect, useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Video, 
  Phone, 
  Users, 
  Check, 
  Trash2, 
  MessageSquare,
  ArrowUpRight,
  GraduationCap
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Avatar from '../components/Avatar'
import { getScheduleData, getConnections, getSessionJoinStatus } from '../services/api'
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebaseClient'

function SchedulePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [scheduleData, setScheduleData] = useState(null)
  const [partnersList, setPartnersList] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'completed'
  const [form, setForm] = useState({ 
    topic: '', 
    skill: location.state?.skill || 'React', 
    date: '', 
    time: '', 
    duration: '60 mins', 
    partnerId: location.state?.partnerId || '' 
  })
  const [selectedDate, setSelectedDate] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  const fetchSchedule = async () => {
    try {
      const [schedData, connData] = await Promise.all([
        getScheduleData(), 
        getConnections()
      ])
      setScheduleData(schedData)
      setPartnersList(connData?.connections || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [location.state])

  const selectedPartner = partnersList.find(p => p.id === form.partnerId) || null

  const validate = () => {
    const next = {}
    if (!form.topic.trim()) next.topic = 'Topic is required.'
    if (!form.partnerId) next.partnerId = 'Please select who you want to schedule with.'
    if (!form.date) next.date = 'Date is required.'
    if (!form.time) next.time = 'Time is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSuccessMsg(null)
    
    const user = auth.currentUser
    if (user) {
      const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString()
      const duration = parseInt(form.duration) || 60
      
      const newDoc = await addDoc(collection(db, 'classes'), {
        mentor_id: form.partnerId,
        learner_id: user.uid,
        topic: form.topic,
        skill: form.skill,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        status: 'upcoming'
      })

      const partnerName = selectedPartner?.name || 'Partner'
      const dateObj = new Date(`${form.date}T${form.time}`)

      const newClassItem = {
        id: newDoc.id,
        topic: form.topic,
        skill: form.skill,
        partnerName: partnerName,
        partnerId: form.partnerId,
        date: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scheduledAt: scheduledAt,
        duration: duration,
        status: 'upcoming',
        isMentor: false
      }

      setScheduleData(current => ({
        ...current,
        upcoming: [newClassItem, ...(current?.upcoming || [])]
      }))
    }

    setForm(prev => ({ ...prev, topic: '', date: '', time: '' }))
    setSelectedDate(null)
    setErrors({})
    setSubmitting(false)
    setSuccessMsg(`Session successfully scheduled!`)
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  const handleMarkComplete = async (classId) => {
    try {
      if (classId) {
        await updateDoc(doc(db, 'classes', classId), { status: 'completed' })
      }
      setScheduleData(current => {
        const completedItem = (current?.upcoming || []).find(c => c.id === classId)
        return {
          ...current,
          upcoming: (current?.upcoming || []).filter(c => c.id !== classId),
          completed: completedItem ? [{ ...completedItem, status: 'completed' }, ...(current?.completed || [])] : (current?.completed || [])
        }
      })
      setSuccessMsg('Session marked as completed!')
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      console.error('Failed to mark class as complete:', err)
    }
  }

  const handleCancelSession = async (classId) => {
    try {
      if (classId) {
        await deleteDoc(doc(db, 'classes', classId))
      }
      setScheduleData(current => ({
        ...current,
        upcoming: (current?.upcoming || []).filter(c => c.id !== classId)
      }))
    } catch (err) {
      console.error('Failed to cancel session:', err)
    }
  }

  if (loading || !scheduleData) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
          <div className="h-28 rounded-3xl bg-slate-200" />
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="h-96 rounded-3xl bg-slate-200" />
            <div className="h-96 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </AppLayout>
    )
  }

  const { upcoming = [], completed = [] } = scheduleData
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dates = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        
        {/* Header with Navigation Tabs */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Calendar size={14} /> Schedule & Availability
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Session Planner</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your upcoming live 1-on-1 swaps, view past completed classes, and book new mentorship sessions.
            </p>
          </div>

          {/* Upcoming vs Completed Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-auto">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'upcoming' 
                  ? 'bg-white text-violet-700 shadow-sm font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcoming.length})
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'completed' 
                  ? 'bg-white text-emerald-700 shadow-sm font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completed.length})
            </button>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          
          {/* Left Column: Calendar & Schedules (Upcoming or Completed) */}
          <div className="space-y-6">
            
            {/* Interactive Calendar Card */}
            <Card className="p-6 rounded-3xl border-slate-200/80 bg-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <Calendar size={18} className="text-violet-600" />
                  <span>Interactive Calendar Date Picker</span>
                </div>
                {form.date && (
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-xl border border-violet-100">
                    Selected: {form.date}
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs">
                {days.map((day) => (
                  <div key={day} className="font-bold text-slate-400 py-1 uppercase tracking-wider text-[10px]">
                    {day}
                  </div>
                ))}
                {dates.map((date) => {
                  const isSelected = selectedDate === date
                  const todayStr = new Date().toISOString().slice(0, 7) // YYYY-MM
                  return (
                    <button 
                      key={date}
                      type="button" 
                      onClick={() => {
                        setSelectedDate(date)
                        setForm(prev => ({ ...prev, date: `${todayStr}-${date.toString().padStart(2, '0')}` }))
                      }}
                      className={`rounded-2xl py-2.5 font-bold transition-all text-xs cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/25 scale-105' 
                          : 'bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700'
                      }`}
                    >
                      {date}
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* TAB 1: Upcoming Schedules */}
            {activeTab === 'upcoming' && (
              <Card className="p-6 rounded-3xl border-slate-200/80 bg-white">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-violet-600" />
                    <h2 className="text-base font-black text-slate-900">Upcoming Planned Schedules</h2>
                  </div>
                  <Badge tone="purple" className="font-bold">{upcoming.length} Active</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {upcoming.length > 0 ? (
                    upcoming.map((cls) => {
                      const joinStatus = getSessionJoinStatus(cls.scheduledAt, cls.duration || 60)
                      return (
                        <div 
                          key={cls.id || `${cls.topic}-${cls.time}`} 
                          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-white hover:border-slate-200 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar name={cls.partnerName} size="md" status="online" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-extrabold text-slate-900 text-sm">{cls.topic}</p>
                                {cls.skill && <Badge tone="blue" className="text-[10px] px-2 py-0.5">{cls.skill}</Badge>}
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                                  {cls.isMentor ? 'Teaching' : 'Learning'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                With <span className="font-semibold text-violet-700">{cls.partnerName}</span> • {cls.duration || 60} mins
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                              <Clock size={13} className="text-violet-500" />
                              <span>{cls.date} at {cls.time}</span>
                            </div>

                            {cls.partnerId && (
                              joinStatus.canJoin ? (
                                <Button 
                                  className="px-3.5 py-1.5 text-xs font-bold shadow-sm shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                                  onClick={() => navigate(`/call/${cls.partnerId}`)}
                                >
                                  <Video size={13} className="mr-1" /> Join Live Call
                                </Button>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => alert(`This session is scheduled for ${cls.date} at ${cls.time}. The live video room unlocks 15 minutes before the session starts.`)}
                                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-200/80 text-slate-600 hover:bg-slate-300/80 transition cursor-pointer flex items-center gap-1"
                                  title="Live room opens 15 mins before start time"
                                >
                                  <Clock size={12} className="text-slate-500" /> Starts {joinStatus.timeUntil || cls.time}
                                </button>
                              )
                            )}

                            <Button 
                              variant="outline"
                              className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleMarkComplete(cls.id)}
                              title="Mark as Completed"
                            >
                              <Check size={13} />
                            </Button>

                            <button 
                              type="button"
                              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              onClick={() => handleCancelSession(cls.id)}
                              title="Cancel Session"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm">No upcoming sessions scheduled.</p>
                      <p className="mt-1">Use the booking form to plan your next 1-on-1 swap with a connection.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* TAB 2: Completed Schedules */}
            {activeTab === 'completed' && (
              <Card className="p-6 rounded-3xl border-slate-200/80 bg-white">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h2 className="text-base font-black text-slate-900">Completed Schedules & History</h2>
                  </div>
                  <Badge tone="green" className="font-bold">{completed.length} Completed</Badge>
                </div>

                <div className="mt-4 space-y-3">
                  {completed.length > 0 ? (
                    completed.map((cls) => (
                      <div 
                        key={cls.id || `${cls.topic}-${cls.time}`} 
                        className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-white hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={cls.partnerName} size="md" status="offline" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-slate-900 text-sm">{cls.topic}</p>
                              {cls.skill && <Badge tone="blue" className="text-[10px] px-2 py-0.5">{cls.skill}</Badge>}
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <Check size={10} /> Completed
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Partner: <span className="font-semibold text-slate-700">{cls.partnerName}</span> • {cls.date} at {cls.time}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button 
                            variant="outline"
                            className="px-3 py-1.5 text-xs font-bold border-violet-200 text-violet-700 hover:bg-violet-50"
                            onClick={() => {
                              setForm(prev => ({ 
                                ...prev, 
                                partnerId: cls.partnerId || '', 
                                topic: `Follow-up: ${cls.topic}`, 
                                skill: cls.skill || 'React' 
                              }))
                              setActiveTab('upcoming')
                            }}
                          >
                            Book Again
                          </Button>
                          <Button 
                            variant="outline"
                            className="px-3 py-1.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => navigate('/messages')}
                          >
                            <MessageSquare size={13} className="mr-1" /> Message
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200">
                      <p className="font-semibold text-slate-700 text-sm">No completed classes yet.</p>
                      <p className="mt-1">When you finish a scheduled session, mark it complete to track your exchange history.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

          </div>

          {/* Right Column: Schedule New Session Form */}
          <Card className="h-fit space-y-5 p-6 rounded-3xl border-slate-200/80 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Plus size={16} />
                </div>
                <h2 className="text-base font-black text-slate-900">Book a New Session</h2>
              </div>
              <Badge tone="purple" className="font-bold">1-on-1 Swap</Badge>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-700 animate-in fade-in duration-200">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              
              {/* Partner Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Select Connection *</label>
                  <span className="text-[11px] text-violet-600 font-semibold">{partnersList.length} Connected</span>
                </div>
                
                {partnersList.length > 0 ? (
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 cursor-pointer"
                    value={form.partnerId}
                    onChange={(event) => setForm({ ...form, partnerId: event.target.value })}
                  >
                    <option value="">Select an accepted connection...</option>
                    {partnersList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role || 'Connected Peer'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-500 flex flex-col gap-2">
                    <p>You haven&apos;t connected with any peers yet. You can schedule 1-on-1 sessions once a connection request is accepted.</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="text-xs py-1.5 w-fit" 
                      onClick={() => navigate('/search')}
                    >
                      Explore &amp; Connect with Peers
                    </Button>
                  </div>
                )}
                {errors.partnerId && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.partnerId}</p>}
              </div>

              {/* Dynamic Selected Partner Card */}
              {selectedPartner && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-violet-50/80 border border-violet-200/80 animate-in fade-in zoom-in-95 duration-200">
                  <Avatar name={selectedPartner.name} size="md" status="online" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{selectedPartner.name}</p>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-[11px] text-violet-700 font-semibold truncate mt-0.5">
                      {selectedPartner.role || 'Skill Partner'}
                    </p>
                  </div>
                  <Badge tone="purple" className="text-[10px]">Active Match</Badge>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Topic / Focus *</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                  placeholder="e.g. React Hooks Deep Dive, Spanish Conversation"
                  value={form.topic}
                  onChange={(event) => setForm({ ...form, topic: event.target.value })}
                />
                {errors.topic && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.topic}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Skill</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-400"
                    value={form.skill}
                    onChange={(event) => setForm({ ...form, skill: event.target.value })}
                  >
                    <option>React</option>
                    <option>Python</option>
                    <option>UI/UX Design</option>
                    <option>JavaScript</option>
                    <option>Data Science</option>
                    <option>Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-400"
                    value={form.duration}
                    onChange={(event) => setForm({ ...form, duration: event.target.value })}
                  >
                    <option>30 mins</option>
                    <option>45 mins</option>
                    <option>60 mins</option>
                    <option>90 mins</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-400"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                  />
                  {errors.date && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Time *</label>
                  <input
                    type="time"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-violet-400"
                    value={form.time}
                    onChange={(event) => setForm({ ...form, time: event.target.value })}
                  />
                  {errors.time && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.time}</p>}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="flex-1 text-xs" 
                  onClick={() => {
                    setForm({ topic: '', skill: 'React', date: '', time: '', duration: '60 mins', partnerId: '' })
                    setSelectedDate(null)
                    setErrors({})
                  }}
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 text-xs shadow-md shadow-violet-500/25 font-bold" 
                  disabled={submitting}
                >
                  {submitting ? 'Scheduling...' : 'Schedule Class'}
                </Button>
              </div>

            </form>
          </Card>

        </div>

      </div>
    </AppLayout>
  )
}

export default SchedulePage

