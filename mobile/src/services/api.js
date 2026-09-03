import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  or,
  and,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export const resolvePartnerProfile = async (partnerId) => {
  if (!partnerId) return { full_name: 'Skill Partner' }
  try {
    const partnerSnap = await getDoc(doc(db, 'profiles', partnerId))
    if (partnerSnap.exists()) {
      return { id: partnerId, ...partnerSnap.data() }
    }
  } catch (err) {
    console.warn('Resolve partner profile note:', err)
  }
  return { id: partnerId, full_name: 'Skill Partner' }
}

const getUserId = () => auth.currentUser?.uid

// --- Dashboard ---
export async function getDashboardData() {
  const uid = getUserId()
  if (!uid) return null

  let profile = null
  let learningSkills = []
  let teachingSkills = []
  let upcomingClasses = []
  let activeConnections = []

  try {
    try {
      const profileSnap = await getDoc(doc(db, 'profiles', uid))
      if (profileSnap.exists()) {
        profile = profileSnap.data()
      }
    } catch(perr) {
      console.warn('Local profile get note:', perr)
      const u = auth.currentUser
      if (u) {
        profile = {
          full_name: u.displayName || 'Member',
          username: u.email ? u.email.split('@')[0] : 'member',
          email: u.email
        }
      }
    }

    // Skills
    try {
      const lsSnap = await getDocs(query(collection(db, 'skills_learning'), where('profile_id', '==', uid)))
      learningSkills = lsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.warn('Learning skills fetch:', e)
    }

    try {
      const tsSnap = await getDocs(query(collection(db, 'skills_teaching'), where('profile_id', '==', uid)))
      teachingSkills = tsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.warn('Teaching skills fetch:', e)
    }

    // Classes completed stats
    let classesTaken = 0
    let classesTaught = 0
    try {
      const ctSnap = await getDocs(query(collection(db, 'classes'), where('learner_id', '==', uid), where('status', '==', 'completed')))
      classesTaken = ctSnap.size
      const cdSnap = await getDocs(query(collection(db, 'classes'), where('mentor_id', '==', uid), where('status', '==', 'completed')))
      classesTaught = cdSnap.size
    } catch (err) {
      console.warn('Classes stats error:', err)
    }

    // Upcoming classes
    try {
      const classesQuery = query(
        collection(db, 'classes'),
        or(where('mentor_id', '==', uid), where('learner_id', '==', uid))
      )
      const classesSnap = await getDocs(classesQuery)
      const rawClasses = classesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.status === 'upcoming')

      for (const cls of rawClasses) {
        const partnerId = cls.mentor_id === uid ? cls.learner_id : cls.mentor_id
        if (partnerId) {
          cls.partner = await resolvePartnerProfile(partnerId)
        }
        upcomingClasses.push(cls)
      }

      upcomingClasses.sort((a, b) => {
        const timeA = new Date(a.scheduled_at || 0).getTime()
        const timeB = new Date(b.scheduled_at || 0).getTime()
        return timeA - timeB
      })
      upcomingClasses = upcomingClasses.slice(0, 5)
    } catch (err) {
      console.warn('Classes fetch error:', err)
    }

    // Connections count
    const seenConnIds = new Set()
    try {
      const connData = await getConnections()
      if (connData?.active?.length > 0) {
        for (const c of connData.active) {
          const pid = c.partnerId || c.id
          if (pid && !seenConnIds.has(pid)) {
            seenConnIds.add(pid)
            activeConnections.push(c)
          }
        }
      }
    } catch (err) {
      console.warn('getConnections error in mobile getDashboardData:', err)
    }

    try {
      const connQuery = query(
        collection(db, 'connections'),
        or(where('requester_id', '==', uid), where('receiver_id', '==', uid))
      )
      const connSnap = await getDocs(connQuery)
      for (const d of connSnap.docs) {
        const cData = d.data()
        const status = String(cData.status || '').toLowerCase().trim()
        const isAccepted = status === 'accepted' || status === 'active' || status === 'connected'
        const req = cData.requester_id || cData.requesterId || cData.sender_id || cData.fromUserId
        const rec = cData.receiver_id || cData.receiverId || cData.recipient_id || cData.toUserId
        const partnerId = req === uid ? rec : req

        if (isAccepted && partnerId && partnerId !== uid && !seenConnIds.has(partnerId)) {
          seenConnIds.add(partnerId)
          activeConnections.push({ id: d.id, partnerId, ...cData })
        }
      }
    } catch (err) {
      console.warn('Connections fetch error:', err)
    }

    // Check active conversation partners
    try {
      const convSnap = await getDocs(query(collection(db, 'conversations'), where('participantIds', 'array-contains', uid)))
      for (const d of convSnap.docs) {
        const cData = d.data()
        const pList = cData.participantIds || cData.participants || []
        const partnerId = pList.find(p => p && p !== uid)
        if (partnerId && !seenConnIds.has(partnerId)) {
          seenConnIds.add(partnerId)
          activeConnections.push({ id: d.id, partnerId, ...cData })
        }
      }
    } catch (err) {}

  } catch (e) {
    console.error('Error fetching mobile dashboard data:', e)
  }

  const parseSkillList = (val, subList) => {
    if (subList && subList.length > 0) {
      const extracted = subList.map(item => typeof item === 'string' ? item : (item.skill_name || item.name || item.title || '')).filter(Boolean)
      if (extracted.length > 0) return extracted
    }
    if (!val) return []
    if (Array.isArray(val)) {
      return val.map(item => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) return item.name || item.skill_name || item.title || ''
        return ''
      }).filter(Boolean)
    }
    if (typeof val === 'string') {
      return val.split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  const userLearningSkills = parseSkillList(profile?.skills_learning || profile?.skillsLearning || profile?.skills_wanted || profile?.learning, learningSkills)
  const userTeachingSkills = parseSkillList(profile?.skills_teaching || profile?.skillsTeaching || profile?.skills_offered || profile?.teaching, teachingSkills)

  const firstClass = upcomingClasses?.[0]
  const firstScheduled = firstClass?.scheduled_at?.toDate ? firstClass.scheduled_at.toDate().toISOString() : firstClass?.scheduled_at

  // Mentors from real registered profiles
  let mentors = []
  try {
    const pSnap = await getDocs(query(collection(db, 'profiles'), limit(10)))
    pSnap.docs.forEach(d => {
      if (d.id !== uid) {
        const mData = d.data()
        mentors.push({
          id: d.id,
          uid: d.id,
          name: mData.full_name || mData.username || 'Member',
          title: mData.role || mData.college_or_company || 'Skill Swapper',
          rating: mData.rating || 5.0,
          reviewsCount: mData.reviews_count || 0,
          avatar: mData.avatar_url,
          avatar_url: mData.avatar_url,
          skillsTeaching: Array.isArray(mData.skills_teaching) ? mData.skills_teaching : [],
          skillsLearning: Array.isArray(mData.skills_learning) ? mData.skills_learning : []
        })
      }
    })
  } catch (e) {}

  return {
    profile,
    welcomeName: profile?.full_name?.split(' ')[0] || profile?.username || 'Friend',
    learning: {
      title: userLearningSkills[0] || null,
      allSkills: userLearningSkills,
      level: learningSkills?.[0]?.level || 'Beginner'
    },
    teaching: {
      title: userTeachingSkills[0] || null,
      allSkills: userTeachingSkills,
      level: teachingSkills?.[0]?.level || 'Expert'
    },
    upcomingClass: firstClass ? {
      id: firstClass.id,
      title: firstClass.topic || 'Skill Exchange Session',
      partnerName: firstClass.partner?.full_name || 'Skill Partner',
      partnerId: firstClass.mentor_id === uid ? firstClass.learner_id : firstClass.mentor_id,
      scheduledAt: firstScheduled,
      durationMinutes: firstClass.duration_minutes || 60,
      status: firstClass.status,
      joinStatus: getSessionJoinStatus(firstScheduled, firstClass.duration_minutes || 60)
    } : null,
    totalConnections: activeConnections.length,
    upcomingCount: upcomingClasses.length,
    classesTaken: classesTaken,
    classesTaught: classesTaught,
    credits: profile?.credits ?? 0,
    mentors
  }
}

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
    message: 'Session is live now! Tap to join video room.'
  }
}

