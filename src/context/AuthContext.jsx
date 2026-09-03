import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { auth, db } from '../lib/firebaseClient'
import { checkAndTriggerScheduleReminders } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let reminderInterval = null

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsAuthenticated(!!currentUser)
      setUser(currentUser)
      
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid))
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data())
          } else {
            setUserProfile(null)
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
          setUserProfile(null)
        }

        // Request browser notifications if supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          try {
            Notification.requestPermission()
          } catch (e) {}
        }

        // Initial check and periodic 30-second interval for schedule reminders
        checkAndTriggerScheduleReminders()
        reminderInterval = setInterval(() => {
          checkAndTriggerScheduleReminders()
        }, 30000)

      } else {
        setUserProfile(null)
        if (reminderInterval) clearInterval(reminderInterval)
      }
      
      setLoading(false)
    })

    return () => {
      if (reminderInterval) clearInterval(reminderInterval)
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const value = useMemo(
    () => ({ isAuthenticated, user, userProfile, loading, logout }),
    [isAuthenticated, user, userProfile, loading],
  )

  if (loading) {
    return <div>Loading session...</div> // Or a spinner component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
