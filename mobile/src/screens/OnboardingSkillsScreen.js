import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, X, Check, Sparkles, BookOpen, GraduationCap } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Button from '../components/Button'
import { saveOnboardingSkills } from '../services/api'
import { useAuth } from '../context/AuthContext'

const POPULAR_SKILLS = [
  'Python', 'JavaScript', 'React', 'UI/UX Design', 'Spanish',
  'Graphic Design', 'Public Speaking', 'Digital Marketing',
  'Data Science', 'Video Editing', 'Photography', 'Product Management'
]

export default function OnboardingSkillsScreen({ navigation }) {
  const [teachingSkills, setTeachingSkills] = useState(['JavaScript', 'React'])
  const [learningSkills, setLearningSkills] = useState(['Python', 'UI/UX Design'])
  const [customTeach, setCustomTeach] = useState('')
  const [customLearn, setCustomLearn] = useState('')
  const [loading, setLoading] = useState(false)

  const { refreshProfile } = useAuth()

  const toggleTeaching = (skill) => {
    if (teachingSkills.includes(skill)) {
      setTeachingSkills(teachingSkills.filter(s => s !== skill))
    } else {
      setTeachingSkills([...teachingSkills, skill])
    }
  }

  const toggleLearning = (skill) => {
    if (learningSkills.includes(skill)) {
      setLearningSkills(learningSkills.filter(s => s !== skill))
    } else {
      setLearningSkills([...learningSkills, skill])
    }
  }

  const addCustomTeaching = () => {
    if (customTeach.trim() && !teachingSkills.includes(customTeach.trim())) {
      setTeachingSkills([...teachingSkills, customTeach.trim()])
      setCustomTeach('')
    }
  }

  const addCustomLearning = () => {
    if (customLearn.trim() && !learningSkills.includes(customLearn.trim())) {
      setLearningSkills([...learningSkills, customLearn.trim()])
      setCustomLearn('')
    }
  }

  const handleFinish = async () => {
    if (teachingSkills.length === 0 || learningSkills.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one skill to teach and one skill to learn.')
      return
    }

    try {
      setLoading(true)
      await saveOnboardingSkills(teachingSkills, learningSkills)
      await refreshProfile()
      // Once finished, root navigator will switch to Main tabs
    } catch (err) {
      console.error('Error saving onboarding:', err)
      Alert.alert('Error', 'Failed to save skills. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Sparkles size={24} color={colors.primaryLight} />
          </View>
          <Text style={styles.title}>Personalize Your Exchange</Text>
          <Text style={styles.subtitle}>
            Tell us what you'd like to share and what you're excited to learn.
          </Text>
        </View>

        {/* Section 1: Skills to Teach */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <GraduationCap size={20} color={colors.primaryLight} />
            <Text style={styles.sectionTitle}>Skills You Can Teach</Text>
          </View>
          <Text style={styles.sectionDesc}>Select skills you are comfortable mentoring others in.</Text>

          {/* Chips */}
          <View style={styles.chipGrid}>
            {POPULAR_SKILLS.map((skill) => {
              const selected = teachingSkills.includes(skill)
              return (
                <TouchableOpacity
                  key={`teach-${skill}`}
                  activeOpacity={0.7}
                  onPress={() => toggleTeaching(skill)}
                  style={[styles.chip, selected && styles.chipSelectedTeach]}
                >
                  {selected && <Check size={14} color="#34D399" style={styles.chipCheck} />}
                  <Text style={[styles.chipText, selected && styles.chipTextSelectedTeach]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Custom Input */}
          <View style={styles.addCustomRow}>
            <TextInput
              value={customTeach}
              onChangeText={setCustomTeach}
              placeholder="Add another skill..."
              placeholderTextColor={colors.textMuted}
              style={styles.customInput}
              onSubmitEditing={addCustomTeaching}
            />
            <TouchableOpacity onPress={addCustomTeaching} style={styles.addCustomBtn}>
              <Plus size={18} color="#06281E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Skills to Learn */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <BookOpen size={20} color="#818CF8" />
            <Text style={styles.sectionTitle}>Skills You Want to Learn</Text>
          </View>
          <Text style={styles.sectionDesc}>Choose topics you want to practice or level up in.</Text>

          {/* Chips */}
          <View style={styles.chipGrid}>
            {POPULAR_SKILLS.map((skill) => {
              const selected = learningSkills.includes(skill)
              return (
                <TouchableOpacity
                  key={`learn-${skill}`}
                  activeOpacity={0.7}
                  onPress={() => toggleLearning(skill)}
                  style={[styles.chip, selected && styles.chipSelectedLearn]}
                >
                  {selected && <Check size={14} color="#A5B4FC" style={styles.chipCheck} />}
                  <Text style={[styles.chipText, selected && styles.chipTextSelectedLearn]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Custom Input */}
          <View style={styles.addCustomRow}>
            <TextInput
              value={customLearn}
              onChangeText={setCustomLearn}
              placeholder="Add another skill..."
              placeholderTextColor={colors.textMuted}
              style={styles.customInput}
              onSubmitEditing={addCustomLearning}
            />
            <TouchableOpacity onPress={addCustomLearning} style={[styles.addCustomBtn, { backgroundColor: '#818CF8' }]}>
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Finish Button */}
        <Button
          title="Complete Setup & Enter App"
          onPress={handleFinish}
          loading={loading}
          size="lg"
          style={styles.finishBtn}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  sectionDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipSelectedTeach: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10B981',
  },
  chipSelectedLearn: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: '#6366F1',
  },
  chipCheck: {
    marginRight: 4,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  chipTextSelectedTeach: {
    color: '#34D399',
  },
  chipTextSelectedLearn: {
    color: '#A5B4FC',
  },
  addCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingLeft: 12,
    paddingRight: 6,
    height: 44,
  },
  customInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13.5,
  },
  addCustomBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    marginVertical: 10,
    width: '100%',
  }
})
