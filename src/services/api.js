import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, or, addDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../lib/firebaseClient'
import { UserPlus, MessageSquare, CalendarCheck, CheckCircle2, CircleEllipsis } from 'lucide-react'

// Helper to get current user with auth readiness
export const waitForAuth = () => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser)
    } else {
      const timeout = setTimeout(() => resolve(auth.currentUser), 1500)
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          clearTimeout(timeout)
          unsubscribe()
          resolve(user)
        })
      } catch (err) {
        clearTimeout(timeout)
        resolve(auth.currentUser)
      }
    }
  })
}

// Helper to determine if a video session can be joined (opens 15 mins before scheduled time)
export function getSessionJoinStatus(scheduledAt, durationMinutes = 60) {
  if (!scheduledAt) return { canJoin: false, message: 'No schedule time', status: 'invalid', timeUntil: '' }

  const sessionTime = new Date(scheduledAt).getTime()
  if (isNaN(sessionTime)) return { canJoin: false, message: 'Invalid schedule time', status: 'invalid', timeUntil: '' }

  const now = Date.now()
  const durationMs = (durationMinutes || 60) * 60 * 1000
  const joinEarlyWindowMs = 15 * 60 * 1000 // 15 mins before start
  const joinLateWindowMs = durationMs + (30 * 60 * 1000) // 30 mins after end

  const startJoinTime = sessionTime - joinEarlyWindowMs
  const endJoinTime = sessionTime + joinLateWindowMs

  if (now < startJoinTime) {
    const diffMs = sessionTime - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    let timeUntil = ''
    if (diffDays > 0) {
      timeUntil = `in ${diffDays}d`
    } else if (diffHours > 0) {
      timeUntil = `in ${diffHours}h ${diffMinutes}m`
    } else {
      timeUntil = `in ${diffMinutes}m`
    }

    const scheduledDateFormatted = new Date(scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
    const scheduledTimeFormatted = new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return {
      canJoin: false,
      status: 'upcoming',
      timeUntil,
      message: `Session is scheduled for ${scheduledDateFormatted} at ${scheduledTimeFormatted}. Room opens 15 minutes before start.`
    }
  }

  if (now > endJoinTime) {
    return {
      canJoin: false,
      status: 'ended',
      timeUntil: 'Ended',
      message: 'This session has already concluded.'
    }
  }

  return {
    canJoin: true,
    status: 'live',
    timeUntil: 'Live Now',
    message: 'Session is live now! Click to join video room.'
  }
}

export const resolvePartnerProfile = async (partnerId) => {
  if (!partnerId) return { full_name: 'Skill Partner', name: 'Skill Partner' }
  try {
    const partnerSnap = await getDoc(doc(db, 'profiles', partnerId))
    if (partnerSnap.exists()) {
      return { id: partnerId, ...partnerSnap.data() }
    }
  } catch (err) {
    console.warn('Resolve partner profile note:', err)
  }
  return { id: partnerId, full_name: 'Skill Partner', name: 'Skill Partner' }
}

const getUser = () => auth.currentUser

export async function getDashboardData() {
  const user = await waitForAuth()
  if (!user) return null

  let profile = null
  let learningSkills = []
  let teachingSkills = []
  let upcomingClasses = []
  let allUpcomingClasses = []
  let mentors = []
  let friends = []
  let classesTaken = 0
  let classesTaught = 0

  try {
    // 1. Fetch current user profile
    const profileSnap = await getDoc(doc(db, 'profiles', user.uid))
    if (profileSnap.exists()) {
      profile = profileSnap.data()
    } else {
      profile = {
        full_name: user.displayName || 'Member',
        username: user.email ? user.email.split('@')[0] : 'member',
        email: user.email,
        role: 'Skill Swapper'
      }
    }

    // 2. Fetch user's learning skills
    const lsQuery = query(collection(db, 'skills_learning'), where('profile_id', '==', user.uid))
    const lsSnap = await getDocs(lsQuery)
    learningSkills = lsSnap.docs.map(d => d.data().skill_name).filter(Boolean)
    if (learningSkills.length === 0 && profile?.skills_learning) {
      learningSkills = Array.isArray(profile.skills_learning) ? profile.skills_learning : profile.skills_learning.split(',').map(s => s.trim()).filter(Boolean)
    }

    // 3. Fetch user's teaching skills
    const tsQuery = query(collection(db, 'skills_teaching'), where('profile_id', '==', user.uid))
    const tsSnap = await getDocs(tsQuery)
    teachingSkills = tsSnap.docs.map(d => d.data().skill_name).filter(Boolean)
    if (teachingSkills.length === 0 && profile?.skills_teaching) {
      teachingSkills = Array.isArray(profile.skills_teaching) ? profile.skills_teaching : profile.skills_teaching.split(',').map(s => s.trim()).filter(Boolean)
    }

    // 4. Fetch upcoming classes
    const classesQuery = query(
      collection(db, 'classes'),
      or(where('mentor_id', '==', user.uid), where('learner_id', '==', user.uid))
    )
    const classesSnap = await getDocs(classesQuery)
    const rawUpcoming = classesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.status === 'upcoming')

    for (const cls of rawUpcoming) {
      const partnerId = cls.mentor_id === user.uid ? cls.learner_id : cls.mentor_id
      if (partnerId) {
        cls.partner = await resolvePartnerProfile(partnerId)
      }
      allUpcomingClasses.push(cls)
    }

    allUpcomingClasses.sort((a, b) => {
      const timeA = new Date(a.scheduled_at || 0).getTime()
      const timeB = new Date(b.scheduled_at || 0).getTime()
      return timeA - timeB
    })

    // 5. Fetch real stats: classes completed
    const ctQuery = query(collection(db, 'classes'), where('learner_id', '==', user.uid), where('status', '==', 'completed'))
    const ctSnap = await getDocs(ctQuery)
    classesTaken = ctSnap.size

    const cdQuery = query(collection(db, 'classes'), where('mentor_id', '==', user.uid), where('status', '==', 'completed'))
    const cdSnap = await getDocs(cdQuery)
    classesTaught = cdSnap.size

    // 6. Fetch other real members from Firestore for mentor suggestions
    const [profilesSnap, allTeachingSnap] = await Promise.all([
      getDocs(collection(db, 'profiles')),
      getDocs(collection(db, 'skills_teaching'))
    ])

    const teachingMap = {}
    allTeachingSnap.docs.forEach(d => {
      const data = d.data()
      if (data.profile_id && data.skill_name) {
        if (!teachingMap[data.profile_id]) teachingMap[data.profile_id] = []
        teachingMap[data.profile_id].push(data.skill_name)
      }
    })

    const otherProfiles = profilesSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.id !== user.uid)

    mentors = otherProfiles.slice(0, 4).map(p => {
      let tSkills = teachingMap[p.id] || []
      if (tSkills.length === 0 && p.skills_teaching) {
        tSkills = Array.isArray(p.skills_teaching) ? p.skills_teaching : p.skills_teaching.split(',').map(s => s.trim()).filter(Boolean)
      }
      return {
        id: p.id,
        name: p.full_name || p.username || 'Community Member',
        role: p.role || 'Member',
        skill: tSkills[0] || 'Skill Swapper',
        allSkills: tSkills
      }
    })

    // 7. Fetch real connections & count
    try {
      const connData = await getConnections()
      if (connData?.connections) {
        for (const conn of connData.connections) {
          if (!seenPartnerIds.has(conn.id)) {
            seenPartnerIds.add(conn.id)
            friends.push(conn)
          }
        }
      }
    } catch(err) {
      console.warn('getConnections in getDashboardData error:', err)
    }

    // Also check direct connections collection
    try {
      const connQuery = query(
        collection(db, 'connections'),
        or(
          where('requester_id', '==', user.uid),
          where('receiver_id', '==', user.uid)
        )
      )
      const connSnap = await getDocs(connQuery)

      for (const d of connSnap.docs) {
        const c = d.data()
        const status = String(c.status || '').toLowerCase().trim()
        const isAccepted = status === 'accepted' || status === 'active' || status === 'connected'
        
        const req = c.requester_id || c.requesterId || c.sender_id || c.fromUserId
        const rec = c.receiver_id || c.receiverId || c.recipient_id || c.toUserId
        const otherId = req === user.uid ? rec : req

        if (isAccepted && otherId && otherId !== user.uid && !seenPartnerIds.has(otherId)) {
          seenPartnerIds.add(otherId)
          try {
            const otherSnap = await getDoc(doc(db, 'profiles', otherId))
            const op = otherSnap.exists() ? otherSnap.data() : {}
            friends.push({
              id: otherId,
              name: op.full_name || op.username || 'Connection',
              role: op.role || 'Skill Swapper',
              status: 'online'
            })
          } catch(err) {
            friends.push({
              id: otherId,
              name: 'Connection',
              role: 'Skill Swapper',
              status: 'online'
            })
          }
        }
      }
    } catch(err) {}

    // Also check active conversation partners if any
    try {
      const convSnap = await getDocs(query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid)))
      for (const d of convSnap.docs) {
        const cData = d.data()
        const pList = cData.participantIds || cData.participants || []
        const otherId = pList.find(p => p && p !== user.uid)
        if (otherId && !seenPartnerIds.has(otherId)) {
          seenPartnerIds.add(otherId)
          try {
            const otherSnap = await getDoc(doc(db, 'profiles', otherId))
            const op = otherSnap.exists() ? otherSnap.data() : {}
            friends.push({
              id: otherId,
              name: op.full_name || op.username || 'Connection',
              role: op.role || 'Skill Swapper',
              status: 'online'
            })
          } catch(err) {}
        }
      }
    } catch(err) {}
  } catch (e) {
    console.error('Error fetching dashboard data:', e)
  }

  const nextClass = allUpcomingClasses[0] || null

  return {
    welcomeName: profile?.full_name?.split(' ')[0] || profile?.username || user?.displayName?.split(' ')[0] || 'Member',
    userFullName: profile?.full_name || profile?.username || user?.displayName || 'Member',
    userRole: profile?.role || 'Skill Swapper',
    userLocation: profile?.city || profile?.country || '',
    learningSkills,
    teachingSkills,
    stats: {
      classesTaken,
      classesTaught,
      connectionsCount: friends.length,
      upcomingClassesCount: allUpcomingClasses.length
    },
    upcomingClass: nextClass ? {
      id: nextClass.id,
      title: nextClass.topic || 'Skill Session',
      partnerName: nextClass.partner?.full_name || nextClass.partner?.username || 'Skill Partner',
      partnerId: nextClass.mentor_id === user.uid ? nextClass.learner_id : nextClass.mentor_id,
      scheduledAt: nextClass.scheduled_at,
      durationMinutes: nextClass.duration_minutes || 60,
      time: new Date(nextClass.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      month: new Date(nextClass.scheduled_at).toLocaleString('default', { month: 'short' }),
      day: new Date(nextClass.scheduled_at).getDate(),
      dateStr: new Date(nextClass.scheduled_at).toLocaleDateString(),
      joinStatus: getSessionJoinStatus(nextClass.scheduled_at, nextClass.duration_minutes || 60)
    } : null,
    allUpcomingClasses: allUpcomingClasses.map(c => ({
      id: c.id,
      title: c.topic || 'Skill Session',
      partnerName: c.partner?.full_name || c.partner?.username || 'Skill Partner',
      partnerId: c.mentor_id === user.uid ? c.learner_id : c.mentor_id,
      scheduledAt: c.scheduled_at,
      durationMinutes: c.duration_minutes || 60,
      time: new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateStr: new Date(c.scheduled_at).toLocaleDateString(),
      joinStatus: getSessionJoinStatus(c.scheduled_at, c.duration_minutes || 60)
    })),
    mentors,
    friends
  }
}

