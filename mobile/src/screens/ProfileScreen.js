import React, { useState } from 'react'
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
  Settings,
  Edit3,
  Star,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  LogOut,
  X,
  Check
} from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../services/api'

export default function ProfileScreen({ navigation }) {
  const { userProfile, refreshProfile, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(userProfile?.bio || '')
  const [headline, setHeadline] = useState(userProfile?.headline || '')
  const [skillsTeaching, setSkillsTeaching] = useState('')
  const [skillsLearning, setSkillsLearning] = useState('')
  const [saving, setSaving] = useState(false)

  const openEditModal = () => {
    setBio(userProfile?.bio || '')
    setHeadline(userProfile?.headline || '')
    
    const tSkills = Array.isArray(userProfile?.skills_teaching) 
      ? userProfile.skills_teaching.join(', ') 
      : (userProfile?.skills_teaching || '')
    setSkillsTeaching(tSkills)

    const lSkills = Array.isArray(userProfile?.skills_learning) 
      ? userProfile.skills_learning.join(', ') 
      : (userProfile?.skills_learning || '')
    setSkillsLearning(lSkills)

    setIsEditing(true)
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateUserProfile({
        bio: bio.trim(),
        headline: headline.trim(),
        skills_teaching: skillsTeaching.trim(),
        skills_learning: skillsLearning.trim()
      })
      await refreshProfile()
      setIsEditing(false)
      Alert.alert('Saved', 'Your profile and skill sets have been updated!')
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout }
    ])
  }

  const teachingList = Array.isArray(userProfile?.skills_teaching) 
    ? userProfile.skills_teaching 
    : (userProfile?.skills_teaching ? userProfile.skills_teaching.split(',').map(s => s.trim()).filter(Boolean) : [])

  const learningList = Array.isArray(userProfile?.skills_learning) 
    ? userProfile.skills_learning 
    : (userProfile?.skills_learning ? userProfile.skills_learning.split(',').map(s => s.trim()).filter(Boolean) : [])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerIconBtn}
          >
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Info Header Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.avatarRow}>
            <Avatar
              uri={userProfile?.avatar_url}
              name={userProfile?.full_name || 'User'}
              size={72}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.fullName}>{userProfile?.full_name || 'Skill Swapper'}</Text>
              <Text style={styles.username}>@{userProfile?.username || 'member'}</Text>
              <View style={styles.ratingBadge}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingValue}>{userProfile?.rating || '5.0'}</Text>
                <Text style={styles.reviewsCount}>({userProfile?.reviews_count || 0} reviews)</Text>
              </View>
            </View>
          </View>

          <Text style={styles.headlineText}>
            {userProfile?.headline || 'Passionate about continuous peer learning'}
          </Text>

          <Text style={styles.bioText}>
            {userProfile?.bio || 'No bio added yet. Tell the community about your expertise and what you want to learn!'}
          </Text>

          <Button
            title="Edit Profile & Skills"
            onPress={openEditModal}
            variant="outline"
            size="sm"
            icon={<Edit3 size={14} color={colors.primaryLight} />}
            style={{ marginTop: 14 }}
          />
        </Card>

        {/* Teaching Skills Section */}
        <Card style={styles.skillsSectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <GraduationCap size={20} color={colors.primaryLight} />
              <Text style={styles.sectionTitle}>Skills I Teach</Text>
            </View>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={{ color: colors.primaryLight, fontSize: 12, fontWeight: '700' }}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesWrap}>
            {teachingList.length > 0 ? (
              teachingList.map((s, idx) => (
                <Badge key={`teach-${idx}`} label={s} type="teaching" />
              ))
            ) : (
              <TouchableOpacity onPress={openEditModal} style={{ paddingVertical: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>No teaching skills added yet. Tap to add.</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Learning Skills Section */}
        <Card style={styles.skillsSectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookOpen size={20} color="#818CF8" />
              <Text style={[styles.sectionTitle, { color: '#A5B4FC' }]}>Skills I'm Learning</Text>
            </View>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={{ color: '#818CF8', fontSize: 12, fontWeight: '700' }}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesWrap}>
            {learningList.length > 0 ? (
              learningList.map((s, idx) => (
                <Badge key={`learn-${idx}`} label={s} type="learning" />
              ))
            ) : (
              <TouchableOpacity onPress={openEditModal} style={{ paddingVertical: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12.5 }}>No learning goals added yet. Tap to add.</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Logout */}
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="danger"
          size="md"
          icon={<LogOut size={16} color="#FFFFFF" />}
          style={{ marginTop: 14 }}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} transparent animationType="slide" onRequestClose={() => setIsEditing(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile & Skills</Text>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Skills I Teach (comma-separated)</Text>
              <TextInput
                value={skillsTeaching}
                onChangeText={setSkillsTeaching}
                placeholder="e.g. UI/UX Design, React, Photography"
                placeholderTextColor={colors.textMuted}
                style={styles.singleLineInput}
              />

              <Text style={styles.inputLabel}>Skills I'm Learning (comma-separated)</Text>
              <TextInput
                value={skillsLearning}
                onChangeText={setSkillsLearning}
                placeholder="e.g. Python, Public Speaking, Spanish"
                placeholderTextColor={colors.textMuted}
                style={styles.singleLineInput}
              />

              <Text style={styles.inputLabel}>Headline</Text>
              <TextInput
                value={headline}
                onChangeText={setHeadline}
                placeholder="e.g. Senior Frontend Engineer & UI Enthusiast"
                placeholderTextColor={colors.textMuted}
                style={styles.singleLineInput}
              />

              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Write a brief introduction about yourself..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={styles.multiLineInput}
              />

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setIsEditing(false)}
                  variant="ghost"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  loading={saving}
                  variant="primary"
                  size="md"
                  style={{ flex: 1.5 }}
                />
              </View>
            </View>
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 110,
  },
  profileHeaderCard: {
    padding: 18,
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    marginLeft: 14,
    flex: 1,
  },
  fullName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  username: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingValue: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '700',
  },
  reviewsCount: {
    color: colors.textMuted,
    fontSize: 12,
  },
  headlineText: {
    color: colors.primaryLight,
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  bioText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statNumber: {
    color: colors.primaryLight,
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  skillsSectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    color: '#34D399',
    fontSize: 14.5,
    fontWeight: '700',
  },
  badgesWrap: {
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
  singleLineInput: {
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
  multiLineInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    padding: 12,
    height: 90,
    textAlignVertical: 'top',
    fontSize: 13.5,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  }
})
