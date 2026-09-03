import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar, Clock, Video, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { getClasses, subscribeToClasses, getSessionJoinStatus } from '../services/api'

export default function ScheduleScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past'
  const [classes, setClasses] = useState({ upcoming: [], past: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadClasses = async () => {
    try {
      const res = await getClasses()
      setClasses(res)
    } catch (e) {
      console.error('Error loading schedule:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadClasses()
    const unsubscribe = subscribeToClasses((res) => {
      setClasses(res)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const currentList = activeTab === 'upcoming' ? classes.upcoming : classes.past

  const renderClassItem = ({ item }) => {
    const isUpcoming = activeTab === 'upcoming'
    const partner = item.partner || {}
    const dateObj = new Date(item.scheduled_at)
    const joinStatus = isUpcoming ? getSessionJoinStatus(item.scheduled_at, item.duration_minutes || 60) : null

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isUpcoming ? (joinStatus?.canJoin ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : styles.upcomingBadge) : styles.completedBadge]}>
            <Text style={[styles.badgeText, isUpcoming ? (joinStatus?.canJoin ? { color: '#34D399' } : styles.upcomingBadgeText) : styles.completedBadgeText]}>
              {isUpcoming ? (joinStatus?.canJoin ? 'LIVE NOW' : 'CONFIRMED') : 'COMPLETED'}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <Text style={styles.topicTitle}>{item.topic || 'Skill Swap Session'}</Text>

        <View style={styles.partnerRow}>
          <Avatar uri={partner.avatar_url} name={partner.full_name || 'Partner'} size={36} />
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{partner.full_name || 'Skill Partner'}</Text>
            <Text style={styles.partnerRole}>
              {item.mentor_id === partner.id ? 'Instructor / Mentor' : 'Learning Partner'}
            </Text>
          </View>
        </View>

        {isUpcoming && (
          joinStatus?.canJoin ? (
            <Button
              title="Enter Live Video Call"
              onPress={() => navigation.navigate('Call', { sessionId: item.id, partnerName: partner.full_name, partnerId: partner.id })}
              variant="primary"
              size="sm"
              icon={<Video size={16} color="#FFFFFF" />}
              style={{ marginTop: 12, backgroundColor: '#10B981' }}
            />
          ) : (
            <Button
              title={`Starts ${joinStatus?.timeUntil || 'Soon'}`}
              onPress={() => alert(joinStatus?.message || 'The live room opens 15 minutes before the session starts.')}
              variant="outline"
              size="sm"
              icon={<Clock size={16} color={colors.textSecondary} />}
              style={{ marginTop: 12 }}
            />
          )
        )}
      </Card>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('upcoming')}
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({classes.upcoming.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('past')}
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past Sessions ({classes.past.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        renderItem={renderClassItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadClasses(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon={<Calendar size={32} color={colors.primaryLight} />}
              title={activeTab === 'upcoming' ? 'No Upcoming Sessions' : 'No Past Sessions'}
              description={
                activeTab === 'upcoming'
                  ? 'Connect with mentors and schedule your first 1-on-1 skill exchange.'
                  : 'Your completed exchange sessions will appear here.'
              }
              actionLabel={activeTab === 'upcoming' ? 'Find Mentors' : null}
              onAction={() => navigation.navigate('Search')}
            />
          )
        }
      />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.cardLight,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  upcomingBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  completedBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  upcomingBadgeText: {
    color: colors.primaryLight,
  },
  completedBadgeText: {
    color: colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: 11.5,
  },
  topicTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerInfo: {
    marginLeft: 10,
  },
  partnerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  partnerRole: {
    color: colors.textSecondary,
    fontSize: 11.5,
  }
})