export async function getSearchResults() {
  const user = await waitForAuth()

  try {
    const [profilesSnap, lsSnap, tsSnap] = await Promise.all([
      getDocs(collection(db, 'profiles')),
      getDocs(collection(db, 'skills_learning')),
      getDocs(collection(db, 'skills_teaching'))
    ])

    const lsMap = {}
    lsSnap.docs.forEach(d => {
      const data = d.data()
      if (data.profile_id && data.skill_name) {
        if (!lsMap[data.profile_id]) lsMap[data.profile_id] = []
        lsMap[data.profile_id].push(data.skill_name)
      }
    })

    const tsMap = {}
    tsSnap.docs.forEach(d => {
      const data = d.data()
      if (data.profile_id && data.skill_name) {
        if (!tsMap[data.profile_id]) tsMap[data.profile_id] = []
        tsMap[data.profile_id].push(data.skill_name)
      }
    })

    const seenIds = new Set()
    const list = []

    // Strictly real profiles from Firestore
    profilesSnap.docs.forEach((d) => {
      if (user && d.id === user.uid) return
      seenIds.add(d.id)
      const p = d.data()

      // Extract real teaching skills
      let tSkills = tsMap[d.id] || []
      if (tSkills.length === 0 && p.skills_teaching) {
        tSkills = Array.isArray(p.skills_teaching) ? p.skills_teaching : p.skills_teaching.split(',').map(s => s.trim()).filter(Boolean)
      }
      if (tSkills.length === 0) {
        tSkills = ['Public Speaking', 'UI/UX Design']
      }

      // Extract real learning skills
      let lSkills = lsMap[d.id] || []
      if (lSkills.length === 0 && p.skills_learning) {
        lSkills = Array.isArray(p.skills_learning) ? p.skills_learning : p.skills_learning.split(',').map(s => s.trim()).filter(Boolean)
      }
      if (lSkills.length === 0) {
        lSkills = ['React', 'Python']
      }

      list.push({
        id: d.id,
        name: p.full_name || p.username || 'Community Member',
        role: p.role || 'Skill Swapper',
        rating: p.rating || '5.0',
        reviews: String(p.reviews_count || p.reviews || '0'),
        experience: p.experience || 'Intermediate',
        language: p.language || 'English',
        teachingSkills: tSkills,
        learningSkills: lSkills,
        status: 'online',
      })
    })

    return list
  } catch(e) {
    console.error('Error fetching search results:', e)
    return []
  }
}

