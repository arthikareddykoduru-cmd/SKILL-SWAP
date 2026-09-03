import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  BadgeCheck, 
  CalendarDays, 
  MessageCircle, 
  Phone, 
  Video, 
  MapPin, 
  ArrowLeft, 
  UserX, 
  UserPlus, 
  Check, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Clock,
  ShieldCheck,
  Star
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import { getProfileData, getConnections, sendConnectionRequest, startConversation } from '../services/api'

function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [requestedIds, setRequestedIds] = useState(new Set())
  const [connectedIds, setConnectedIds] = useState(new Set())
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    Promise.all([getProfileData(id), getConnections()])
      .then(([data, connData]) => {
        if (mounted) {
          setProfile(data)
          const reqIds = new Set((connData?.sentRequests || []).map(r => r.receiverId))
          setRequestedIds(reqIds)
          const connIds = new Set((connData?.connections || []).map(c => c.id))
          setConnectedIds(connIds)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Error fetching profile:', err)
        if (mounted) {
          setProfile(null)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [id])

  const handleConnect = async () => {
    if (!profile || requestedIds.has(profile.id) || connectedIds.has(profile.id)) return
    setError(null)
    try {
      const success = await sendConnectionRequest(profile.id)
      if (success) {
        setRequestedIds(prev => new Set(prev).add(profile.id))
      } else {
        setError('Failed to send connection request. Please try again.')
      }
    } catch (e) {
      console.error(e)
      setError('Failed to send connection request. Please try again.')
    }
  }

  const handleMessage = async () => {
    if (!profile) return
    const convId = await startConversation(profile.id)
    if (convId) {
      navigate('/messages', { state: { conversationId: convId } })
    }
  }

  // Loading Skeleton View
  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-3xl bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="h-32 rounded-3xl bg-slate-200" />
              <div className="h-48 rounded-3xl bg-slate-200" />
            </div>
            <div className="h-64 rounded-3xl bg-slate-200" />
          </div>
        </div>
      </AppLayout>
    )
  }

  // Not Found / Unavailable View
  if (!profile) {
    return (
      <AppLayout>
        <Card className="p-12 text-center max-w-lg mx-auto my-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600 mb-4">
            <UserX size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Profile Unavailable</h2>
          <p className="mt-2 text-sm text-slate-500">
            The profile you are looking for does not exist or has not been configured yet.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft size={16} /> Go Back
            </Button>
            <Button onClick={() => navigate('/search')}>
              Explore Skills
            </Button>
          </div>
        </Card>
      </AppLayout>
    )
  }

  const { 
    name = 'Community Member', 
    role = 'Learner & Mentor', 
    location = '', 
    about = '', 
    stats = [], 
    learningSkills = [], 
    teachingSkills = [],
    schedule = []
  } = profile || {}

  const isConnected = connectedIds.has(profile.id)
  const isPending = requestedIds.has(profile.id)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        
        {/* Top Breadcrumb & Return Bar */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            className="text-xs px-3.5 py-1.5 gap-1.5 rounded-xl border-slate-200" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={14} /> Back to Search
          </Button>
          <Badge tone="purple" className="px-3 py-1 font-semibold">Skill Swap Member</Badge>
        </div>

        {/* Profile Hero Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          {/* Cover Gradient Banner */}
          <div className="h-44 sm:h-52 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 relative overflow-hidden">
            {/* Ambient decorative overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute top-0 left-1/4 h-32 w-32 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-semibold border border-white/20 shadow-xs">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Verified Swapper</span>
            </div>
          </div>

          {/* Profile Header Details Container */}
          <div className="px-6 pb-6 sm:px-8">
            {/* Top row: Avatar overlapping banner + Action connect button */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              
              {/* Avatar with thick white ring */}
              <div className="relative self-start rounded-full p-1 bg-white shadow-xl ring-4 ring-white">
                <Avatar 
                  name={name} 
                  size="xl" 
                  status="online"
                />
              </div>

              {/* Connect / Pending / Connected Button */}
              <div className="flex items-center gap-3 sm:pb-1">
                <Button 
                  className={`px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm ${
                    isConnected
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : isPending
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-none'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/25'
                  }`} 
                  onClick={handleConnect}
                  disabled={isPending || isConnected}
                >
                  {isConnected ? (
                    <><Check size={16} className="mr-1.5" /> Connected</>
                  ) : isPending ? (
                    <><Clock size={16} className="mr-1.5 text-amber-500" /> Request Pending</>
                  ) : (
                    <><UserPlus size={16} className="mr-1.5" /> Connect</>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-xs font-medium text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {/* Profile Identity Details on White Background */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
                <BadgeCheck size={22} className="text-blue-500 fill-blue-500/20 shrink-0" />
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-sm font-medium text-slate-600">
                <span className="text-violet-600 font-semibold">{role || 'Learner & Mentor'}</span>
                {location && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin size={14} className="text-slate-400" /> {location}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button 
                  variant="outline" 
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 text-slate-700" 
                  onClick={handleMessage}
                >
                  <MessageCircle size={15} className="mr-1.5 text-violet-600" /> Send Message
                </Button>
                
                <Button 
                  variant="outline" 
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl border-slate-200 text-slate-700 ${!isConnected ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                  onClick={() => isConnected && navigate('/schedule', { state: { partnerId: profile.id, partnerName: profile.name, skill: profile.teachingSkills?.[0] } })}
                  disabled={!isConnected}
                >
                  <CalendarDays size={15} className="mr-1.5 text-indigo-600" /> Book Session
                </Button>
                
                <Button 
                  variant="outline" 
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl border-slate-200 text-slate-700 ${!isConnected ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' : 'hover:border-emerald-300 hover:bg-emerald-50/50'}`}
                  onClick={() => isConnected && navigate(`/call/${profile.id}`)}
                  disabled={!isConnected}
                >
                  <Phone size={15} className="mr-1.5 text-emerald-600" /> Voice Call
                </Button>
                
                <Button 
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all ${
                    isConnected 
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/20' 
                      : 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
                  }`}
                  onClick={() => isConnected && navigate(`/call/${profile.id}`)}
                  disabled={!isConnected}
                >
                  <Video size={15} className="mr-1.5" /> Live Video Session
                </Button>
              </div>

              {!isConnected && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50/80 border border-amber-200/60 px-3 py-1.5 rounded-xl font-medium">
                  <span>🔒 Direct calls & session booking unlock after connecting</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* Left Column: Stats, Bio, Skills */}
          <div className="space-y-6">
            
            {/* Stats Counter */}
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {stats.map((item, idx) => {
                  const icons = [
                    <BookOpen size={16} className="text-violet-500" key="book" />,
                    <Clock size={16} className="text-indigo-500" key="clock" />,
                    <Star size={16} className="text-amber-500 fill-amber-400" key="star" />
                  ]
                  return (
                    <Card key={item.label} className="p-4 sm:p-5 text-center rounded-2xl border-slate-200/80 shadow-xs hover:border-violet-200 transition-all bg-white">
                      <div className="flex items-center justify-center gap-1 mb-1 text-slate-400">
                        {icons[idx % icons.length]}
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-slate-900">{item.value}</p>
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.label}</p>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* About Card */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs p-6 bg-white">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> About
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {about || `${name} is an active member on SkillSwap. Connect with ${name} to exchange skills and collaborate on learning goals.`}
              </p>
            </Card>

            {/* Skills Teaching & Learning */}
            <Card className="space-y-6 rounded-2xl border-slate-200/80 shadow-xs p-6 bg-white">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-3">
                  <GraduationCap size={18} className="text-blue-600" />
                  <h3>Skills Teaching</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teachingSkills && teachingSkills.filter(Boolean).length > 0 ? (
                    teachingSkills.filter(Boolean).map((skill) => (
                      <Badge key={skill} tone="blue" className="px-3 py-1 font-semibold">{skill}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No teaching skills listed yet</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-3">
                  <BookOpen size={18} className="text-violet-600" />
                  <h3>Skills Learning</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {learningSkills && learningSkills.filter(Boolean).length > 0 ? (
                    learningSkills.filter(Boolean).map((skill) => (
                      <Badge key={skill} tone="purple" className="px-3 py-1 font-semibold">{skill}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No learning skills listed yet</span>
                  )}
                </div>
              </div>
            </Card>

          </div>

          {/* Right Column: Availability & Location */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200/80 shadow-xs p-6 bg-white">
              <div className="flex items-center gap-2 font-bold text-slate-900 pb-3 border-b border-slate-100">
                <CalendarDays size={18} className="text-violet-600" /> Weekly Availability
              </div>
              
              <div className="mt-4 space-y-2">
                {schedule && schedule.length > 0 ? (
                  schedule.map(([day, time]) => (
                    <div key={day} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs border border-slate-100">
                      <span className="font-bold text-slate-800">{day}</span>
                      <span className="font-semibold text-violet-600">{time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">Available by message appointment</p>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-100 flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" /> 
                <span>{location || 'Remote / Worldwide'}</span>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </AppLayout>
  )
}

export default ProfilePage

