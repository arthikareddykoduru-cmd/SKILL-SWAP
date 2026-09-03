import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { getDoc, setDoc, doc, serverTimestamp, onSnapshot, collection, addDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let profileUnsubscribe = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setIsAuthenticated(!!currentUser)
      
      if (profileUnsubscribe) {
        profileUnsubscribe()
        profileUnsubscribe = null
      }

      if (currentUser) {
        // Real-time live profile subscription: any update on web or mobile instantly syncs!
        profileUnsubscribe = onSnapshot(doc(db, 'profiles', currentUser.uid), (profileDoc) => {
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data())
          } else {
            setUserProfile(null)
          }
          setLoading(false)
        }, (err) => {
          console.warn('Live profile sync note:', err)
          setLoading(false)
        })
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      if (profileUnsubscribe) profileUnsubscribe()
      unsubscribeAuth()
    }
  }, [])

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password)
  }

  const signup = async (email, password, fullName, username, extraData = {}) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const newUser = userCredential.user

    const teachingSkills = typeof extraData.skills_teaching === 'string'
      ? extraData.skills_teaching.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(extraData.skills_teaching) ? extraData.skills_teaching : [])

    const learningSkills = typeof extraData.skills_learning === 'string'
      ? extraData.skills_learning.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(extraData.skills_learning) ? extraData.skills_learning : [])

    const initialProfile = {
      id: newUser.uid,
      uid: newUser.uid,
      email: newUser.email,
      full_name: fullName || 'New Member',
      username: username || email.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/avataaars/png?seed=${newUser.uid}`,
      bio: extraData.bio || 'Excited to learn and share skills on Skill Swap!',
      rating: 5.0,
      reviews_count: 0,
      skills_teaching: teachingSkills,
      skills_learning: learningSkills,
      college_or_company: extraData.college_or_company || extraData.college || '',
      college: extraData.college_or_company || extraData.college || '',
      company: extraData.college_or_company || extraData.company || '',
      organization: extraData.college_or_company || '',
      city: extraData.city || '',
      country: extraData.country || '',
      role: 'Skill Swapper',
      credits: 5,
      created_at: serverTimestamp()
    }

    await setDoc(doc(db, 'profiles', newUser.uid), initialProfile)

    for (const s of teachingSkills) {
      try {
        await addDoc(collection(db, 'skills_teaching'), {
          profile_id: newUser.uid,
          skill_name: s,
          level: 'Expert',
          created_at: serverTimestamp()
        })
      } catch(e) {}
    }

    for (const s of learningSkills) {
      try {
        await addDoc(collection(db, 'skills_learning'), {
          profile_id: newUser.uid,
          skill_name: s,
          level: 'Beginner',
          created_at: serverTimestamp()
        })
      } catch(e) {}
    }

    setUserProfile(initialProfile)
    return userCredential
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      return await fetchProfile(user.uid)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        userProfile,
        loading,
        login,
        signup,
        logout,
        refreshProfile,
        setUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