// --- Search & Discover Mentors ---
export async function getSearchResults(searchTerm = '', selectedCategory = 'All') {
  const uid = getUserId()
  try {
    const profilesSnap = await getDocs(query(collection(db, 'profiles'), limit(30)))
    let mentors = []

    profilesSnap.forEach((docSnap) => {
      if (docSnap.id === uid) return
      const data = docSnap.data()
      mentors.push({
        id: docSnap.id,
        uid: docSnap.id,
        name: data.full_name || data.username || 'Skill Swapper',
        username: data.username || 'user',
        title: data.headline || data.role || (data.skills_teaching?.length ? `Teaches ${data.skills_teaching.join(', ')}` : 'Skill Mentor'),
        rating: data.rating || 5.0,
        reviewsCount: data.reviews_count || 0,
        avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${docSnap.id}`,
        bio: data.bio || 'Passionate about sharing practical knowledge and learning new skills.',
        skillsTeaching: Array.isArray(data.skills_teaching) ? data.skills_teaching : [],
        skillsLearning: Array.isArray(data.skills_learning) ? data.skills_learning : [],
        location: data.location || data.city || 'Remote',
        creditsPerHour: data.credits_per_hour || 1
      })
    })

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      mentors = mentors.filter(m => 
        m.name.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        (m.skillsTeaching && m.skillsTeaching.some(s => s.toLowerCase().includes(q))) ||
        (m.skillsLearning && m.skillsLearning.some(s => s.toLowerCase().includes(q)))
      )
    }

    if (selectedCategory && selectedCategory !== 'All') {
      const cat = selectedCategory.toLowerCase()
      mentors = mentors.filter(m =>
        (m.skillsTeaching && m.skillsTeaching.some(s => s.toLowerCase().includes(cat))) ||
        (m.skillsLearning && m.skillsLearning.some(s => s.toLowerCase().includes(cat)))
      )
    }

    return mentors
  } catch (error) {
    console.error('Error in getSearchResults:', error)
    return []
  }
}

// --- User Profile ---
export async function getUserProfile(profileId) {
  const uid = profileId || getUserId()
  if (!uid) return null

  try {
    const docSnap = await getDoc(doc(db, 'profiles', uid))
    if (!docSnap.exists()) {
      return null
    }
    const data = docSnap.data()
    return {
      id: docSnap.id,
      uid: docSnap.id,
      ...data,
      avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${uid}`
    }
  } catch (e) {
    console.error('Error fetching profile:', e)
    return null
  }
}

export async function updateUserProfile(updates) {
  const uid = getUserId()
  if (!uid) return false
  try {
    const formattedUpdates = { ...updates, updated_at: serverTimestamp() }

    // If skills_teaching is provided as string, convert to array
    if (typeof formattedUpdates.skills_teaching === 'string') {
      formattedUpdates.skills_teaching = formattedUpdates.skills_teaching.split(',').map(s => s.trim()).filter(Boolean)
    }
    // If skills_learning is provided as string, convert to array
    if (typeof formattedUpdates.skills_learning === 'string') {
      formattedUpdates.skills_learning = formattedUpdates.skills_learning.split(',').map(s => s.trim()).filter(Boolean)
    }

    await updateDoc(doc(db, 'profiles', uid), formattedUpdates)

    // Also sync to skills_teaching and skills_learning subcollections if updated
    if (Array.isArray(formattedUpdates.skills_teaching)) {
      try {
        const tsSnap = await getDocs(query(collection(db, 'skills_teaching'), where('profile_id', '==', uid)))
        await Promise.all(tsSnap.docs.map(d => deleteDoc(doc(db, 'skills_teaching', d.id))))
        for (const skillName of formattedUpdates.skills_teaching) {
          await addDoc(collection(db, 'skills_teaching'), {
            profile_id: uid,
            skill_name: skillName,
            level: 'Expert',
            created_at: serverTimestamp()
          })
        }
      } catch (err) {}
    }

    if (Array.isArray(formattedUpdates.skills_learning)) {
      try {
        const lsSnap = await getDocs(query(collection(db, 'skills_learning'), where('profile_id', '==', uid)))
        await Promise.all(lsSnap.docs.map(d => deleteDoc(doc(db, 'skills_learning', d.id))))
        for (const skillName of formattedUpdates.skills_learning) {
          await addDoc(collection(db, 'skills_learning'), {
            profile_id: uid,
            skill_name: skillName,
            level: 'Beginner',
            created_at: serverTimestamp()
          })
        }
      } catch (err) {}
    }

    return true
  } catch (e) {
    console.error('Error updating profile:', e)
    return false
  }
}

// --- Connections (matching firestore.rules requester_id & receiver_id) ---
export async function sendConnectionRequest(targetUserId, message = '') {
  const uid = getUserId()
  if (!uid || uid === targetUserId) return false

  try {
    const q1 = query(
      collection(db, 'connections'),
      and(
        where('requester_id', '==', uid),
        where('receiver_id', '==', targetUserId)
      )
    )
    const s1 = await getDocs(q1)
    if (!s1.empty) return true

    await addDoc(collection(db, 'connections'), {
      requester_id: uid,
      receiver_id: targetUserId,
      status: 'pending',
      message: message || "Hi! I'd love to swap skills with you.",
      created_at: serverTimestamp()
    })

    // Create notification
    await addDoc(collection(db, 'notifications'), {
      recipientId: targetUserId,
      fromUserId: uid,
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'Someone sent you a skill swap connection request!',
      read: false,
      created_at: serverTimestamp()
    })

    return true
  } catch (e) {
    console.error('Error sending connection request:', e)
    return false
  }
}

export async function getConnections() {
  const uid = getUserId()
  if (!uid) return { active: [], pendingIncoming: [], pendingOutgoing: [] }

  try {
    const q = query(
      collection(db, 'connections'),
      or(where('requester_id', '==', uid), where('receiver_id', '==', uid))
    )
    const snap = await getDocs(q)
    const rawActive = []
    const rawPendingIncoming = []
    const rawPendingOutgoing = []

    for (const d of snap.docs) {
      const conn = { id: d.id, ...d.data() }
      const partnerId = conn.requester_id === uid ? conn.receiver_id : conn.requester_id
      if (partnerId) {
        const partnerSnap = await getDoc(doc(db, 'profiles', partnerId))
        conn.partner = partnerSnap.exists() ? { id: partnerId, ...partnerSnap.data() } : { id: partnerId, full_name: 'User' }
        conn.partnerId = partnerId
      }

      if (conn.status === 'accepted') {
        rawActive.push(conn)
      } else if (conn.status === 'pending') {
        if (conn.requester_id === uid) {
          rawPendingOutgoing.push(conn)
        } else {
          rawPendingIncoming.push(conn)
        }
      }
    }

    // Deduplicate by partnerId keeping the latest/unique
    const dedupe = (list) => {
      const map = new Map()
      for (const item of list) {
        const pid = item.partnerId || item.id
        if (!map.has(pid)) {
          map.set(pid, item)
        }
      }
      return Array.from(map.values())
    }

    return {
      active: dedupe(rawActive),
      pendingIncoming: dedupe(rawPendingIncoming),
      pendingOutgoing: dedupe(rawPendingOutgoing)
    }
  } catch (e) {
    console.error('Error fetching connections:', e)
    return { active: [], pendingIncoming: [], pendingOutgoing: [] }
  }
}

export function subscribeToConnections(callback) {
  const uid = getUserId()
  if (!uid) return () => {}

  const q = query(
    collection(db, 'connections'),
    or(where('requester_id', '==', uid), where('receiver_id', '==', uid))
  )

  return onSnapshot(q, async (snap) => {
    try {
      const rawActive = []
      const rawPendingIncoming = []
      const rawPendingOutgoing = []

      for (const d of snap.docs) {
        const conn = { id: d.id, ...d.data() }
        const status = String(conn.status || '').toLowerCase().trim()
        const req = conn.requester_id || conn.requesterId || conn.sender_id || conn.fromUserId
        const rec = conn.receiver_id || conn.receiverId || conn.recipient_id || conn.toUserId
        const partnerId = req === uid ? rec : req

        if (partnerId) {
          const partnerSnap = await getDoc(doc(db, 'profiles', partnerId))
          conn.partner = partnerSnap.exists() ? { id: partnerId, ...partnerSnap.data() } : { id: partnerId, full_name: 'User' }
          conn.partnerId = partnerId
        }

        if (status === 'accepted' || status === 'active' || status === 'connected') {
          rawActive.push(conn)
        } else if (status === 'pending') {
          if (req === uid) {
            rawPendingOutgoing.push(conn)
          } else {
            rawPendingIncoming.push(conn)
          }
        }
      }

      const dedupe = (list) => {
        const map = new Map()
        for (const item of list) {
          const pid = item.partnerId || item.id
          if (!map.has(pid)) {
            map.set(pid, item)
          }
        }
        return Array.from(map.values())
      }

      callback({
        active: dedupe(rawActive),
        pendingIncoming: dedupe(rawPendingIncoming),
        pendingOutgoing: dedupe(rawPendingOutgoing)
      })
    } catch (e) {
      console.warn('Real-time connections error:', e)
    }
  })
}

export async function respondToConnectionRequest(connectionId, accept = true) {
  try {
    if (accept) {
      await updateDoc(doc(db, 'connections', connectionId), {
        status: 'accepted',
        updated_at: serverTimestamp()
      })
    } else {
      await deleteDoc(doc(db, 'connections', connectionId))
    }
    return true
  } catch (e) {
    console.error('Error responding to connection:', e)
    return false
  }
}

// --- Messages & Conversations (matching firestore.rules participantIds & senderId) ---
export async function getConversations() {
  const uid = getUserId()
  if (!uid) return []

  try {
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', uid)
    )
    const snap = await getDocs(q)
    const rawConvs = []

    for (const d of snap.docs) {
      const conv = { id: d.id, ...d.data() }
      const pList = conv.participantIds || conv.participants || []
      const partnerId = pList.find(p => p !== uid)
      if (partnerId) {
        conv.partner = await resolvePartnerProfile(partnerId)
        conv.partnerId = partnerId
      }
      conv.last_message = conv.last_message || conv.lastMessage || conv.text || 'Start chatting with your partner'
      rawConvs.push(conv)
    }

    // Deduplicate conversations by partnerId OR full_name (case-insensitive), keeping the most recent one
    const seenPartners = new Map()
    for (const c of rawConvs) {
      const normalizedName = c.partner?.full_name?.trim().toLowerCase()
      const key = c.partnerId || normalizedName || c.id
      if (!seenPartners.has(key)) {
        seenPartners.set(key, c)
      } else {
        const existing = seenPartners.get(key)
        const existingTime = existing.last_message_at?.toMillis ? existing.last_message_at.toMillis() : (existing.created_at?.toMillis ? existing.created_at.toMillis() : 0)
        const currentTime = c.last_message_at?.toMillis ? c.last_message_at.toMillis() : (c.created_at?.toMillis ? c.created_at.toMillis() : 0)
        if (currentTime > existingTime) {
          seenPartners.set(key, c)
        }
      }
    }

    return Array.from(seenPartners.values())
  } catch (e) {
    console.warn('Conversations note:', e.message)
    return []
  }
}

export function subscribeToConversations(callback) {
  const uid = getUserId()
  if (!uid) return () => {}

  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', uid)
  )

  return onSnapshot(q, async (snap) => {
    try {
      const rawConvs = []
      for (const d of snap.docs) {
        const conv = { id: d.id, ...d.data() }
        const pList = conv.participantIds || conv.participants || []
        const partnerId = pList.find(p => p !== uid)
        if (partnerId) {
          conv.partner = await resolvePartnerProfile(partnerId)
          conv.partnerId = partnerId
        }
        conv.last_message = conv.last_message || conv.lastMessage || conv.text || 'Start chatting with your partner'
        rawConvs.push(conv)
      }

      const seenPartners = new Map()
      for (const c of rawConvs) {
        const normalizedName = c.partner?.full_name?.trim().toLowerCase()
        const key = c.partnerId || normalizedName || c.id
        if (!seenPartners.has(key)) {
          seenPartners.set(key, c)
        } else {
          const existing = seenPartners.get(key)
          const existingTime = existing.last_message_at?.toMillis ? existing.last_message_at.toMillis() : 0
          const currentTime = c.last_message_at?.toMillis ? c.last_message_at.toMillis() : 0
          if (currentTime > existingTime) {
            seenPartners.set(key, c)
          }
        }
      }
      callback(Array.from(seenPartners.values()))
    } catch (e) {
      console.warn('Real-time convs error:', e)
    }
  })
}

export async function getOrCreateConversation(otherUserId) {
  const uid = getUserId()
  if (!uid || !otherUserId) return null

  try {
    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', uid)
    )
    const snap = await getDocs(q)
    const existing = snap.docs.find(d => d.data().participantIds?.includes(otherUserId))

    if (existing) {
      return existing.id
    }

    // Create new conversation
    const docRef = await addDoc(collection(db, 'conversations'), {
      participantIds: [uid, otherUserId],
      last_message: 'Started conversation',
      lastMessage: 'Started conversation',
      last_message_at: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      created_at: serverTimestamp()
    })
    return docRef.id
  } catch (e) {
    console.error('Error creating conversation:', e)
    return null
  }
}

