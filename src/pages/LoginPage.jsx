import { Eye, EyeOff, Sparkles, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Spinner from '../components/Spinner'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebaseClient'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [showMockReset, setShowMockReset] = useState(false)

  const validate = () => {
    const next = {}
    if (!form.email) {
      next.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.'
    }
    if (!form.password) {
      next.password = 'Password is required.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      setLoading(false)
      navigate('/dashboard')
    } catch (error) {
      console.error(error)
      setLoading(false)
      setErrors({ ...errors, email: 'Invalid login credentials. Please check your email and password.' })
    }
  }

  const handleForgotPassword = async () => {
    setResetMessage('')
    if (!form.email) {
      setErrors({ ...errors, email: 'Please enter your email address to reset password.' })
      return
    }
    
    try {
      await sendPasswordResetEmail(auth, form.email)
    } catch (e) {
      console.error(e)
    }
    
    setShowMockReset(true)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-violet-500 selection:text-white">
      
      {/* Left Form Area */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-6">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/25">
              <Sparkles size={20} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">SkillSwap</span>
          </div>

          <Card className="p-7 sm:p-9 shadow-xl shadow-slate-200/50 border-slate-200/80">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back! 👋</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">Sign in to manage your lessons, skills, and calls.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              
              {resetMessage && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
                  {resetMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                    aria-describedby="email-error"
                  />
                </div>
                {errors.email && <p id="email-error" className="text-[11px] font-semibold text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                  <Lock size={16} className="text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    className="w-full bg-transparent pl-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    aria-describedby="password-error"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword((value) => !value)} 
                    className="text-slate-400 hover:text-slate-600 ml-2" 
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p id="password-error" className="text-[11px] font-semibold text-red-500 mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4"
                    checked={form.remember}
                    onChange={(event) => setForm({ ...form, remember: event.target.checked })}
                  />
                  <span>Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword} 
                  className="font-bold text-violet-600 hover:text-violet-700"
                >
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" className="w-full py-3 text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/25" disabled={loading}>
                {loading ? <Spinner label="Signing in..." /> : 'Sign In'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Don&apos;t have an account? <Link to="/signup" className="font-bold text-violet-600 hover:underline">Sign Up</Link>
            </p>
          </Card>
        </div>
      </div>

      {/* Right Visual Area */}
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-12 lg:flex relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl shadow-2xl text-white space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl shadow-inner backdrop-blur">
            🚀
          </div>
          <h2 className="text-2xl font-extrabold">Peer Learning Reimagined</h2>
          <p className="text-xs text-violet-100 leading-relaxed">
            Join thousands of active learners and mentors swapping programming, design, languages, and technical skills 1-on-1 every day.
          </p>
        </div>
      </div>

      {/* Mock Reset Modal */}
      {showMockReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Password Reset Instructions</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an account with that email exists, a password reset link has been dispatched.
            </p>
            <Button type="button" className="w-full text-xs" onClick={() => setShowMockReset(false)}>
              Got it
            </Button>
          </Card>
        </div>
      )}

    </div>
  )
}

export default LoginPage
