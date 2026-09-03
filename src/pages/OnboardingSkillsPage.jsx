import { Sparkles, Plus, X, BookOpen, GraduationCap, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import { addDoc, collection, doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { useAuth } from '../context/AuthContext'

const suggestedLearn = ['Python', 'React', 'Data Science', 'AI & ML', 'Cyber Security', 'Spanish', 'UI/UX Design']
const suggestedTeach = ['Public Speaking', 'Graphic Design', 'Photography', 'JavaScript', 'Digital Marketing', 'Music']

function OnboardingSkillsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Selected skill tags & bio
  const [learnSkills, setLearnSkills] = useState(['Python', 'React'])
  const [teachSkills, setTeachSkills] = useState(['Public Speaking'])
  const [bio, setBio] = useState('')
  
  // Input fields for manual typing
  const [learnInput, setLearnInput] = useState('')
  const [teachInput, setTeachInput] = useState('')

  // Add Learn Skill
  const handleAddLearn = () => {
    const trimmed = learnInput.trim().replace(/^,+|,+$/g, '')
    if (trimmed && !learnSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setLearnSkills(prev => [...prev, trimmed])
    }
    setLearnInput('')
  }

  // Add Teach Skill
  const handleAddTeach = () => {
    const trimmed = teachInput.trim().replace(/^,+|,+$/g, '')
    if (trimmed && !teachSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setTeachSkills(prev => [...prev, trimmed])
    }
    setTeachInput('')
  }

  // Remove tag
  const handleRemoveLearn = (skillToRemove) => {
    setLearnSkills(prev => prev.filter(s => s !== skillToRemove))
  }

  const handleRemoveTeach = (skillToRemove) => {
    setTeachSkills(prev => prev.filter(s => s !== skillToRemove))
  }

  const handleSave = async () => {
    if (!user) {
      navigate('/dashboard')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const bioToSave = bio.trim() || 'Passionate about sharing knowledge and learning new skills through 1-on-1 swaps.'

      // 1. Update the profile document directly with the entered skills and bio
      await updateDoc(doc(db, 'profiles', user.uid), {
        bio: bioToSave,
        skills_learning: learnSkills,
        skills_teaching: teachSkills,
        learningSkills: learnSkills,
        teachingSkills: teachSkills
      }).catch(async () => {
        // If updateDoc fails (e.g. fields missing), use setDoc with merge
        await setDoc(doc(db, 'profiles', user.uid), {
          bio: bioToSave,
          skills_learning: learnSkills,
          skills_teaching: teachSkills,
          learningSkills: learnSkills,
          teachingSkills: teachSkills
        }, { merge: true })
      })

      // 2. Also insert into skills collections
      if (learnSkills.length > 0) {
        await Promise.all(learnSkills.map(skill => 
          addDoc(collection(db, 'skills_learning'), { profile_id: user.uid, skill_name: skill, proficiency: 'Beginner' })
        ))
      }

      if (teachSkills.length > 0) {
        await Promise.all(teachSkills.map(skill => 
          addDoc(collection(db, 'skills_teaching'), { profile_id: user.uid, skill_name: skill, proficiency: 'Expert' })
        ))
      }

      navigate('/dashboard')
    } catch (err) {
      console.error('Error saving skills:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center selection:bg-violet-500 selection:text-white">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Personalization Setup</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">Enter Your Skills</h1>
          </div>
          <div className="rounded-full bg-violet-50 border border-violet-200/60 px-3.5 py-1 text-xs font-bold text-violet-700 w-fit">
            Step 2 of 2
          </div>
        </div>

        <Card className="p-7 sm:p-9 shadow-xl shadow-slate-200/50 border-slate-200/80 space-y-8">
          
          {/* Section 1: Skills You Want To Learn */}
          <section className="space-y-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <BookOpen size={18} className="text-violet-600" />
                <h2>Skills You Want to Learn</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Type any skills, tools, or subjects you'd like to learn or improve.</p>
            </div>

            {/* Manual Typing Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                <input 
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none" 
                  placeholder="Type a skill and press Enter (e.g. Python, SQL, Rust)..." 
                  value={learnInput}
                  onChange={(e) => setLearnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      handleAddLearn()
                    }
                  }}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleAddLearn} 
                className="px-4 py-2.5 text-xs font-bold shrink-0 shadow-md shadow-violet-500/20"
                disabled={!learnInput.trim()}
              >
                <Plus size={14} /> Add Skill
              </Button>
            </div>

            {/* Added Skills Chips */}
            <div className="min-h-[48px] rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 flex flex-wrap items-center gap-2">
              {learnSkills.length > 0 ? (
                learnSkills.map((skill) => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs shadow-violet-500/25 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <span>{skill}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveLearn(skill)} 
                      className="rounded-full p-0.5 hover:bg-white/20 transition cursor-pointer"
                      title={`Remove ${skill}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 font-medium px-1">No learning skills added yet. Type above to add.</span>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] pt-1">
              <span className="text-slate-400 font-semibold shrink-0">Suggestions:</span>
              {suggestedLearn.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (!learnSkills.includes(s)) setLearnSkills(prev => [...prev, s])
                  }}
                  className="rounded-full bg-slate-100 hover:bg-violet-100 hover:text-violet-700 px-2.5 py-1 font-semibold text-slate-600 transition shrink-0 cursor-pointer"
                >
                  + {s}
                </button>
              ))}
            </div>
          </section>

          {/* Section 2: Skills You Can Teach */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <GraduationCap size={18} className="text-blue-600" />
                <h2>Skills You Can Teach / Mentor</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Type the areas where you have knowledge, hobbies, or professional experience.</p>
            </div>

            {/* Manual Typing Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <input 
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none" 
                  placeholder="Type a skill and press Enter (e.g. Public Speaking, Graphic Design)..." 
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      handleAddTeach()
                    }
                  }}
                />
              </div>
              <Button 
                type="button" 
                onClick={handleAddTeach} 
                variant="secondary"
                className="px-4 py-2.5 text-xs font-bold shrink-0 shadow-md shadow-blue-500/20"
                disabled={!teachInput.trim()}
              >
                <Plus size={14} /> Add Skill
              </Button>
            </div>

            {/* Added Skills Chips */}
            <div className="min-h-[48px] rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 flex flex-wrap items-center gap-2">
              {teachSkills.length > 0 ? (
                teachSkills.map((skill) => (
                  <span 
                    key={skill} 
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs shadow-blue-500/25 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <span>{skill}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTeach(skill)} 
                      className="rounded-full p-0.5 hover:bg-white/20 transition cursor-pointer"
                      title={`Remove ${skill}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 font-medium px-1">No teaching skills added yet. Type above to add.</span>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] pt-1">
              <span className="text-slate-400 font-semibold shrink-0">Suggestions:</span>
              {suggestedTeach.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (!teachSkills.includes(s)) setTeachSkills(prev => [...prev, s])
                  }}
                  className="rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-700 px-2.5 py-1 font-semibold text-slate-600 transition shrink-0 cursor-pointer"
                >
                  + {s}
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: About / Short Bio */}
          <section className="space-y-3 pt-6 border-t border-slate-100">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Sparkles size={18} className="text-violet-600" />
                <h2>About You / Short Bio</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Tell the community a little about yourself, your learning goals, and what you love doing.</p>
            </div>

            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 min-h-[90px] resize-y"
              placeholder="e.g. Full-stack developer passionate about open-source and learning Spanish. Looking forward to 1-on-1 swaps!"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </section>

          {/* Footer Complete Setup Button */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
              <Button 
                onClick={handleSave} 
                disabled={loading} 
                className="w-full sm:w-auto px-7 py-3 text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/25"
              >
                {loading ? 'Saving...' : <><Sparkles size={16} /> Complete Setup & Enter Dashboard</>}
              </Button>
            </div>
          </div>

        </Card>
      </div>
    </div>
  )
}

export default OnboardingSkillsPage