export function subscribeToMessages(conversationId, callback) {
  if (!conversationId) return () => {}
  const q = query(collection(db, `conversations/${conversationId}/messages`))
  
  return onSnapshot(q, (snapshot) => {
    const messages = []
    snapshot.forEach((d) => {
      const data = d.data()
      const rawDate = data.createdAt || data.created_at
      let timestampMillis = 0
      let dateObj = new Date()

      if (rawDate) {
        if (typeof rawDate.toMillis === 'function') {
          timestampMillis = rawDate.toMillis()
          dateObj = new Date(timestampMillis)
        } else if (rawDate.toDate) {
          dateObj = rawDate.toDate()
          timestampMillis = dateObj.getTime()
        } else if (rawDate instanceof Date) {
          dateObj = rawDate
          timestampMillis = rawDate.getTime()
        } else if (typeof rawDate === 'number') {
          timestampMillis = rawDate
          dateObj = new Date(rawDate)
        }
      }

      messages.push({
        id: d.id,
        ...data,
        text: data.text || data.content || '',
        content: data.content || data.text || '',
        created_at: dateObj,
        createdAt: dateObj,
        timestampMillis
      })
    })

    // Sort ascending by time so all historical messages show in chronological order
    messages.sort((a, b) => a.timestampMillis - b.timestampMillis)
    callback(messages)
  })
}

