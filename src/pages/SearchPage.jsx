import { useEffect, useMemo, useState } from 'react'
import { Filter, Search as SearchIcon, Star, UserPlus, Check, Sparkles, MessageCircle, Phone, Video, BookOpen, GraduationCap, Clock, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'
import { getSearchResults, getConnections, sendConnectionRequest, startConversation } from '../services/api'

const popularSkills = ['All Skills', 'Python', 'React', 'JavaScript', 'UI/UX Design', 'Node.js', 'Spanish', 'Data Science', 'AWS', 'Public Speaking']

function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [results, setResults] = useState([])
  const [query, setQuery] = useState(initialQuery)
  const [selectedSkill, setSelectedSkill] = useState('All Skills')
  const [experience, setExperience] = useState([])
  const [availableThisWeek, setAvailableThisWeek] = useState(false)
  const [language, setLanguage] = useState('All Languages')
  const [loading, setLoading] = useState(true)
  const [requestedIds, setRequestedIds] = useState(new Set())
  const [connectedIds, setConnectedIds] = useState(new Set())

  useEffect(() => {
    const qParam = searchParams.get('q')
    if (qParam !== null) {
      setQuery(qParam)
    }
  }, [searchParams])

  useEffect(() => {
    let mounted = true
    Promise.all([getSearchResults(), getConnections()]).then(([data, connData]) => {
      if (mounted) {
        setResults(data)
        
        const reqIds = new Set((connData?.sentRequests || []).map(r => r.receiverId))
        setRequestedIds(reqIds)
        
        const connIds = new Set((connData?.connections || []).map(c => c.id))
        setConnectedIds(connIds)
        
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    return results.filter((person) => {
      // 1. Keyword search matches Name, Role, Teaching Skills, Learning Skills
      const matchQuery = !q ? true : (
        person.name?.toLowerCase().includes(q) || 
        person.role?.toLowerCase().includes(q) ||
        (person.teachingSkills && person.teachingSkills.some(s => s.toLowerCase().includes(q))) ||
        (person.learningSkills && person.learningSkills.some(s => s.toLowerCase().includes(q)))
      )

      // 2. Popular skill chip selector
      const matchSkill = selectedSkill === 'All Skills' || (
        person.role?.toLowerCase().includes(selectedSkill.toLowerCase()) ||
        (person.teachingSkills && person.teachingSkills.some(s => s.toLowerCase().includes(selectedSkill.toLowerCase()))) ||
        (person.learningSkills && person.learningSkills.some(s => s.toLowerCase().includes(selectedSkill.toLowerCase())))
      )

      // 3. Experience level sidebar filter
      const matchExp = experience.length === 0 || (
        person.experience && experience.includes(person.experience)
      )

      // 4. Language filter
      const matchLang = language === 'All Languages' || (
        person.language && person.language.toLowerCase() === language.toLowerCase()
      )

      return matchQuery && matchSkill && matchExp && matchLang
    })
  }, [query, results, selectedSkill, experience, language])

  const handleFilterChange = (option) => {
    setExperience((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])
  }

  const handleConnect = async (targetUserId) => {
    try {
      if (!targetUserId) return
      const success = await sendConnectionRequest(targetUserId)
      if (success) {
        setRequestedIds(prev => new Set(prev).add(targetUserId))
      }
    } catch (error) {
      console.error('Connect request failed:', error)
    }
  }

  const handleStartMessage = async (targetUserId) => {
    try {
      const convId = await startConversation(targetUserId)
      if (convId) {
        navigate('/messages', { state: { conversationId: convId } })
      }
    } catch (e) {
      console.error('Error starting conversation:', e)
    }
  }

  const resetAllFilters = () => {
    setQuery('')
    setSelectedSkill('All Skills')
    setExperience([])
    setLanguage('All Languages')
    setAvailableThisWeek(false)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles size={14} /> Global Skill Directory
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Explore & Swap Skills</h1>
            <p className="mt-1 text-sm text-slate-500">
              Discover mentors and peers to learn from, teach, and exchange skills 1-on-1.
            </p>
          </div>
          <div className="rounded-full bg-violet-50 border border-violet-200/60 px-4 py-1.5 text-xs font-bold text-violet-700 shadow-2xs">
            {filteredResults.length} community members found
          </div>
        </div>

        {/* Search & Tag Chips */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
            <SearchIcon size={20} className="text-slate-400 shrink-0" />
            <input
              className="w-full bg-transparent pl-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              placeholder="Search by skill name (e.g. JavaScript, Python, React, UI/UX), name, or role..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search mentors"
            />
            {query && (
              <button 
                onClick={() => setQuery('')} 
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 flex items-center gap-1 cursor-pointer"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>

          {/* Quick Skill Tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold shrink-0">Popular:</span>
            {popularSkills.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSkill(s)}
                className={`rounded-full px-3.5 py-1.5 font-semibold transition shrink-0 cursor-pointer ${
                  selectedSkill === s
                    ? 'bg-violet-600 text-white shadow-xs shadow-violet-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        {/* Main Content Layout */}
        <div className="grid gap-6 lg:grid-cols-[0.3fr_0.7fr] xl:grid-cols-[0.25fr_0.75fr]">
          
          {/* Filter Sidebar */}
          <Card className="h-fit space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Filter size={17} className="text-violet-600" /> Filters
              </div>
              {(experience.length > 0 || language !== 'All Languages' || selectedSkill !== 'All Skills' || query) && (
                <button 
                  type="button" 
                  onClick={resetAllFilters} 
                  className="text-[11px] font-bold text-violet-600 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-5 text-xs text-slate-600">
              <div>
                <label className="block mb-2 font-bold text-slate-800">Experience Level</label>
                <div className="space-y-2">
                  {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                    <label key={level} className="flex items-center gap-2.5 cursor-pointer hover:text-slate-900 select-none">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                        checked={experience.includes(level)} 
                        onChange={() => handleFilterChange(level)} 
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-bold text-slate-800">Language</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-violet-400 cursor-pointer"
                  value={language} 
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option>All Languages</option>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>Hindi</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800 select-none">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                    checked={availableThisWeek} 
                    onChange={(event) => setAvailableThisWeek(event.target.checked)} 
                  />
                  <span>Available this week</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Results List */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-3xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((person) => (
                <Card 
                  key={person.id || person.name} 
                  hover 
                  className="flex flex-col gap-4 p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <Avatar name={person.name} status="online" size="lg" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 
                            className="text-base font-bold text-slate-900 hover:text-violet-600 transition cursor-pointer" 
                            onClick={() => navigate(`/profile/${person.id}`)}
                          >
                            {person.name}
                          </h3>
                          <Badge tone="purple" className="text-[10px]">
                            {person.role || 'Member'}
                          </Badge>
                          {person.experience && (
                            <Badge tone="blue" className="text-[10px]">
                              {person.experience}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1 font-semibold text-amber-500">
                            <Star size={13} fill="currentColor" /> {person.rating || '5.0'}
                          </div>
                          <span>•</span>
                          <span>{person.reviews || '12'} reviews</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Available for Swap
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-end sm:self-center">
                      <Button 
                        variant="outline" 
                        className="px-3 py-2 text-xs" 
                        onClick={() => handleStartMessage(person.id)}
                        title="Send Message"
                      >
                        <MessageCircle size={14} /> Message
                      </Button>

                      <Button 
                        variant="outline" 
                        className="px-3 py-2 text-xs" 
                        onClick={() => navigate(`/profile/${person.id}`)}
                      >
                        View Profile
                      </Button>
                      
                      <Button 
                        className={`px-4 py-2 text-xs font-bold shadow-md ${
                          connectedIds.has(person.id)
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : requestedIds.has(person.id)
                            ? 'bg-slate-100 text-slate-700 border border-slate-200 shadow-none'
                            : 'shadow-violet-500/20'
                        }`} 
                        onClick={() => handleConnect(person.id)}
                        disabled={requestedIds.has(person.id) || connectedIds.has(person.id)}
                      >
                        {connectedIds.has(person.id) ? (
                          <><Check size={14} /> Connected</>
                        ) : requestedIds.has(person.id) ? (
                          <><Clock size={13} className="text-amber-500" /> Pending</>
                        ) : (
                          <><UserPlus size={14} /> Connect</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Teaching & Learning Skill Tags Display */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                    {person.teachingSkills && person.teachingSkills.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                          <GraduationCap size={13} className="text-blue-600" /> Teaches:
                        </span>
                        {person.teachingSkills.slice(0, 3).map(skill => (
                          <span key={skill} className="rounded-lg bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {person.learningSkills && person.learningSkills.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                        <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                          <BookOpen size={13} className="text-violet-600" /> Learns:
                        </span>
                        {person.learningSkills.slice(0, 3).map(skill => (
                          <span key={skill} className="rounded-lg bg-violet-50 border border-violet-200/60 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-600 mb-3">
                  <SearchIcon size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No members found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  No matching skill partners for &quot;{query || selectedSkill}&quot;. Try adjusting your search query or reset filters.
                </p>
                <Button 
                  onClick={resetAllFilters} 
                  variant="outline" 
                  className="mt-4 text-xs font-bold"
                >
                  Reset All Filters
                </Button>
              </Card>
            )}
          </div>

        </div>

      </div>
    </AppLayout>
  )
}

export default SearchPage
