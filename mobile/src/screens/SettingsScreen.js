import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ChevronLeft,
  Moon,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
  Zap
} from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import { useAuth } from '../context/AuthContext'

export default function SettingsScreen({ navigation }) {
  const { userProfile, user, logout } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(true)

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout }
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Summary */}
        <Card style={styles.accountCard}>
          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <User size={20} color={colors.primaryLight} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{userProfile?.full_name || 'Skill Swapper'}</Text>
              <Text style={styles.accountEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </Card>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Moon size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Dark Theme</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Bell size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Zap size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Email Updates</Text>
            </View>
            <Switch
              value={emailNotifEnabled}
              onValueChange={setEmailNotifEnabled}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support & Legal</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingNavRow}
            onPress={() => Alert.alert('Help & Support', 'Reach us at support@skillswap.com for any questions.')}
          >
            <View style={styles.settingLabelGroup}>
              <HelpCircle size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Help & FAQ</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingNavRow}
            onPress={() => Alert.alert('Privacy Policy', 'Your data is securely stored and never shared with third parties.')}
          >
            <View style={styles.settingLabelGroup}>
              <Shield size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Privacy & Terms</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Log Out */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogout}
          style={styles.logoutBtn}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out of Skill Swap</Text>
        </TouchableOpacity>

        <Text style={styles.appVersion}>Skill Swap Mobile v1.0.0 (Expo)</Text>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  accountCard: {
    padding: 16,
    marginBottom: 20,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    marginLeft: 14,
    flex: 1,
  },
  accountName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  accountEmail: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    padding: 6,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 10,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14.5,
    fontWeight: '700',
  },
  appVersion: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  }
})