export async function sendMessage(conversationId, text, recipientId) {
  const uid = getUserId()
  if (!uid || !conversationId || !text.trim()) return false

  try {
    const textTrimmed = text.trim()
    await addDoc(collection(db, `conversations/${conversationId}/messages`), {
      senderId: uid,
      sender_id: uid,
      recipientId: recipientId || '',
      text: textTrimmed,
      content: textTrimmed,
      createdAt: serverTimestamp(),
      created_at: serverTimestamp()
    })

    await updateDoc(doc(db, 'conversations', conversationId), {
      last_message: textTrimmed,
      lastMessage: textTrimmed,
      last_message_at: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_sender_id: uid,
      lastSenderId: uid
    })

    return true
  } catch (e) {
    console.error('Error sending message:', e)
    return false
  }
}

// --- Classes & Sessions ---
export function subscribeToClasses(callback) {
  const uid = getUserId()
  if (!uid) return () => {}

  const q = query(
    collection(db, 'classes'),
    or(where('mentor_id', '==', uid), where('learner_id', '==', uid))
  )

  return onSnapshot(q, async (snap) => {
    try {
      const upcoming = []
      const past = []

      for (const d of snap.docs) {
        const cls = { id: d.id, ...d.data() }
        const partnerId = cls.mentor_id === uid ? cls.learner_id : cls.mentor_id
        if (partnerId) {
          cls.partner = await resolvePartnerProfile(partnerId)
        }
        
        if (cls.status === 'upcoming') {
          upcoming.push(cls)
        } else {
          past.push(cls)
        }
      }

      upcoming.sort((a, b) => new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0))
      past.sort((a, b) => new Date(b.scheduled_at || 0) - new Date(a.scheduled_at || 0))

      callback({ upcoming, past })
    } catch (e) {
      console.warn('Real-time classes error:', e)
    }
  })
}

