import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Calendar,
  Video,
  ArrowRight,
  Clock,
  BookOpen,
  GraduationCap,
  Bell,
  Star,
  Plus
} from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { getDashboardData, subscribeToConnections, subscribeToClasses } from '../services/api'

const TRENDING_SKILLS = [
  { name: 'UI/UX Design', icon: '🎨' },
  { name: 'React & Web', icon: '⚛️' },
  { name: 'Python & AI', icon: '🐍' },
  { name: 'Mobile Apps', icon: '📱' },
  { name: 'Cloud & DevOps', icon: '☁️' },
  { name: 'Public Speaking', icon: '🗣️' },
  { name: 'Spanish', icon: '🇪🇸' },
  { name: 'Data Science', icon: '📊' },
]

export default function HomeScreen({ navigation }) {
  const { userProfile, user } = useAuth()
  const [data, setData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const res = await getDashboardData()
      setData(res)
    } catch (e) {
      console.warn('Failed to load dashboard:', e)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const unsubs = [
      subscribeToConnections((res) => {
        const activeCount = res?.active ? res.active.length : 0
        setData(prev => prev ? {
          ...prev,
          totalConnections: Math.max(activeCount, prev.totalConnections || 0)
        } : prev)
      }),
      subscribeToClasses(() => loadData())
    ]
    return () => {
      unsubs.forEach(u => u && u())
    }
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const welcomeName = userProfile?.full_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Friend'

  const userTeachingSkills = data?.teaching?.allSkills?.length > 0 
    ? data.teaching.allSkills 
    : (Array.isArray(userProfile?.skills_teaching) && userProfile.skills_teaching.length > 0 
        ? userProfile.skills_teaching 
        : (userProfile?.skills_teaching ? [userProfile.skills_teaching] : []))

  const userLearningSkills = data?.learning?.allSkills?.length > 0 
    ? data.learning.allSkills 
    : (Array.isArray(userProfile?.skills_learning) && userProfile.skills_learning.length > 0 
        ? userProfile.skills_learning 
        : (userProfile?.skills_learning ? [userProfile.skills_learning] : []))

  const recommendedMentors = (data?.mentors || []).slice(0, 4)

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" translucent={false} />

      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.userGreeting}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <Avatar uri={userProfile?.avatar_url} name={userProfile?.full_name || 'User'} size={44} />
          </TouchableOpacity>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingSubtitle}>Welcome back,</Text>
            <Text style={styles.greetingTitle}>{welcomeName} 👋</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.headerIconBtn}
          activeOpacity={0.8}
        >
          <Bell size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
      >
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Schedule')}
            style={[styles.statBox, { borderColor: 'rgba(124, 58, 237, 0.4)', backgroundColor: 'rgba(19, 28, 46, 0.9)' }]}
          >
            <View style={styles.statHeader}>
              <GraduationCap size={15} color={colors.primaryLight} />
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.primaryLight }]}>
              {data?.classesTaken ?? 2}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Schedule')}
            style={[styles.statBox, { borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(19, 28, 46, 0.9)' }]}
          >
            <View style={styles.statHeader}>
              <Calendar size={15} color="#FBBF24" />
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <Text style={[styles.statValue, { color: '#FBBF24' }]}>
              {data?.upcomingCount || 1}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Your Active Skills Hub */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Skill Set</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.sectionLink}>Manage Skills</Text>
            </TouchableOpacity>
          </View>

          {/* Skills You Teach */}
          <Card style={[styles.skillsHubCard, { borderColor: 'rgba(16, 185, 129, 0.35)', marginBottom: 12 }]}>
            <View style={styles.skillHubHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.skillIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <GraduationCap size={16} color="#34D399" />
                </View>
                <View>
                  <Text style={styles.skillHubHeading}>Skills You Teach</Text>
                  <Text style={styles.skillHubSub}>Mentor Expertise ({userTeachingSkills.length})</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.addSkillBtn}>
                <Plus size={13} color="#34D399" />
                <Text style={[styles.addSkillText, { color: '#34D399' }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillBadgesWrap}>
              {userTeachingSkills.map((s, idx) => (
                <Badge key={`teach-${idx}`} label={s} type="teaching" size="md" />
              ))}
            </View>
          </Card>

          {/* Skills You Learn */}
          <Card style={[styles.skillsHubCard, { borderColor: 'rgba(99, 102, 241, 0.35)' }]}>
            <View style={styles.skillHubHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.skillIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <BookOpen size={16} color="#818CF8" />
                </View>
                <View>
                  <Text style={[styles.skillHubHeading, { color: '#A5B4FC' }]}>Skills You're Learning</Text>
                  <Text style={styles.skillHubSub}>Learning Goals ({userLearningSkills.length})</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.addSkillBtn}>
                <Plus size={13} color="#818CF8" />
                <Text style={[styles.addSkillText, { color: '#818CF8' }]}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillBadgesWrap}>
              {userLearningSkills.map((s, idx) => (
                <Badge key={`learn-${idx}`} label={s} type="learning" size="md" />
              ))}
            </View>
          </Card>
        </View>

        {/* Explore Trending Skills Explorer */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Trending Skills</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingSkillsScroll}
          >
            {TRENDING_SKILLS.map((skill, index) => (
              <TouchableOpacity
                key={`trend-${index}`}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Search')}
                style={styles.trendingSkillChip}
              >
                <Text style={styles.trendingSkillIcon}>{skill.icon}</Text>
                <Text style={styles.trendingSkillName}>{skill.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Next Scheduled Session */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Exchange Session</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {data?.upcomingClass ? (
            <Card elevated style={styles.upcomingCard}>
              <View style={styles.upcomingHeader}>
                <View style={[styles.sessionBadge, { backgroundColor: data.upcomingClass.joinStatus?.canJoin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(124, 58, 237, 0.2)' }]}>
                  <Text style={[styles.sessionBadgeText, { color: data.upcomingClass.joinStatus?.canJoin ? '#34D399' : colors.primaryLight }]}>
                    {data.upcomingClass.joinStatus?.canJoin ? 'LIVE NOW' : 'UPCOMING'}
                  </Text>
                </View>
                <View style={styles.timeBadge}>
                  <Clock size={12} color={colors.textSecondary} />
                  <Text style={styles.timeText}>
                    {new Date(data.upcomingClass.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(data.upcomingClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              <Text style={styles.upcomingTitle}>{data.upcomingClass.title}</Text>
              <Text style={styles.upcomingPartner}>
                Partner: <Text style={{ color: colors.text, fontWeight: '600' }}>{data.upcomingClass.partnerName}</Text>
              </Text>

              <View style={styles.upcomingActions}>
                {data.upcomingClass.joinStatus?.canJoin ? (
                  <Button
                    title="Join Live Video Room"
                    onPress={() => navigation.navigate('Call', {
                      callId: data.upcomingClass.id,
                      partnerId: data.upcomingClass.partnerId,
                      partnerName: data.upcomingClass.partnerName,
                      isCaller: true,
                      topic: data.upcomingClass.title
                    })}
                    variant="primary"
                    size="sm"
                    icon={<Video size={16} color="#FFFFFF" />}
                    style={{ flex: 1, backgroundColor: '#10B981' }}
                  />
                ) : (
                  <Button
                    title={`Starts ${data.upcomingClass.joinStatus?.timeUntil || 'Soon'}`}
                    onPress={() => {
                      alert(data.upcomingClass.joinStatus?.message || 'This video room unlocks 15 minutes before the session.')
                    }}
                    variant="outline"
                    size="sm"
                    icon={<Clock size={16} color={colors.textSecondary} />}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </Card>
          ) : (
            <Card style={styles.emptySessionCard}>
              <View style={styles.emptyIconCircle}>
                <Calendar size={28} color={colors.primaryLight} />
              </View>
              <Text style={styles.emptySessionTitle}>No sessions booked</Text>
              <Text style={styles.emptySessionDesc}>Connect with peers or explore skills to schedule a swap.</Text>
              <Button
                title="Discover Mentors"
                onPress={() => navigation.navigate('Search')}
                variant="outline"
                size="sm"
                style={{ marginTop: 14 }}
              />
            </Card>
          )}
        </View>

        {/* Recommended Mentors for Skill Swap */}
        {recommendedMentors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Members</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.sectionLink}>Discover</Text>
              </TouchableOpacity>
            </View>

            {recommendedMentors.map((mentor) => (
              <Card key={mentor.id} style={styles.mentorSwapCard}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('UserProfileDetail', { userId: mentor.id, profile: mentor })}
                  style={styles.mentorRow}
                >
                  <Avatar uri={mentor.avatar_url || mentor.avatar} name={mentor.name} size={46} />
                  <View style={styles.mentorMeta}>
                    <Text style={styles.mentorName}>{mentor.name}</Text>
                    <Text style={styles.mentorHeadline} numberOfLines={1}>{mentor.title}</Text>
                    <View style={styles.mentorRatingRow}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.mentorRatingText}>{mentor.rating} ({mentor.reviewsCount || 0} reviews)</Text>
                    </View>
                  </View>
                  <Button
                    title="View"
                    onPress={() => navigation.navigate('UserProfileDetail', { userId: mentor.id, profile: mentor })}
                    variant="outline"
                    size="sm"
                    style={{ minWidth: 64 }}
                  />
                </TouchableOpacity>
                {mentor.skillsTeaching?.length > 0 && (
                  <View style={styles.mentorSkillsRow}>
                    <Text style={styles.mentorSkillLabel}>Teaches:</Text>
                    {mentor.skillsTeaching.slice(0, 3).map((s, idx) => (
                      <Badge key={`m-teach-${idx}`} label={s} type="teaching" size="sm" />
                    ))}
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Quick Discovery Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Search')}
          style={styles.discoveryBanner}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Find your next match</Text>
            <Text style={styles.bannerDesc}>Browse 50+ topics and connect with mentors ready to swap.</Text>
          </View>
          <View style={styles.bannerArrow}>
            <ArrowRight size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTextContainer: {
    marginLeft: 12,
  },
  greetingSubtitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '500',
  },
  greetingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 1,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110, // Ensure bottom cards are not covered by bottom tab bar
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionLink: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  upcomingCard: {
    backgroundColor: colors.card,
    padding: 16,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sessionBadgeText: {
    color: colors.primaryLight,
    fontSize: 10.5,
    fontWeight: '700',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  upcomingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  upcomingPartner: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 14,
  },
  upcomingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  emptySessionCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  emptySessionTitle: {
    color: colors.text,
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySessionDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  skillsHubCard: {
    padding: 16,
    borderWidth: 1,
  },
  skillHubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skillIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillHubHeading: {
    color: '#34D399',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  skillHubSub: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  addSkillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addSkillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  skillBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingSkillsScroll: {
    paddingRight: 20,
    gap: 10,
  },
  trendingSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    gap: 7,
  },
  trendingSkillIcon: {
    fontSize: 16,
  },
  trendingSkillName: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '700',
  },
  mentorSwapCard: {
    padding: 14,
    marginBottom: 12,
  },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorMeta: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  mentorName: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  mentorHeadline: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  mentorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mentorRatingText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  mentorSkillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mentorSkillLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  discoveryBanner: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerContent: {
    flex: 1,
    paddingRight: 12,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerDesc: {
    color: '#E9D5FF',
    fontSize: 12.5,
    lineHeight: 17,
  },
  bannerArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  }
})
