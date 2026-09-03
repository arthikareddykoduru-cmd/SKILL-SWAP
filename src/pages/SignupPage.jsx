import { Sparkles, ArrowRight, User, Mail, Lock, Phone, MapPin, Building, GraduationCap, BookOpen, Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Spinner from '../components/Spinner'

import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, collection, addDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebaseClient'

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    collegeOrCompany: '',
    skillsTeaching: '',
    skillsLearning: '',
    acceptTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required.'
    if (!form.username.trim()) next.username = 'Username is required.'
    if (!form.email.trim()) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.'
    }
    if (!form.password) {
      next.password = 'Password is required.'
    } else if (form.password.length < 6) {
      next.password = 'Password must be at least 6 characters.'
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match.'
    }
    if (!form.city.trim()) {
      next.city = 'City is required.'
    }
    if (!form.acceptTerms) {
      next.acceptTerms = 'You must accept the terms to continue.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const user = userCredential.user

      const teachingArray = form.skillsTeaching.split(',').map(s => s.trim()).filter(Boolean)
      const learningArray = form.skillsLearning.split(',').map(s => s.trim()).filter(Boolean)

      await setDoc(doc(db, 'profiles', user.uid), {
        id: user.uid,
        uid: user.uid,
        email: form.email,
        username: form.username,
        full_name: form.fullName,
        phone_number: form.phone,
        city: form.city.trim(),
        college_or_company: form.collegeOrCompany.trim(),
        college: form.collegeOrCompany.trim(),
        company: form.collegeOrCompany.trim(),
        organization: form.collegeOrCompany.trim(),
        skills_teaching: teachingArray,
        skills_learning: learningArray,
        role: 'Skill Swapper',
        credits: 5,
        created_at: new Date().toISOString()
      })

      // Add teaching skills to subcollection
      for (const skill of teachingArray) {
        try {
          await addDoc(collection(db, 'skills_teaching'), {
            profile_id: user.uid,
            skill_name: skill,
            level: 'Expert',
            created_at: new Date().toISOString()
          })
        } catch(e) {}
      }

      // Add learning skills to subcollection
      for (const skill of learningArray) {
        try {
          await addDoc(collection(db, 'skills_learning'), {
            profile_id: user.uid,
            skill_name: skill,
            level: 'Beginner',
            created_at: new Date().toISOString()
          })
        } catch(e) {}
      }

      setLoading(false)
      navigate('/dashboard')
    } catch (error) {
      setErrors({ ...errors, submit: error.message })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-violet-500 selection:text-white px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="p-7 sm:p-10 shadow-xl shadow-slate-200/50 border-slate-200/80">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/25">
              <Sparkles size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Join the SkillSwap Network</h1>
            <p className="text-xs sm:text-sm text-slate-500">Create your account to start sharing and learning skills.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            
            {errors.submit && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600">
                {errors.submit}
              </div>
            )}

            {/* Profile Avatar Preview */}
            <div className="flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-2xl font-black text-white shadow-md shadow-violet-500/20">
                {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <p className="mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Profile Icon</p>
            </div>

            {/* Form Fields Grid */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Full Name *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <User size={15} className="text-slate-400 shrink-0" />
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    value={form.fullName}
                    onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
                {errors.fullName && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Username *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <span className="text-slate-400 font-bold">@</span>
                  <input
                    name="nickname"
                    autoComplete="nickname"
                    placeholder="alexmorgan"
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                    className="w-full bg-transparent pl-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
                {errors.username && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Email Address *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <Mail size={15} className="text-slate-400 shrink-0" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username email"
                    placeholder="alex@example.com"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
                {errors.email && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Phone Number</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <input
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    placeholder="+1 555 0192"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Password *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <Lock size={15} className="text-slate-400 shrink-0" />
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
                {errors.password && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Confirm Password *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <Lock size={15} className="text-slate-400 shrink-0" />
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">City *</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <input
                    name="city"
                    placeholder="e.g. San Francisco, New York, Bangalore"
                    value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
                {errors.city && <p className="text-[11px] font-semibold text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">College or Company</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <Building size={15} className="text-slate-400 shrink-0" />
                  <input
                    name="organization"
                    placeholder="e.g. Stanford University / Google / Freelance"
                    value={form.collegeOrCompany}
                    onChange={(event) => setForm({ ...form, collegeOrCompany: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">Skills You Need to Teach (comma-separated)</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <GraduationCap size={15} className="text-slate-400 shrink-0" />
                  <input
                    name="skillsTeaching"
                    placeholder="e.g. React, UI/UX Design, Photography, Python"
                    value={form.skillsTeaching}
                    onChange={(event) => setForm({ ...form, skillsTeaching: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">Skills You Need to Learn (comma-separated)</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <BookOpen size={15} className="text-slate-400 shrink-0" />
                  <input
                    name="skillsLearning"
                    placeholder="e.g. Machine Learning, Public Speaking, Spanish, Flutter"
                    value={form.skillsLearning}
                    onChange={(event) => setForm({ ...form, skillsLearning: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Terms checkbox */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4"
                  checked={form.acceptTerms}
                  onChange={(event) => setForm({ ...form, acceptTerms: event.target.checked })}
                />
                <span>I agree to the Community Guidelines &amp; Skill Swap Terms</span>
              </label>
              {errors.acceptTerms && <p className="mt-1.5 text-[11px] font-semibold text-red-500">{errors.acceptTerms}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/25" 
              disabled={loading}
            >
              {loading ? <Spinner label="Setting up account..." /> : 'Create Free Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already registered? <Link to="/login" className="font-bold text-violet-600 hover:underline">Sign In</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default SignupPage