export async function getClasses() {
  const uid = getUserId()
  if (!uid) return { upcoming: [], past: [] }

  try {
    const q = query(
      collection(db, 'classes'),
      or(where('mentor_id', '==', uid), where('learner_id', '==', uid))
    )
    const snap = await getDocs(q)
    const upcoming = []
    const past = []

    for (const d of snap.docs) {
      const cls = { id: d.id, ...d.data() }
      const partnerId = cls.mentor_id === uid ? cls.learner_id : cls.mentor_id
      if (partnerId) {
        cls.partner = await resolvePartnerProfile(partnerId)
      }
      
      if (cls.status === 'upcoming') {
        upcoming.push(cls)
      } else {
        past.push(cls)
      }
    }

    upcoming.sort((a, b) => new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0))
    past.sort((a, b) => new Date(b.scheduled_at || 0) - new Date(a.scheduled_at || 0))

    return { upcoming, past }
  } catch (e) {
    console.error('Error fetching classes:', e)
    return { upcoming: [], past: [] }
  }
}

export async function scheduleClass(sessionData) {
  const uid = getUserId()
  if (!uid) return false

  try {
    await addDoc(collection(db, 'classes'), {
      ...sessionData,
      learner_id: uid,
      status: 'upcoming',
      created_at: serverTimestamp()
    })

    // Notify partner
    if (sessionData.mentor_id) {
      await addDoc(collection(db, 'notifications'), {
        recipientId: sessionData.mentor_id,
        fromUserId: uid,
        type: 'session_booked',
        title: 'New Session Scheduled',
        message: `A new session "${sessionData.topic || 'Skill Swap'}" has been scheduled.`,
        read: false,
        created_at: serverTimestamp()
      })
    }

    return true
  } catch (e) {
    console.error('Error scheduling class:', e)
    return false
  }
}