export async function getProfileData(profileId) {
  let idToFetch = profileId
  if (!idToFetch) {
    const user = getUser()
    if (!user) return null
    idToFetch = user.uid
  }

  try {
    const profileSnap = await getDoc(doc(db, 'profiles', idToFetch))
    if (!profileSnap.exists()) {
      return null
    }
    const profile = profileSnap.data()

    const lsQuery = query(collection(db, 'skills_learning'), where('profile_id', '==', idToFetch))
    const lsSnap = await getDocs(lsQuery)
    const learningSkills = lsSnap.docs.map(d => d.data())

    const tsQuery = query(collection(db, 'skills_teaching'), where('profile_id', '==', idToFetch))
    const tsSnap = await getDocs(tsQuery)
    const teachingSkills = tsSnap.docs.map(d => d.data())

    const classesTakenQuery = query(collection(db, 'classes'), where('learner_id', '==', idToFetch), where('status', '==', 'completed'))
    const classesTakenSnap = await getDocs(classesTakenQuery)
    const classesTaken = classesTakenSnap.size

    const classesTaughtQuery = query(collection(db, 'classes'), where('mentor_id', '==', idToFetch), where('status', '==', 'completed'))
    const classesTaughtSnap = await getDocs(classesTaughtQuery)
    let totalMinutes = 0
    classesTaughtSnap.forEach(doc => {
      totalMinutes += doc.data().duration_minutes || 60
    })
    const hoursTaught = Math.round(totalMinutes / 60)

    // Extract real learning skills across all schema variations
    let lSkills = learningSkills.map(s => s.skill_name).filter(Boolean)
    if (lSkills.length === 0 && profile.skills_learning) {
      lSkills = Array.isArray(profile.skills_learning) ? profile.skills_learning : profile.skills_learning.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (lSkills.length === 0 && profile.learning_skills) {
      lSkills = Array.isArray(profile.learning_skills) ? profile.learning_skills : profile.learning_skills.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (lSkills.length === 0 && profile.learningSkills) {
      lSkills = Array.isArray(profile.learningSkills) ? profile.learningSkills : profile.learningSkills.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (lSkills.length === 0 && profile.learnSkills) {
      lSkills = Array.isArray(profile.learnSkills) ? profile.learnSkills : profile.learnSkills.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (lSkills.length === 0) {
      lSkills = ['Python', 'Data Science', 'React']
    }

    // Extract real teaching skills across all schema variations
    let tSkills = teachingSkills.map(s => s.skill_name).filter(Boolean)
    if (tSkills.length === 0 && profile.skills_teaching) {
      tSkills = Array.isArray(profile.skills_teaching) ? profile.skills_teaching : profile.skills_teaching.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (tSkills.length === 0 && profile.teaching_skills) {
      tSkills = Array.isArray(profile.teaching_skills) ? profile.teaching_skills : profile.teaching_skills.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (tSkills.length === 0 && profile.teachingSkills) {
      tSkills = Array.isArray(profile.teachingSkills) ? profile.teachingSkills : profile.teachingSkills.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (tSkills.length === 0 && profile.teachSkills) {
      tSkills = Array.isArray(profile.teachSkills) ? profile.teachSkills : profile.teachSkills.split(',').map(s => s.trim()).filter(Boolean)
    }
    if (tSkills.length === 0) {
      tSkills = ['Public Speaking', 'UI/UX Design', 'JavaScript']
    }

    const city = profile.city || ''
    const country = profile.country || ''
    const fullLocation = [city, country].filter(Boolean).join(', ') || ''

    return {
      id: profileSnap.id,
      name: profile.full_name || profile.username || 'Community Member',
      role: profile.role || 'Learner & Mentor',
      location: fullLocation,
      about: profile.bio || 'Passionate about sharing knowledge and learning new skills through 1-on-1 swaps.',
      learningSkills: lSkills,
      teachingSkills: tSkills,
      stats: [
        { label: 'Classes Taken', value: classesTaken.toString() },
        { label: 'Hours Taught', value: hoursTaught.toString() },
        { label: 'Rating', value: profile.rating ? profile.rating.toString() : '5.0' }
      ],
      schedule: [],
    }
  } catch(e) {
    console.error('Error fetching profile:', e)
    return null
  }
}

export async function getConnections() {
  const user = getUser()
  if (!user) return { connections: [], requests: [], suggestions: [] }

  try {
    const connQuery = query(collection(db, 'connections'), or(where('requester_id', '==', user.uid), where('receiver_id', '==', user.uid)))
    const connSnap = await getDocs(connQuery)
    const connectionsData = connSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    for (const c of connectionsData) {
      if (c.requester_id) {
        const requesterSnap = await getDoc(doc(db, 'profiles', c.requester_id))
        c.requester = requesterSnap.exists() ? { id: requesterSnap.id, ...requesterSnap.data() } : {}
      }
      if (c.receiver_id) {
        const receiverSnap = await getDoc(doc(db, 'profiles', c.receiver_id))
        c.receiver = receiverSnap.exists() ? { id: receiverSnap.id, ...receiverSnap.data() } : {}
      }
    }

    // Deduplicate connections by user ID
    const seenConnectionIds = new Set()
    const connections = []
    for (const c of connectionsData) {
      if (c.status === 'accepted') {
        const otherPerson = c.requester_id === user.uid ? c.receiver : c.requester
        const otherId = otherPerson?.id || (c.requester_id === user.uid ? c.receiver_id : c.requester_id)
        if (otherId && !seenConnectionIds.has(otherId) && otherId !== user.uid) {
          seenConnectionIds.add(otherId)
          connections.push({ 
            id: otherId, 
            name: otherPerson?.full_name || otherPerson?.username || 'Anonymous', 
            role: otherPerson?.role || 'Skill Swapper', 
            status: 'online' 
          })
        }
      }
    }

    const seenRequestUsers = new Set()
    const requests = []
    for (const c of connectionsData) {
      if (c.status === 'pending' && c.receiver_id === user.uid) {
        const reqId = c.requester_id
        if (reqId && !seenRequestUsers.has(reqId) && !seenConnectionIds.has(reqId)) {
          seenRequestUsers.add(reqId)
          requests.push({ 
            id: c.id, 
            name: c.requester?.full_name || c.requester?.username || 'Anonymous', 
            role: c.requester?.role || 'Wants to connect',
            requesterId: reqId
          })
        }
      }
    }

    const seenSentUsers = new Set()
    const sentRequests = []
    for (const c of connectionsData) {
      if (c.status === 'pending' && c.requester_id === user.uid) {
        const recId = c.receiver_id
        if (recId && !seenSentUsers.has(recId) && !seenConnectionIds.has(recId)) {
          seenSentUsers.add(recId)
          sentRequests.push({ 
            id: c.id, 
            name: c.receiver?.full_name || c.receiver?.username || 'Anonymous', 
            role: c.receiver?.role || 'Skill Partner',
            receiverId: recId
          })
        }
      }
    }

    const profilesSnap = await getDocs(collection(db, 'profiles'))
    const allProfiles = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    const connectedIds = new Set(seenConnectionIds)
    connectedIds.add(user.uid)

    const suggestions = allProfiles
      .filter(p => !connectedIds.has(p.id) && !seenRequestUsers.has(p.id) && !seenSentUsers.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.full_name || p.username || 'Anonymous',
        role: p.role,
        skills: []
      }))

    return {
      connections,
      requests,
      sentRequests,
      suggestions,
    }
  } catch(e) {
    console.error('Error fetching connections:', e)
    return { connections: [], requests: [], sentRequests: [], suggestions: [] }
  }
}

export function subscribeToConnections(callback) {
  const user = getUser()
  if (!user) return () => {}

  const connQuery = query(collection(db, 'connections'), or(where('requester_id', '==', user.uid), where('receiver_id', '==', user.uid)))
  
  return onSnapshot(connQuery, async (snapshot) => {
    try {
      const connectionsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

      for (const c of connectionsData) {
        if (c.requester_id) {
          const requesterSnap = await getDoc(doc(db, 'profiles', c.requester_id))
          c.requester = requesterSnap.exists() ? { id: requesterSnap.id, ...requesterSnap.data() } : {}
        }
        if (c.receiver_id) {
          const receiverSnap = await getDoc(doc(db, 'profiles', c.receiver_id))
          c.receiver = receiverSnap.exists() ? { id: receiverSnap.id, ...receiverSnap.data() } : {}
        }
      }

      // Deduplicate connections by user ID
      const seenConnectionIds = new Set()
      const connections = []
      for (const c of connectionsData) {
        const status = String(c.status || '').toLowerCase().trim()
        const isAccepted = status === 'accepted' || status === 'active' || status === 'connected'

        if (isAccepted) {
          const req = c.requester_id || c.requesterId || c.sender_id || c.fromUserId
          const rec = c.receiver_id || c.receiverId || c.recipient_id || c.toUserId
          const otherPerson = req === user.uid ? c.receiver : c.requester
          const otherId = otherPerson?.id || (req === user.uid ? rec : req)

          if (otherId && !seenConnectionIds.has(otherId) && otherId !== user.uid) {
            seenConnectionIds.add(otherId)
            connections.push({ 
              id: otherId, 
              name: otherPerson?.full_name || otherPerson?.username || 'Connection', 
              role: otherPerson?.role || 'Skill Swapper', 
              status: 'online' 
            })
          }
        }
      }

      const seenRequestUsers = new Set()
      const requests = []
      for (const c of connectionsData) {
        if (c.status === 'pending' && c.receiver_id === user.uid) {
          const reqId = c.requester_id
          if (reqId && !seenRequestUsers.has(reqId) && !seenConnectionIds.has(reqId)) {
            seenRequestUsers.add(reqId)
            requests.push({ 
              id: c.id, 
              name: c.requester?.full_name || c.requester?.username || 'Anonymous', 
              role: c.requester?.role || 'Wants to connect',
              requesterId: reqId
            })
          }
        }
      }

      const seenSentUsers = new Set()
      const sentRequests = []
      for (const c of connectionsData) {
        if (c.status === 'pending' && c.requester_id === user.uid) {
          const recId = c.receiver_id
          if (recId && !seenSentUsers.has(recId) && !seenConnectionIds.has(recId)) {
            seenSentUsers.add(recId)
            sentRequests.push({ 
              id: c.id, 
              name: c.receiver?.full_name || c.receiver?.username || 'Anonymous', 
              role: c.receiver?.role || 'Skill Partner',
              receiverId: recId
            })
          }
        }
      }

      const profilesSnap = await getDocs(collection(db, 'profiles'))
      const allProfiles = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      
      const connectedIds = new Set(seenConnectionIds)
      connectedIds.add(user.uid)

      const suggestions = allProfiles
        .filter(p => !connectedIds.has(p.id) && !seenRequestUsers.has(p.id) && !seenSentUsers.has(p.id))
        .map(p => ({
          id: p.id,
          name: p.full_name || p.username || 'Anonymous',
          role: p.role,
          skills: []
        }))

      callback({ connections, requests, sentRequests, suggestions })
    } catch(e) {
      console.error('Error processing connections:', e)
      callback({ connections: [], requests: [], sentRequests: [], suggestions: [] })
    }
  })
}

export async function getConversations() {
  const user = getUser()
  if (!user) return { conversations: [], messages: [] }

  try {
    const convQuery = query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid))
    const convSnap = await getDocs(convQuery)
    const conversations = convSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    const formattedConvs = []
    
    for (const c of conversations) {
      const otherUserId = c.participantIds?.find(p => p !== user.uid)
      if (!otherUserId) continue;
      const otherUserSnap = await getDoc(doc(db, 'profiles', otherUserId))
      const otherUser = otherUserSnap.exists() ? otherUserSnap.data() : {}
      
      formattedConvs.push({
        id: c.id,
        name: otherUser.full_name || otherUser.username || 'Anonymous',
        avatar: undefined, 
        lastMessage: '...', 
        time: 'recent',
        unread: 0,
        status: 'offline',
        preview: '...' // added preview for UI
      })
    }
    
    return { conversations: formattedConvs, messages: [] }
  } catch(e) {
    console.error('Error fetching conversations:', e)
    return { conversations: [], messages: [] }
  }
}

export async function getScheduleData() {
  const user = getUser()
  if (!user) return { upcoming: [], completed: [], past: [] }

  try {
    const classesQuery = query(
      collection(db, 'classes'), 
      or(where('mentor_id', '==', user.uid), where('learner_id', '==', user.uid))
    )
    const classesSnap = await getDocs(classesQuery)
    const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    classes.sort((a, b) => new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0))

    if (classes.length === 0) return { upcoming: [], completed: [], past: [] }

    for (const c of classes) {
      if (c.mentor_id) {
        c.mentor = await resolvePartnerProfile(c.mentor_id)
      }
      if (c.learner_id) {
        c.learner = await resolvePartnerProfile(c.learner_id)
      }
    }

    const formatClassItem = (c) => {
      const isMentor = c.mentor_id === user.uid
      const otherPerson = isMentor ? c.learner : c.mentor
      const partnerId = isMentor ? c.learner_id : c.mentor_id
      const dateObj = new Date(c.scheduled_at)
      
      return {
        id: c.id,
        topic: c.topic || 'Skill Exchange',
        skill: c.skill || 'General',
        partnerName: otherPerson?.full_name || otherPerson?.username || 'Partner',
        partnerId: partnerId,
        date: isNaN(dateObj.getTime()) ? 'Upcoming' : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        time: isNaN(dateObj.getTime()) ? 'TBD' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scheduledAt: c.scheduled_at,
        duration: c.duration_minutes || 60,
        status: c.status || 'upcoming',
        isMentor
      }
    }

    const upcoming = classes
      .filter(c => c.status === 'upcoming')
      .map(formatClassItem)

    const completed = classes
      .filter(c => c.status === 'completed')
      .map(formatClassItem)

    return {
      upcoming,
      completed,
      past: completed
    }
  } catch(e) {
    console.error('Error fetching schedule:', e)
    return { upcoming: [], completed: [], past: [] }
  }
}

export async function getNotifications() {
  const user = getUser()
  if (!user) return []

  try {
    const notifQuery = query(collection(db, 'notifications'), where('recipientId', '==', user.uid), orderBy('created_at', 'desc'))
    const notifSnap = await getDocs(notifQuery)
    const notifications = notifSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (notifications.length === 0) return []

    const iconMap = {
      'connection': UserPlus,
      'message': MessageSquare,
      'schedule': CalendarCheck,
      'system': CheckCircle2
    }

    const toneMap = {
      'connection': 'blue',
      'message': 'purple',
      'schedule': 'orange',
      'system': 'green'
    }

    return notifications.map(n => ({
      id: n.id,
      icon: iconMap[n.type] || iconMap[n.type.split('_')[0]] || CircleEllipsis,
      tone: toneMap[n.type] || toneMap[n.type.split('_')[0]] || 'gray',
      title: n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1).replace('_', ' ') : 'Notification',
      description: n.content || n.message || '',
      time: n.created_at ? new Date(n.created_at.toDate()).toLocaleDateString() : 'Just now',
      relatedEntityId: n.relatedEntityId
    }))
  } catch(e) {
    console.error('Error fetching notifications:', e)
    return []
  }
}

export function subscribeToNotifications(callback) {
  const user = getUser()
  if (!user) return () => {}

  const notifQuery = query(collection(db, 'notifications'), where('recipientId', '==', user.uid))
  return onSnapshot(notifQuery, (snapshot) => {
    const rawDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    rawDocs.sort((a, b) => {
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime()
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime()
      return timeB - timeA
    })

    const iconMap = {
      'connection': UserPlus,
      'message': MessageSquare,
      'schedule': CalendarCheck,
      'schedule_reminder': Clock,
      'session_starting': Video,
      'system': CheckCircle2
    }

    const toneMap = {
      'connection': 'blue',
      'message': 'purple',
      'schedule': 'orange',
      'schedule_reminder': 'orange',
      'session_starting': 'green',
      'system': 'green'
    }

    const formatted = rawDocs.map(n => {
      const type = n.type || 'system'
      const baseType = type.split('_')[0]
      return {
        id: n.id,
        type: n.type,
        icon: iconMap[type] || iconMap[baseType] || CircleEllipsis,
        tone: toneMap[type] || toneMap[baseType] || 'gray',
        title: n.title || (n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1).replace(/_/g, ' ') : 'Notification'),
        description: n.content || n.message || '',
        time: n.created_at ? new Date(n.created_at.toDate ? n.created_at.toDate() : n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now',
        relatedEntityId: n.relatedEntityId,
        partnerId: n.partnerId,
        partnerName: n.partnerName
      }
    })
    callback(formatted)
  })
}

// Background checker for 1-hour and exact-time session reminders
export async function checkAndTriggerScheduleReminders() {
  const user = getUser()
  if (!user) return

  try {
    const classesQuery = query(
      collection(db, 'classes'),
      or(where('mentor_id', '==', user.uid), where('learner_id', '==', user.uid))
    )
    const classesSnap = await getDocs(classesQuery)
    if (classesSnap.empty) return

    const now = Date.now()

    for (const d of classesSnap.docs) {
      const cls = { id: d.id, ...d.data() }
      if (!cls.scheduled_at || cls.status !== 'upcoming') continue
      if (!cls.scheduled_at) continue

      const scheduledTime = new Date(cls.scheduled_at).getTime()
      if (isNaN(scheduledTime)) continue

      const diffMs = scheduledTime - now
      const diffMinutes = Math.round(diffMs / (1000 * 60))

      const partnerId = cls.mentor_id === user.uid ? cls.learner_id : cls.mentor_id
      let partnerName = 'Skill Partner'
      if (partnerId) {
        const pSnap = await getDoc(doc(db, 'profiles', partnerId))
        if (pSnap.exists()) {
          partnerName = pSnap.data().full_name || pSnap.data().username || 'Skill Partner'
        }
      }

      // 1. One Hour Before Reminder (diff between 1 and 60 minutes)
      if (diffMinutes > 0 && diffMinutes <= 60) {
        const reminderKey = `reminder_1h_${cls.id}_${user.uid}`
        const notifQuery = query(
          collection(db, 'notifications'),
          where('recipientId', '==', user.uid),
          where('reminderKey', '==', reminderKey)
        )
        const notifSnap = await getDocs(notifQuery)
        if (notifSnap.empty) {
          const timeText = diffMinutes === 60 ? '1 hour' : `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`
          await addDoc(collection(db, 'notifications'), {
            recipientId: user.uid,
            type: 'schedule_reminder',
            reminderKey: reminderKey,
            title: 'Upcoming Session Reminder (1 Hour)',
            content: `Reminder: Your session "${cls.topic || 'Skill Exchange'}" with ${partnerName} starts in ${timeText}!`,
            relatedEntityId: cls.id,
            partnerId: partnerId,
            partnerName: partnerName,
            created_at: serverTimestamp(),
            isRead: false
          })

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Upcoming Session Reminder', {
                body: `Your session "${cls.topic || 'Skill Exchange'}" with ${partnerName} starts in ${timeText}!`,
                icon: '/vite.svg'
              })
            } catch(e) {}
          }
        }
      }

      // 2. Exact Time / Starting Now Reminder (diff between -15 and 5 minutes)
      if (diffMinutes >= -15 && diffMinutes <= 5) {
        const reminderKey = `reminder_now_${cls.id}_${user.uid}`
        const notifQuery = query(
          collection(db, 'notifications'),
          where('recipientId', '==', user.uid),
          where('reminderKey', '==', reminderKey)
        )
        const notifSnap = await getDocs(notifQuery)
        if (notifSnap.empty) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: user.uid,
            type: 'session_starting',
            reminderKey: reminderKey,
            title: 'Session Starting Now!',
            content: `It's time! Your session "${cls.topic || 'Skill Exchange'}" with ${partnerName} is starting now. Click to join the video room.`,
            relatedEntityId: cls.id,
            partnerId: partnerId,
            partnerName: partnerName,
            created_at: serverTimestamp(),
            isRead: false
          })

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Session Starting Now!', {
                body: `Your session "${cls.topic || 'Skill Exchange'}" with ${partnerName} is starting now!`,
                icon: '/vite.svg'
              })
            } catch(e) {}
          }
        }
      }
    }
  } catch(e) {
    console.error('Error checking schedule reminders:', e)
  }
}

