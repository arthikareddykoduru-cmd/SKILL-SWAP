import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ChevronLeft,
  Star,
  MapPin,
  Send,
  MessageSquare,
  Calendar,
  Sparkles,
  GraduationCap,
  BookOpen,
  X
} from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import { getUserProfile, sendConnectionRequest, getOrCreateConversation, scheduleClass } from '../services/api'

export default function UserProfileDetailScreen({ route, navigation }) {
  const { userId, profile: initialProfile } = route.params || {}
  const [profile, setProfile] = useState(initialProfile || null)
  const [loading, setLoading] = useState(!initialProfile)

  // Booking Modal State
  const [showBookModal, setShowBookModal] = useState(false)
  const [topic, setTopic] = useState('')
  const [sessionDate, setSessionDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0])
  const [sessionTime, setSessionTime] = useState('14:00')
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        const res = await getUserProfile(userId)
        if (res) setProfile(res)
        setLoading(false)
      }
    }
    fetchUser()
  }, [userId])

  const handleStartChat = async () => {
    try {
      const convId = await getOrCreateConversation(profile.id || profile.uid)
      if (convId) {
        navigation.navigate('Chat', { conversationId: convId, partner: profile })
      }
    } catch (e) {
      console.error('Error starting chat:', e)
    }
  }

  const handleBookSession = async () => {
    if (!topic.trim()) {
      Alert.alert('Required', 'Please enter a session topic or skill you want to learn.')
      return
    }

    try {
      setBooking(true)
      const scheduledDateTime = `${sessionDate}T${sessionTime}:00`
      await scheduleClass({
        mentor_id: profile.id || profile.uid,
        topic: topic.trim(),
        scheduled_at: scheduledDateTime,
        duration_minutes: 60
      })
      setShowBookModal(false)
      Alert.alert('Session Scheduled!', `Your exchange session with ${profile.full_name || profile.name} has been confirmed.`)
    } catch (e) {
      Alert.alert('Error', 'Failed to book session.')
    } finally {
      setBooking(false)
    }
  }

  const name = profile?.full_name || profile?.name || 'Skill Mentor'

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header with Back */}
      <View style={styles.navHeader}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Avatar uri={profile?.avatar_url || profile?.avatar} name={name} size={70} />
            <View style={styles.infoCol}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.title}>{profile?.headline || profile?.title || 'Skill Mentor'}</Text>
              <View style={styles.ratingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{profile?.rating || '5.0'} ({profile?.reviews_count || profile?.reviewsCount || 8} reviews)</Text>
              </View>
            </View>
          </View>

          <Text style={styles.bio}>{profile?.bio || 'Passionate about sharing skills and collaborative learning.'}</Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Button
              title="Schedule Session"
              onPress={() => setShowBookModal(true)}
              variant="primary"
              size="sm"
              icon={<Calendar size={15} color="#06281E" />}
              style={{ flex: 1.2 }}
            />
            <Button
              title="Message"
              onPress={handleStartChat}
              variant="secondary"
              size="sm"
              icon={<MessageSquare size={15} color={colors.text} />}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Teaching Skills */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={18} color={colors.primaryLight} />
            <Text style={styles.sectionTitle}>Teaches</Text>
          </View>
          <View style={styles.badgeWrap}>
            {(profile?.skills_teaching || profile?.skillsTeaching || ['JavaScript', 'Design']).map((s, i) => (
              <Badge key={`t-${i}`} label={s} type="teaching" />
            ))}
          </View>
        </Card>

        {/* Learning Skills */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <BookOpen size={18} color="#818CF8" />
            <Text style={[styles.sectionTitle, { color: '#A5B4FC' }]}>Wants to Learn</Text>
          </View>
          <View style={styles.badgeWrap}>
            {(profile?.skills_learning || profile?.skillsLearning || ['Python', 'Spanish']).map((s, i) => (
              <Badge key={`l-${i}`} label={s} type="learning" />
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* Book Session Modal */}
      <Modal visible={showBookModal} transparent animationType="slide" onRequestClose={() => setShowBookModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book 1:1 Swap Session</Text>
              <TouchableOpacity onPress={() => setShowBookModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Session Topic / Skill</Text>
            <TextInput
              value={topic}
              onChangeText={setTopic}
              placeholder="e.g. React Native Architecture & Best Practices"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              value={sessionDate}
              onChangeText={setSessionDate}
              placeholder="2026-09-03"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Time (HH:MM)</Text>
            <TextInput
              value={sessionTime}
              onChangeText={setSessionTime}
              placeholder="14:00"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowBookModal(false)}
                variant="ghost"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm & Book"
                onPress={handleBookSession}
                loading={booking}
                variant="primary"
                size="md"
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    padding: 18,
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoCol: {
    marginLeft: 14,
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  }
})
