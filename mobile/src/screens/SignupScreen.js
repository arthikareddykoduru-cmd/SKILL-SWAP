import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mail, Lock, User, AtSign, Repeat, Eye, EyeOff, GraduationCap, BookOpen, Building, MapPin } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [collegeOrCompany, setCollegeOrCompany] = useState('')
  const [skillsTeaching, setSkillsTeaching] = useState('')
  const [skillsLearning, setSkillsLearning] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signup } = useAuth()

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }

    try {
      setError('')
      setLoading(true)
      await signup(email.trim(), password, fullName.trim(), username.trim(), {
        skills_teaching: skillsTeaching.trim(),
        skills_learning: skillsLearning.trim(),
        college_or_company: collegeOrCompany.trim(),
        city: city.trim()
      })
      // RootNavigator automatically transitions to AppNavigator on successful authentication
    } catch (err) {
      console.error('Signup error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.')
      } else {
        setError(err.message || 'Failed to create account.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoIcon}>
              <Repeat size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of peers sharing skills</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Alex Johnson"
              autoCapitalize="words"
              leftIcon={<User size={18} color={colors.textMuted} />}
            />

            <Input
              label="Username *"
              value={username}
              onChangeText={setUsername}
              placeholder="alexj"
              autoCapitalize="none"
              leftIcon={<AtSign size={18} color={colors.textMuted} />}
            />

            <Input
              label="Email Address *"
              value={email}
              onChangeText={setEmail}
              placeholder="alex@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password (min. 6 chars) *"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              }
            />

            <Input
              label="City *"
              value={city}
              onChangeText={setCity}
              placeholder="e.g. San Francisco, New York, Bangalore"
              autoCapitalize="words"
              leftIcon={<MapPin size={18} color={colors.textMuted} />}
            />

            <Input
              label="College or Company"
              value={collegeOrCompany}
              onChangeText={setCollegeOrCompany}
              placeholder="e.g. Stanford / Google / Freelance"
              autoCapitalize="words"
              leftIcon={<Building size={18} color={colors.textMuted} />}
            />

            <Input
              label="Skills You Need to Teach (comma-separated)"
              value={skillsTeaching}
              onChangeText={setSkillsTeaching}
              placeholder="e.g. React, UI/UX Design, Photography, Python"
              autoCapitalize="words"
              leftIcon={<GraduationCap size={18} color={colors.textMuted} />}
            />

            <Input
              label="Skills You Need to Learn (comma-separated)"
              value={skillsLearning}
              onChangeText={setSkillsLearning}
              placeholder="e.g. Machine Learning, Public Speaking, Spanish"
              autoCapitalize="words"
              leftIcon={<BookOpen size={18} color={colors.textMuted} />}
            />

            <Button
              title="Create Free Account"
              onPress={handleSignup}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 14,
  }
})