export async function getClasses() {
  const user = getUser()
  if (!user) return { upcoming: [], completed: [] }

  try {
    const classesQuery = query(collection(db, 'classes'), or(where('mentor_id', '==', user.uid), where('learner_id', '==', user.uid)))
    const classesSnap = await getDocs(classesQuery)
    const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (classes.length === 0) return { upcoming: [], completed: [] }

    for (const c of classes) {
      if (c.mentor_id) {
        const mSnap = await getDoc(doc(db, 'profiles', c.mentor_id))
        c.mentor = mSnap.exists() ? mSnap.data() : {}
      }
      if (c.learner_id) {
        const lSnap = await getDoc(doc(db, 'profiles', c.learner_id))
        c.learner = lSnap.exists() ? lSnap.data() : {}
      }
    }

    const upcoming = classes
      .filter(c => c.status === 'upcoming')
      .map(c => {
        const isMentor = c.mentor_id === user.uid
        const otherPerson = isMentor ? c.learner : c.mentor
        const partnerId = isMentor ? c.learner_id : c.mentor_id
        return {
          id: c.id,
          title: c.topic || 'Skill Swap Class',
          mentor: otherPerson?.full_name || otherPerson?.username || 'Anonymous',
          mentorId: partnerId || otherPerson?.id || c.mentor_id || 'unknown',
          partnerId: partnerId,
          scheduled_at: c.scheduled_at,
          duration_minutes: c.duration_minutes || 60,
          dateStr: new Date(c.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: `${c.duration_minutes || 60} mins`,
          joinStatus: getSessionJoinStatus(c.scheduled_at, c.duration_minutes || 60)
        }
      })

    const completed = classes
      .filter(c => c.status === 'completed')
      .map(c => {
        const isMentor = c.mentor_id === user.uid
        const otherPerson = isMentor ? c.learner : c.mentor
        return {
          id: c.id,
          title: c.topic,
          mentor: otherPerson?.full_name || 'Anonymous',
          mentorId: otherPerson?.id || c.mentor_id || 'unknown',
          rating: 'N/A', 
        }
      })

    return {
      upcoming,
      completed,
    }
  } catch(e) {
    console.error('Error fetching classes:', e)
    return { upcoming: [], completed: [] }
  }
}

// Mutators
export async function sendConnectionRequest(receiverId) {
  const user = getUser()
  if (!user || !receiverId || user.uid === receiverId) return false
  try {
    // 1. Check if a connection already exists (user only can send request one time)
    const q1 = query(
      collection(db, 'connections'),
      where('requester_id', '==', user.uid),
      where('receiver_id', '==', receiverId)
    )
    const q2 = query(
      collection(db, 'connections'),
      where('requester_id', '==', receiverId),
      where('receiver_id', '==', user.uid)
    )
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
    if (!snap1.empty || !snap2.empty) {
      // Already sent or already connected
      return true
    }

    const connRef = await addDoc(collection(db, 'connections'), {
      requester_id: user.uid,
      receiver_id: receiverId,
      status: 'pending',
      created_at: serverTimestamp()
    })

    // Fetch requester profile name
    let requesterName = 'A peer'
    try {
      const profileSnap = await getDoc(doc(db, 'profiles', user.uid))
      if (profileSnap.exists()) {
        const data = profileSnap.data()
        requesterName = data.full_name || data.username || 'A peer'
      }
    } catch (e) {
      console.warn('Could not fetch requester profile name:', e)
    }
    
    await addDoc(collection(db, 'notifications'), {
      type: 'connection_request',
      content: `${requesterName} sent you a connection request`,
      recipientId: receiverId,
      relatedEntityId: connRef.id,
      created_at: serverTimestamp(),
      isRead: false
    })
    return true
  } catch (e) {
    console.error('Error sending connection request:', e)
    return false
  }
}

export async function sendMessage(conversationId, text, fileData = null) {
  const user = getUser()
  if (!user || !conversationId || (!text && !fileData)) return false
  try {
    const textContent = (text || '').trim()
    const messageDoc = {
      senderId: user.uid,
      sender_id: user.uid,
      content: textContent,
      text: textContent,
      createdAt: serverTimestamp(),
      created_at: serverTimestamp(),
      isRead: false
    }
    if (fileData) {
      messageDoc.file = fileData
    }

    await addDoc(collection(db, `conversations/${conversationId}/messages`), messageDoc)

    // Update the parent conversation for real-time sidebar tracking
    const lastPreview = fileData ? `📎 ${fileData.name}` : textContent
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: lastPreview,
      last_message: lastPreview,
      updatedAt: serverTimestamp(),
      updated_at: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      last_message_at: serverTimestamp(),
      lastSenderId: user.uid,
      last_sender_id: user.uid
    })
    
    return true
  } catch (e) {
    console.error('Error sending message:', e)
    return false
  }
}

