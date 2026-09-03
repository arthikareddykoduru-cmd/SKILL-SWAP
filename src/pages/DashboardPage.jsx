import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { 
  Clock3, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Video, 
  ArrowUpRight, 
  MessageSquare,
  Users,
  CheckCircle2,
  Calendar,
  CalendarDays,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import { getDashboardData, subscribeToConnections } from '../services/api'

const TRENDING_SKILLS = [
  { name: 'UI/UX Design', icon: '🎨', query: 'UI/UX Design' },
  { name: 'React & Web', icon: '⚛️', query: 'React' },
  { name: 'Python & AI', icon: '🐍', query: 'Python' },
  { name: 'Mobile Apps', icon: '📱', query: 'React Native' },
  { name: 'Cloud & DevOps', icon: '☁️', query: 'AWS' },
  { name: 'Public Speaking', icon: '🗣️', query: 'Public Speaking' },
  { name: 'Spanish', icon: '🇪🇸', query: 'Spanish' },
  { name: 'Data Science', icon: '📊', query: 'Data Science' },
]

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    getDashboardData().then((data) => {
      if (mounted && data) {
        setDashboardData(prev => {
          if (!prev) return data
          const mergedCount = Math.max(data.stats?.connectionsCount || 0, prev.stats?.connectionsCount || 0)
          return {
            ...data,
            stats: {
              ...data.stats,
              connectionsCount: mergedCount
            },
            friends: prev.friends?.length > 0 ? prev.friends : (data.friends || [])
          }
        })
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })

    const unsubscribeConns = subscribeToConnections((connData) => {
      if (mounted) {
        const liveCount = connData?.connections ? connData.connections.length : 0
        setDashboardData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            stats: {
              ...prev.stats,
              connectionsCount: Math.max(liveCount, prev.stats?.connectionsCount || 0)
            },
            friends: connData?.connections?.length > 0 ? connData.connections : prev.friends
          }
        })
      }
    })

    return () => {
      mounted = false
      if (unsubscribeConns) unsubscribeConns()
    }
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
          <div className="h-48 rounded-3xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
            <div className="h-24 rounded-2xl bg-slate-200" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="h-72 rounded-3xl bg-slate-200" />
            <div className="h-72 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </AppLayout>
    )
  }

  const { 
    welcomeName = 'Member', 
    userRole = 'Skill Swapper',
    userLocation = '',
    learningSkills = [], 
    teachingSkills = [], 
    stats = {}, 
    upcomingClass, 
    allUpcomingClasses = [],
    mentors = [], 
    friends = [] 
  } = dashboardData || {}

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        
        {/* Real-world Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6 sm:p-9 text-white shadow-xl shadow-indigo-500/15 border border-white/10">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 h-56 w-56 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
                <Sparkles size={13} className="text-amber-300" /> Skill Swap Platform
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Welcome back, {welcomeName} 👋
              </h1>
              <p className="text-sm sm:text-base text-violet-100 font-medium leading-relaxed">
                Connect with members, exchange skills, and hold 1-on-1 audio/video mentorship sessions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <Button 
                onClick={() => navigate('/search')} 
                className="bg-white text-violet-700 hover:bg-violet-50 font-bold px-5 py-3 rounded-2xl shadow-lg shadow-black/10 border-0 transition-all"
              >
                <BookOpen size={16} className="text-violet-600" /> Explore Skills
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/schedule')} 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white font-bold px-4 py-3 rounded-2xl backdrop-blur-md transition-all"
              >
                <CalendarDays size={16} /> Schedule Session
              </Button>
            </div>
          </div>
        </div>

        {/* Real Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          
          <Card className="p-4 sm:p-5 rounded-2xl border-slate-200/80 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classes Completed</span>
              <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                <BookOpen size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.classesTaken ?? 0}</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">As learner</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border-slate-200/80 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classes Taught</span>
              <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <GraduationCap size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.classesTaught ?? 0}</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">As mentor</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl border-slate-200/80 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Classes</span>
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.upcomingClassesCount ?? 0}</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Scheduled sessions</p>
          </Card>

        </div>

        {/* Trending Skills Explorer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-violet-600" /> Explore Trending Skills &amp; Topics
            </h2>
            <Link to="/search" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
              Browse all <ArrowRight size={13} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {TRENDING_SKILLS.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-violet-400 hover:shadow-md hover:shadow-violet-500/10 transition-all text-xs font-bold text-slate-800 cursor-pointer text-center group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Real Skills Section */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Learning Skills */}
          <Card className="p-6 rounded-3xl border-slate-200/80 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">Skills You Want to Learn</span>
                    <h3 className="text-base font-bold text-slate-900">Learning Goals</h3>
                  </div>
                </div>
                <Link to="/settings" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                  Manage <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="mt-4">
                {learningSkills && learningSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {learningSkills.map((skill) => (
                      <Badge key={skill} tone="purple" className="px-3 py-1.5 font-bold text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">No learning skills added to your profile yet.</p>
                    <Button 
                      onClick={() => navigate('/settings')} 
                      variant="outline" 
                      className="mt-2 text-xs px-3 py-1.5 font-bold"
                    >
                      <Plus size={13} className="mr-1" /> Add Learning Skills
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Find members teaching these skills</span>
              <Button 
                onClick={() => navigate('/search')}
                variant="outline"
                className="text-xs px-3 py-1 font-bold rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                Find Mentors
              </Button>
            </div>
          </Card>

          {/* Teaching Skills */}
          <Card className="p-6 rounded-3xl border-slate-200/80 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Skills You Can Teach</span>
                    <h3 className="text-base font-bold text-slate-900">Teaching Expertise</h3>
                  </div>
                </div>
                <Link to="/settings" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Manage <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="mt-4">
                {teachingSkills && teachingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {teachingSkills.map((skill) => (
                      <Badge key={skill} tone="blue" className="px-3 py-1.5 font-bold text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">No teaching skills added to your profile yet.</p>
                    <Button 
                      onClick={() => navigate('/settings')} 
                      variant="outline" 
                      className="mt-2 text-xs px-3 py-1.5 font-bold"
                    >
                      <Plus size={13} className="mr-1" /> Add Teaching Skills
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Accept swap requests from peers</span>
              <Button 
                onClick={() => navigate('/connections')}
                variant="outline"
                className="text-xs px-3 py-1 font-bold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                View Requests
              </Button>
            </div>
          </Card>

        </div>

        {/* Real Upcoming Session & Recommended Mentors */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          
          {/* Upcoming Class Card */}
          <Card className="flex flex-col justify-between p-6 rounded-3xl border-slate-200/80 bg-white">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center gap-1.5">
                    <Calendar size={13} /> Next Scheduled Session
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {upcomingClass?.title || 'No upcoming classes'}
                  </h2>
                </div>
                {upcomingClass && (
                  <Badge 
                    tone={upcomingClass.joinStatus?.canJoin ? 'green' : 'purple'} 
                    className="px-3 py-1 font-bold"
                  >
                    {upcomingClass.joinStatus?.canJoin ? 'Live Room Open' : `Starts ${upcomingClass.joinStatus?.timeUntil || 'Soon'}`}
                  </Badge>
                )}
              </div>

              {upcomingClass ? (
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-slate-50 p-4 sm:p-5 border border-slate-200">
                  <div className="flex items-center gap-4">
                    <Avatar name={upcomingClass.partnerName} size="lg" status="online" />
                    <div>
                      <p className="font-extrabold text-slate-900 text-base">{upcomingClass.partnerName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                        <Clock3 size={13} className="text-violet-500" /> {upcomingClass.time} ({upcomingClass.dateStr})
                      </p>
                      {!upcomingClass.joinStatus?.canJoin && (
                        <p className="text-[11px] text-amber-700 font-medium mt-1">
                          Room opens 15 mins prior to start
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white px-3.5 py-2 text-center border border-slate-200 shadow-xs">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{upcomingClass.month || 'Upcoming'}</p>
                      <p className="text-xl font-black text-violet-600 leading-none mt-0.5">{upcomingClass.day || '•'}</p>
                    </div>

                    {upcomingClass.joinStatus?.canJoin ? (
                      <Button 
                        onClick={() => navigate(upcomingClass.partnerId ? `/call/${upcomingClass.partnerId}` : '/classes')}
                        className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 transition-all animate-pulse"
                      >
                        <Video size={15} className="mr-1.5" /> Join Live Call
                      </Button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => alert(`This session is scheduled for ${upcomingClass.dateStr} at ${upcomingClass.time}. The live video room unlocks 15 minutes before the session.`)}
                        className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-200/80 text-slate-600 hover:bg-slate-300/80 transition flex items-center gap-1.5 cursor-pointer"
                        title="Live room opens 15 mins before start time"
                      >
                        <Clock3 size={14} className="text-slate-500" /> Starts {upcomingClass.joinStatus?.timeUntil || upcomingClass.time}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="my-6 rounded-2xl bg-slate-50/80 p-6 text-center border border-dashed border-slate-200">
                  <div className="mx-auto h-12 w-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                    <CalendarDays size={24} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No scheduled classes</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Connect with a member to schedule your 1-on-1 audio/video skill exchange session.
                  </p>
                  <div className="mt-4 flex justify-center gap-2.5">
                    <Button onClick={() => navigate('/search')} className="text-xs px-4 py-2 font-bold rounded-xl">
                      Find a Mentor
                    </Button>
                    <Button onClick={() => navigate('/schedule')} variant="outline" className="text-xs px-4 py-2 font-bold rounded-xl border-slate-200">
                      Schedule a Class
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Video size={14} className="text-violet-600" /> WebRTC 1-on-1 video & screen sharing
              </span>
              <Link to="/classes" className="font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                View all classes <ArrowUpRight size={14} />
              </Link>
            </div>
          </Card>

          {/* Real Community Members */}
          <Card className="p-6 rounded-3xl border-slate-200/80 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900">Community Members</h2>
                <Link to="/search" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                  Explore <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="mt-4 space-y-2.5">
                {mentors && mentors.length > 0 ? (
                  mentors.slice(0, 3).map((mentor) => (
                    <div 
                      key={mentor.id || mentor.name} 
                      className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 hover:bg-slate-50 transition-all group cursor-pointer"
                      onClick={() => navigate(mentor.id ? `/profile/${mentor.id}` : '/search')}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={mentor.name} size="md" status="online" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">{mentor.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{mentor.skill || mentor.role}</p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(mentor.id ? `/profile/${mentor.id}` : '/search')
                        }} 
                        variant="outline" 
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border-slate-200 hover:bg-white hover:border-violet-300"
                      >
                        View Profile
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                    No other registered members found yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <Button 
                onClick={() => navigate('/search')} 
                variant="outline" 
                className="w-full text-xs font-bold py-2 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Browse All Members
              </Button>
            </div>
          </Card>

        </div>

        {/* Real Schedule & Connections */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Scheduled Sessions List */}
          <Card className="p-6 rounded-3xl border-slate-200/80 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-violet-600" />
                <h2 className="text-base font-black text-slate-900">Your Scheduled Classes</h2>
              </div>
              <Link to="/schedule" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                Schedule <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-2.5">
              {allUpcomingClasses && allUpcomingClasses.length > 0 ? (
                allUpcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs border border-slate-100">
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{cls.title}</p>
                      <p className="text-slate-500 font-semibold mt-0.5">With {cls.partnerName} • {cls.date}</p>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-violet-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <Clock3 size={13} className="text-violet-600" /> {cls.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">
                  <p>No classes scheduled yet.</p>
                  <Button 
                    onClick={() => navigate('/schedule')} 
                    variant="outline" 
                    className="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    Schedule a Session
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Real Connections */}
          <Card className="p-6 rounded-3xl border-slate-200/80 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                <h2 className="text-base font-black text-slate-900">Your Connections</h2>
              </div>
              <Link to="/connections" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                All <ArrowUpRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {friends && friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend.id || friend.name} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 hover:bg-slate-50 transition group">
                    <div className="flex items-center gap-3">
                      <Avatar name={friend.name} size="sm" status={friend.status || 'online'} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{friend.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{friend.role || 'Member'}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate('/messages')} 
                      variant="outline" 
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700"
                    >
                      <MessageSquare size={13} className="mr-1 text-violet-600" /> Message
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">
                  <p>You have no connections yet.</p>
                  <Button 
                    onClick={() => navigate('/connections')} 
                    variant="outline" 
                    className="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    Find Connections
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </AppLayout>
  )
}

export default DashboardPage


