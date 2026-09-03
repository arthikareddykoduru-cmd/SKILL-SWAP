import { ArrowRight, BookOpen, Camera, MessageCircle, PlayCircle, Sparkles, Users, Video, ShieldCheck, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'

const features = [
  { icon: BookOpen, title: 'Skill Swapping', description: 'Exchange expertise 1-on-1 without expensive subscription fees.' },
  { icon: Video, title: 'WebRTC Video Calls', description: 'HD real-time video & screen sharing built directly into your browser.' },
  { icon: MessageCircle, title: 'Direct Messaging', description: 'Chat seamlessly to coordinate lessons and swap knowledge.' },
  { icon: PlayCircle, title: 'Interactive Sessions', description: 'Book scheduled classes and track your learning milestones.' },
  { icon: ShieldCheck, title: 'Verified Profiles', description: 'Connect with authentic mentors and peer learners worldwide.' },
]

const steps = [
  { step: '01', title: 'Create Your Profile', description: 'List the skills you can teach and what you are eager to learn.' },
  { step: '02', title: 'Find Your Match', description: 'Explore skills or connect with peers who complement your goals.' },
  { step: '03', title: 'Swap & Learn Live', description: 'Message, schedule, and jump into live 1-on-1 video sessions.' },
]

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-violet-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-600 text-white shadow-md shadow-violet-500/25">
              <Sparkles size={20} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">SkillSwap</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#home" className="hover:text-violet-600 transition">Home</a>
            <a href="#features" className="hover:text-violet-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-violet-600 transition">How It Works</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/login')} 
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-violet-600 transition px-3 py-2"
            >
              Sign In
            </button>
            <Button 
              className="text-xs sm:text-sm px-4 py-2 shadow-md shadow-violet-500/25" 
              onClick={() => navigate('/signup')}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main id="home" className="mx-auto max-w-7xl px-6 py-12 sm:py-20 lg:px-8 space-y-20">
        
        {/* Hero Card */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-8 sm:p-14 shadow-xl shadow-slate-200/50 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 border border-violet-200/60 px-3.5 py-1 text-xs font-bold text-violet-700 shadow-2xs">
              <Sparkles size={13} className="text-violet-600" />
              <span>Peer-to-Peer Skill Exchange Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
              Teach what you know. <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Learn what you love.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              SkillSwap is the community platform where peers connect for live 1-on-1 mentorship, video sessions, and reciprocal skill sharing.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button 
                className="px-6 py-3 text-sm shadow-lg shadow-violet-500/25 font-bold" 
                onClick={() => navigate('/signup')}
              >
                Join SkillSwap Free <ArrowRight size={16} />
              </Button>
              <Button 
                variant="outline" 
                className="px-6 py-3 text-sm font-bold" 
                onClick={() => navigate('/login')}
              >
                Explore Community
              </Button>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-violet-600" />
                <span>Instant 1-on-1 Video</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={15} className="text-blue-600" />
                <span>Free Skill Barter</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Graphic */}
          <div className="mt-10 lg:mt-0 relative rounded-3xl bg-gradient-to-br from-violet-600/5 via-blue-600/5 to-pink-500/5 p-6 border border-slate-100">
            <div className="space-y-4 max-w-md mx-auto">
              
              {/* Mock Call Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-blue-600 text-white font-bold">
                    JS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Python ⇄ React Swap</p>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Call Active
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                  45m Session
                </div>
              </div>

              {/* Mock Swap Match Card */}
              <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 p-5 text-white shadow-xl shadow-violet-500/20">
                <p className="text-xs font-semibold text-violet-100 uppercase tracking-wider">Ready to exchange skills?</p>
                <h3 className="text-xl font-bold mt-1">Start swapping today</h3>
                <p className="text-xs text-violet-200 mt-1">100+ topics from Programming to Languages & Design.</p>
              </div>

            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Simple 3-Step Process</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">How SkillSwap Works</h2>
            <p className="text-sm text-slate-500 mt-2">No money exchanged — just pure peer mentorship and collaborative learning.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ step, title, description }) => (
              <Card key={step} hover className="p-7 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-lg font-black text-violet-700 shadow-xs">
                  {step}
                </div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Engineered For Collaboration</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Platform Features</h2>
            <p className="text-sm text-slate-500 mt-2">Everything you need to discover, schedule, and conduct live lessons.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} hover className="p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to action footer banner */}
        <section className="rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-10 text-center text-white shadow-xl shadow-violet-500/20 space-y-4">
          <h2 className="text-3xl font-extrabold">Ready to start swapping skills?</h2>
          <p className="text-sm text-violet-100 max-w-md mx-auto">
            Join other learners and mentors on SkillSwap today. Free forever for skill bartering.
          </p>
          <Button 
            className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg shadow-black/10 border-0 px-7 py-3 text-sm font-bold mt-2" 
            onClick={() => navigate('/signup')}
          >
            Create Your Account
          </Button>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>© 2026 SkillSwap Community. Built for open peer-to-peer learning.</p>
      </footer>

    </div>
  )
}

export default LandingPage