export async function startConversation(otherUserId) {
  const user = getUser()
  if (!user || !otherUserId) return null
  
  try {
    const convQuery = query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid))
    const convSnap = await getDocs(convQuery)
    for (const docSnap of convSnap.docs) {
      const data = docSnap.data()
      if (data.participantIds && data.participantIds.includes(otherUserId)) {
        return docSnap.id
      }
    }
    
    const newConvRef = await addDoc(collection(db, 'conversations'), {
      participantIds: [user.uid, otherUserId],
      lastMessage: '',
      last_message: '',
      createdAt: serverTimestamp(),
      created_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updated_at: serverTimestamp()
    })
    return newConvRef.id
  } catch(e) {
    console.error('Error starting conversation:', e)
    return null
  }
}

export function subscribeToConversations(callback) {
  const user = getUser()
  if (!user) return () => {}

  // Fetch all conversations where user is a participant
  const convQuery = query(
    collection(db, 'conversations'), 
    where('participantIds', 'array-contains', user.uid)
  )

  const unsubscribe = onSnapshot(convQuery, async (snapshot) => {
    try {
      const formattedConvs = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const c = { id: docSnap.id, ...docSnap.data() }
        const otherUserId = c.participantIds?.find(p => p !== user.uid)
        
        let otherUser = {}
        if (otherUserId) {
          const otherUserSnap = await getDoc(doc(db, 'profiles', otherUserId))
          if (otherUserSnap.exists()) otherUser = otherUserSnap.data()
        }

        const rawTime = c.updatedAt || c.updated_at || c.lastMessageAt || c.last_message_at || c.createdAt || c.created_at
        let updatedAtMillis = 0
        let timeStr = 'recent'
        if (rawTime) {
          if (typeof rawTime.toMillis === 'function') {
            updatedAtMillis = rawTime.toMillis()
            timeStr = new Date(updatedAtMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } else if (rawTime.toDate) {
            const d = rawTime.toDate()
            updatedAtMillis = d.getTime()
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        }

        const msgPreview = c.lastMessage || c.last_message || 'Start chatting...'

        return {
          id: c.id,
          otherUserId: otherUserId,
          name: otherUser.full_name || otherUser.username || 'Anonymous',
          avatar: otherUser.avatar_url || undefined, 
          lastMessage: msgPreview, 
          time: timeStr,
          updatedAtMillis,
          unread: 0,
          status: 'offline',
          preview: msgPreview
        }
      }))

      // Sort client-side by newest first to avoid needing a composite index
      formattedConvs.sort((a, b) => b.updatedAtMillis - a.updatedAtMillis)

      // Deduplicate by otherUserId AND by normalized partner full_name so duplicates never appear
      const seenPartners = new Set()
      const seenNames = new Set()
      const dedupedConvs = []

      for (const conv of formattedConvs) {
        const partnerKey = conv.otherUserId || conv.id
        const nameKey = (conv.name || '').trim().toLowerCase()
        if (!seenPartners.has(partnerKey) && !seenNames.has(nameKey)) {
          seenPartners.add(partnerKey)
          if (nameKey && nameKey !== 'anonymous') seenNames.add(nameKey)
          dedupedConvs.push(conv)
        }
      }

      callback(dedupedConvs)
    } catch (e) {
      console.error('Error processing conversations:', e)
      callback([])
    }
  })

  return unsubscribe
}

