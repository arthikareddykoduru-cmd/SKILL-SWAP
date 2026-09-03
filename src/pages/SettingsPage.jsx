// TODO: Replace mockData import with real API/database calls
import { useEffect, useState } from 'react'
import { Palette, CheckCircle2, AlertCircle, User, Bell, Lock, Globe, Link2, LogOut, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Button from '../components/Button'
import Card from '../components/Card'
import Avatar from '../components/Avatar'
import { 
  onAuthStateChanged, 
  signOut, 
  linkWithPopup,
  unlink,
  GoogleAuthProvider,
  GithubAuthProvider
} from 'firebase/auth'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebaseClient'

const tabs = [
  { name: 'Edit Profile', icon: User },
  { name: 'Notifications', icon: Bell },
  { name: 'Privacy', icon: Lock },
  { name: 'Language', icon: Globe },
  { name: 'Appearance', icon: Palette },
  { name: 'Connected Accounts', icon: Link2 },
  { name: 'Logout', icon: LogOut },
]

function SettingsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Edit Profile')
  
  // Edit Profile State
  const [profile, setProfile] = useState({ fullName: '', username: '', bio: '', learningSkills: '', teachingSkills: '' })
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState({ message: '', type: '' })
  const [currentUserEmail, setCurrentUserEmail] = useState('')

  // Preferences (Notifications, Privacy, Language)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    newMessageAlerts: true,
    connectionAlerts: true,
    classReminders: true,
    showProfileToEveryone: true,
    showOnlineStatus: true,
    language: 'English'
  })

  // Connected Accounts State
  const [linkedProviders, setLinkedProviders] = useState([])

  useEffect(() => {
    let mounted = true
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserEmail(user.email || '')
        setLinkedProviders(user.providerData.map(p => p.providerId))
        
        const docRef = doc(db, 'profiles', user.uid)
        const docSnap = await getDoc(docRef)
        if (mounted && docSnap.exists()) {
          const data = docSnap.data()
          
          // Also fetch skills for this user to allow editing
          const lsQuery = query(collection(db, 'skills_learning'), where('profile_id', '==', user.uid))
          const tsQuery = query(collection(db, 'skills_teaching'), where('profile_id', '==', user.uid))
          const [lsSnap, tsSnap] = await Promise.all([getDocs(lsQuery), getDocs(tsQuery)])
          const lSkills = lsSnap.docs.map(d => d.data().skill_name).join(', ')
          const tSkills = tsSnap.docs.map(d => d.data().skill_name).join(', ')

          setProfile({ 
            fullName: data.full_name || '', 
            username: data.username || '', 
            bio: data.bio || '',
            learningSkills: lSkills,
            teachingSkills: tSkills
          })
          
          if (data.preferences) {
            setPreferences(prev => ({ ...prev, ...data.preferences }))
          }
        }
      }
      if (mounted) setLoading(false)
    })
    return () => { mounted = false; unsubscribe() }
  }, [])

  const handleSaveProfile = async () => {
    const user = auth.currentUser
    if (user) {
      setFeedback({ message: '', type: '' })
      try {
        const learningArray = profile.learningSkills.split(',').map(s => s.trim()).filter(Boolean)
        const teachingArray = profile.teachingSkills.split(',').map(s => s.trim()).filter(Boolean)

        await updateDoc(doc(db, 'profiles', user.uid), {
          full_name: profile.fullName,
          username: profile.username,
          bio: profile.bio,
          skills_learning: learningArray,
          skills_teaching: teachingArray,
          learningSkills: learningArray,
          teachingSkills: teachingArray
        })

        // Delete existing skills
        const lsQuery = query(collection(db, 'skills_learning'), where('profile_id', '==', user.uid))
        const tsQuery = query(collection(db, 'skills_teaching'), where('profile_id', '==', user.uid))
        const [lsSnap, tsSnap] = await Promise.all([getDocs(lsQuery), getDocs(tsQuery)])
        
        await Promise.all([
          ...lsSnap.docs.map(d => deleteDoc(doc(db, 'skills_learning', d.id))),
          ...tsSnap.docs.map(d => deleteDoc(doc(db, 'skills_teaching', d.id)))
        ])

        // Add new learning skills
        await Promise.all([
          ...learningArray.map(skill => addDoc(collection(db, 'skills_learning'), {
            profile_id: user.uid,
            skill_name: skill,
            proficiency: 'Beginner'
          })),
          ...teachingArray.map(skill => addDoc(collection(db, 'skills_teaching'), {
            profile_id: user.uid,
            skill_name: skill,
            proficiency: 'Expert'
          }))
        ])

        setFeedback({ message: 'Profile updated successfully!', type: 'success' })
      } catch (e) {
        console.error(e)
        setFeedback({ message: 'Failed to update profile. Please try again.', type: 'error' })
      }
    }
  }

  const handleSavePreferences = async () => {
    const user = auth.currentUser
    if (user) {
      setFeedback({ message: '', type: '' })
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          preferences
        })
        setFeedback({ message: 'Preferences saved successfully!', type: 'success' })
      } catch (e) {
        console.error(e)
        setFeedback({ message: 'Failed to save preferences.', type: 'error' })
      }
    }
  }

  const handleLinkProvider = async (providerId) => {
    const user = auth.currentUser
    if (!user) return
    setFeedback({ message: '', type: '' })

    let provider
    if (providerId === 'google.com') provider = new GoogleAuthProvider()
    if (providerId === 'github.com') provider = new GithubAuthProvider()

    try {
      await linkWithPopup(user, provider)
      setLinkedProviders(user.providerData.map(p => p.providerId))
      setFeedback({ message: `Successfully linked ${providerId}!`, type: 'success' })
    } catch (e) {
      console.error(e)
      setFeedback({ message: `Failed to link account: ${e.message}`, type: 'error' })
    }
  }

  const handleUnlinkProvider = async (providerId) => {
    const user = auth.currentUser
    if (!user) return
    setFeedback({ message: '', type: '' })

    try {
      await unlink(user, providerId)
      setLinkedProviders(user.providerData.map(p => p.providerId))
      setFeedback({ message: `Successfully disconnected ${providerId}.`, type: 'success' })
    } catch (e) {
      console.error(e)
      setFeedback({ message: `Failed to disconnect account: ${e.message}`, type: 'error' })
    }
  }

  const handleTabClick = (tab) => {
    setFeedback({ message: '', type: '' })
    if (tab === 'Logout') {
      signOut(auth).then(() => {
        navigate('/login')
      })
    } else {
      setActiveTab(tab)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Edit Profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">Update your public profile, bio, and skill listings.</p>
              </div>
              {feedback.message && (
                <span className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {feedback.message}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Avatar name={profile.fullName} size="lg" status="online" />
              <div>
                <p className="font-bold text-slate-900 text-sm">{profile.fullName || 'Your Name'}</p>
                <p className="text-xs text-slate-400">Personalize how others see your account</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10" 
                  value={profile.fullName} 
                  onChange={e => setProfile({...profile, fullName: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10" 
                  value={profile.username} 
                  onChange={e => setProfile({...profile, username: e.target.value})} 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 outline-none cursor-not-allowed" 
                  value={currentUserEmail} 
                  disabled 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Skills I Want to Learn (comma separated)</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10" 
                  value={profile.learningSkills} 
                  onChange={e => setProfile({...profile, learningSkills: e.target.value})} 
                  placeholder="e.g. Python, React, Guitar" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Skills I Can Teach (comma separated)</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10" 
                  value={profile.teachingSkills} 
                  onChange={e => setProfile({...profile, teachingSkills: e.target.value})} 
                  placeholder="e.g. Public Speaking, UI Design, AWS" 
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bio / About</label>
                <textarea 
                  className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10" 
                  value={profile.bio} 
                  onChange={e => setProfile({...profile, bio: e.target.value})} 
                  placeholder="Tell the community about your background and what you are looking to swap..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button className="px-6 py-2.5 text-xs shadow-md shadow-violet-500/25" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        )

      case 'Notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control what alerts and messages you receive.</p>
              </div>
              {feedback.message && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={15} /> {feedback.message}
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs">
              {[
                { key: 'emailNotifications', label: 'Email notifications', desc: 'Receive periodic updates and reminders via email.' },
                { key: 'newMessageAlerts', label: 'New message alerts', desc: 'Get notified immediately when you receive a new direct message.' },
                { key: 'connectionAlerts', label: 'Connection requests', desc: 'Get notified when someone requests to connect with you.' },
                { key: 'classReminders', label: 'Class & session reminders', desc: 'Receive a reminder before your live session starts.' }
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer select-none">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer" 
                    checked={preferences[key]} 
                    onChange={e => setPreferences({...preferences, [key]: e.target.checked})} 
                  />
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button className="px-6 py-2.5 text-xs shadow-md shadow-violet-500/25" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </div>
          </div>
        )

      case 'Privacy':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Privacy & Visibility</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control how other users discover your profile.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer select-none">
                <div>
                  <p className="font-bold text-slate-800 text-xs">Show profile in public directory</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Allow other learners to discover your teaching and learning skills.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer" 
                  checked={preferences.showProfileToEveryone} 
                  onChange={e => setPreferences({...preferences, showProfileToEveryone: e.target.checked})} 
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer select-none">
                <div>
                  <p className="font-bold text-slate-800 text-xs">Show live online status</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Let connections see when you are active on the platform.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer" 
                  checked={preferences.showOnlineStatus} 
                  onChange={e => setPreferences({...preferences, showOnlineStatus: e.target.checked})} 
                />
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button className="px-6 py-2.5 text-xs shadow-md shadow-violet-500/25" onClick={handleSavePreferences}>
                Save Privacy Settings
              </Button>
            </div>
          </div>
        )

      case 'Appearance':
        return (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Appearance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Customize your interface theme and styling.</p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center text-slate-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 mb-4 shadow-xs">
                <Palette size={32} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Light Mode Active</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Dark mode and personalized color themes are currently being prepared for the next update.
              </p>
            </div>
          </div>
        )

      case 'Connected Accounts':
        return (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Connected Accounts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Link social providers for seamless sign-in.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 font-black text-sm">
                    G
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Google Account</p>
                    <p className="text-[11px] text-slate-400">{linkedProviders.includes('google.com') ? 'Connected' : 'Not linked'}</p>
                  </div>
                </div>
                {linkedProviders.includes('google.com') ? (
                  <Button variant="outline" className="text-xs text-red-600 hover:bg-red-50" onClick={() => handleUnlinkProvider('google.com')}>
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="outline" className="text-xs" onClick={() => handleLinkProvider('google.com')}>
                    Connect
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-sm">
                    GH
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">GitHub Account</p>
                    <p className="text-[11px] text-slate-400">{linkedProviders.includes('github.com') ? 'Connected' : 'Not linked'}</p>
                  </div>
                </div>
                {linkedProviders.includes('github.com') ? (
                  <Button variant="outline" className="text-xs text-red-600 hover:bg-red-50" onClick={() => handleUnlinkProvider('github.com')}>
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="outline" className="text-xs" onClick={() => handleLinkProvider('github.com')}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your profile, preferences, notifications, and security.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          
          {/* Settings Sidebar Tabs */}
          <Card className="h-fit p-2 sm:p-2 space-y-1">
            {tabs.map(({ name, icon: Icon }) => (
              <button 
                key={name} 
                type="button" 
                onClick={() => handleTabClick(name)} 
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-xs font-semibold transition cursor-pointer ${
                  activeTab === name 
                    ? 'bg-gradient-to-r from-violet-600/10 to-blue-600/10 text-violet-700 font-bold shadow-2xs' 
                    : name === 'Logout' 
                    ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' 
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <Icon size={16} className={activeTab === name ? 'text-violet-600' : ''} />
                <span>{name}</span>
              </button>
            ))}
          </Card>

          {/* Settings Content Pane */}
          <Card className="min-h-[480px]">
            {renderTabContent()}
          </Card>

        </div>
      </div>
    </AppLayout>
  )
}

export default SettingsPage
