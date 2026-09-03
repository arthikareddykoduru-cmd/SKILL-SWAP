import { Bell, CalendarDays, Search, ChevronDown, Menu, User, Settings, LogOut, Sparkles } from 'lucide-react'
import Avatar from './Avatar'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { subscribeToNotifications } from '../services/api'

function Topbar({ onMenuToggle }) {
  const { user, userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = userProfile?.full_name || user?.displayName || 'Skill Swapper'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notifs) => {
      setNotificationCount(notifs.length)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 py-3.5 sm:px-6 shadow-xs">
      <div className="flex flex-1 items-center gap-3 max-w-xl">
        <button 
          type="button" 
          onClick={onMenuToggle} 
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition lg:hidden" 
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <label className="relative flex flex-1 items-center rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 transition-all focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
          <Search size={17} className="text-slate-400 shrink-0" />
          <input 
            className="w-full bg-transparent pl-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none" 
            placeholder="Search skills, mentors, classes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            aria-label="Search skills, mentors, classes" 
          />
          <kbd className="hidden sm:inline-block rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            ↵ Enter
          </kbd>
        </label>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link 
          to="/notifications" 
          className="relative rounded-xl border border-slate-200/60 bg-white p-2.5 text-slate-600 shadow-xs transition hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-700 active:scale-95" 
          aria-label="View notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>

        <Link 
          to="/schedule" 
          className="hidden sm:flex rounded-xl border border-slate-200/60 bg-white p-2.5 text-slate-600 shadow-xs transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 active:scale-95" 
          aria-label="Calendar schedule"
        >
          <CalendarDays size={18} />
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button 
            type="button" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 pr-3 shadow-xs transition hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.98]"
          >
            <Avatar name={displayName} size="sm" status="online" />
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{displayName}</p>
              <p className="text-[11px] font-medium text-violet-600 truncate max-w-[120px]">
                {userProfile?.role || 'Member'}
              </p>
            </div>
            <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'Logged in'}</p>
              </div>

              <Link 
                to={`/profile/${user?.uid}`} 
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
              >
                <User size={15} /> My Profile
              </Link>
              <Link 
                to="/settings" 
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Settings size={15} /> Account Settings
              </Link>
              <div className="my-1 border-t border-slate-100"></div>
              <button 
                onClick={() => { setIsDropdownOpen(false); logout(); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