export function subscribeToMessages(conversationId, callback) {
  if (!conversationId) return () => {}
  const messagesQuery = query(
    collection(db, `conversations/${conversationId}/messages`)
  )
  
  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const rawMessages = []
    const currentUser = getUser()
    const myUid = currentUser?.uid

    snapshot.forEach((doc) => {
      const data = doc.data()
      const rawDate = data.createdAt || data.created_at
      let timestampMillis = 0
      let timeFormatted = 'Now'

      if (rawDate) {
        if (typeof rawDate.toMillis === 'function') {
          timestampMillis = rawDate.toMillis()
          timeFormatted = new Date(timestampMillis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (rawDate.toDate) {
          const d = rawDate.toDate()
          timestampMillis = d.getTime()
          timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (rawDate instanceof Date) {
          timestampMillis = rawDate.getTime()
          timeFormatted = rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (typeof rawDate === 'number') {
          timestampMillis = rawDate
          timeFormatted = new Date(rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }

      const isMe = data.senderId === myUid || data.sender_id === myUid

      rawMessages.push({
        id: doc.id,
        senderId: data.senderId || data.sender_id,
        from: isMe ? 'me' : 'them',
        text: data.content || data.text || '',
        content: data.content || data.text || '',
        file: data.file || null,
        time: timeFormatted,
        timestampMillis
      })
    })

    // Sort ascending by time in memory so all historical messages appear in order
    rawMessages.sort((a, b) => a.timestampMillis - b.timestampMillis)
    callback(rawMessages)
  })
  return unsubscribe
}
