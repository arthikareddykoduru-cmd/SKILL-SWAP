import { Home, Compass, Users, MessageCircleMore, CalendarDays, Clock3, Settings, LogOut, Sparkles, X, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/search', label: 'Explore Skills', icon: Compass },
  { to: '/connections', label: 'Connections', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageCircleMore },
  { to: '/classes', label: 'My Classes', icon: CalendarDays },
  { to: '/schedule', label: 'Schedule', icon: Clock3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ open, onClose }) {
  const { logout } = useAuth()

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-xl px-5 py-6 shadow-xl shadow-slate-200/50 transition-transform duration-300 lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Logo Header */}
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25">
              <Sparkles size={20} className="animate-pulse-slow" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">SkillSwap</p>
              <p className="text-xs font-medium text-slate-400">Learn & Teach</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition" 
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-violet-600/10 to-blue-600/10 text-violet-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`transition-colors duration-200 ${isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-700'}`}>
                      <Icon size={19} />
                    </div>
                    <span>{label}</span>
                  </div>
                  {isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 group"
            aria-label="Logout"
          >
            <LogOut size={19} className="text-slate-400 group-hover:text-red-500 transition" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