// --- Notifications ---
export function subscribeToNotifications(callback) {
  const uid = getUserId()
  if (!uid) return () => {}

  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', uid)
  )

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      created_at: d.data().created_at?.toDate ? d.data().created_at.toDate() : new Date()
    }))
    list.sort((a, b) => b.created_at - a.created_at)
    callback(list.slice(0, 30))
  }, (err) => {
    console.warn('Notifications listener note:', err.message)
  })
}

export async function markNotificationRead(notifId) {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true })
    return true
  } catch (e) {
    return false
  }
}

// --- Onboarding Skills ---
export async function saveOnboardingSkills(teachingSkills, learningSkills) {
  const uid = getUserId()
  if (!uid) return false

  try {
    await updateDoc(doc(db, 'profiles', uid), {
      skills_teaching: teachingSkills.map(s => typeof s === 'string' ? s : s.name),
      skills_learning: learningSkills.map(s => typeof s === 'string' ? s : s.name),
      onboarding_completed: true,
      updated_at: serverTimestamp()
    })

    for (const s of teachingSkills) {
      const name = typeof s === 'string' ? s : s.name
      const level = typeof s === 'string' ? 'Intermediate' : (s.level || 'Intermediate')
      await addDoc(collection(db, 'skills_teaching'), {
        profile_id: uid,
        skill_name: name,
        level,
        created_at: serverTimestamp()
      })
    }

    for (const s of learningSkills) {
      const name = typeof s === 'string' ? s : s.name
      const level = typeof s === 'string' ? 'Beginner' : (s.level || 'Beginner')
      await addDoc(collection(db, 'skills_learning'), {
        profile_id: uid,
        skill_name: name,
        level,
        created_at: serverTimestamp()
      })
    }

    return true
  } catch (e) {
    console.error('Error saving onboarding skills:', e)
    return false
  }
}
