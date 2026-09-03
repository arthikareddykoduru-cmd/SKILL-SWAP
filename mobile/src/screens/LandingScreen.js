import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowRight, Sparkles, Users, Repeat, ShieldCheck, Zap } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Button from '../components/Button'

const { width } = Dimensions.get('window')

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Repeat size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>
              Skill<Text style={styles.logoHighlight}>Swap</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.navLoginBtn}
          >
            <Text style={styles.navLoginText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Sparkles size={14} color={colors.primaryLight} />
            <Text style={styles.heroBadgeText}>Peer-to-Peer Knowledge Exchange</Text>
          </View>

          <Text style={styles.heroTitle}>
            Trade Skills.{'\n'}
            <Text style={styles.heroTitleGradient}>Grow Together.</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Connect with passionate learners and mentors worldwide. Teach what you know, learn what you love — without spending money.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Get Started Free"
              onPress={() => navigation.navigate('Signup')}
              size="lg"
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              style={styles.primaryBtn}
            />
            <Button
              title="Explore Skills"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              size="lg"
              style={styles.secondaryBtn}
            />
          </View>
        </View>

        {/* Value Props Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionHeader}>Why Skill Swap?</Text>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Repeat size={22} color={colors.primaryLight} />
            </View>
            <Text style={styles.featureCardTitle}>Direct 1:1 Skill Trading</Text>
            <Text style={styles.featureCardDesc}>
              Exchange 1 hour of Python for 1 hour of Spanish, guitar, or UI design. True reciprocity.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Users size={22} color="#818CF8" />
            </View>
            <Text style={styles.featureCardTitle}>Verified Community</Text>
            <Text style={styles.featureCardDesc}>
              Ratings, verified skill tags, and reviews help you connect with high-quality mentors.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Zap size={22} color="#FBBF24" />
            </View>
            <Text style={styles.featureCardTitle}>Live Interactive Sessions</Text>
            <Text style={styles.featureCardDesc}>
              Real-time messaging, scheduled calendar sessions, and 1-on-1 video rooms built right in.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Skill Swap. Empowering peers globally.</Text>
        </View>
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
    paddingBottom: 40,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  logoHighlight: {
    color: colors.primary,
  },
  navLoginBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  navLoginText: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '600',
  },
  heroSection: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 20,
  },
  heroBadgeText: {
    color: colors.primaryLight,
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
  },
  heroTitleGradient: {
    color: colors.primary,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  actionRow: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
  featuresSection: {
    marginTop: 40,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  featureCardDesc: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
  }
})
