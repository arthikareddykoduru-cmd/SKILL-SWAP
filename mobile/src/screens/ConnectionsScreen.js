import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Check, X, MessageSquare, Clock, UserCheck, Users } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { getConnections, subscribeToConnections, respondToConnectionRequest, getOrCreateConversation } from '../services/api'

export default function ConnectionsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'incoming' | 'outgoing'
  const [connections, setConnections] = useState({ active: [], pendingIncoming: [], pendingOutgoing: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const res = await getConnections()
      setConnections(res)
    } catch (e) {
      console.warn('Connections load notice:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const unsubscribe = subscribeToConnections((data) => {
      setConnections(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleAccept = async (connId) => {
    try {
      await respondToConnectionRequest(connId, true)
      Alert.alert('Accepted', 'You are now connected! You can start swapping skills and messaging.')
      loadData()
    } catch (e) {
      Alert.alert('Error', 'Could not accept connection.')
    }
  }

  const handleDecline = async (connId) => {
    try {
      await respondToConnectionRequest(connId, false)
      loadData()
    } catch (e) {
      Alert.alert('Error', 'Could not decline connection.')
    }
  }

  const handleMessage = async (partner) => {
    try {
      const convId = await getOrCreateConversation(partner.id || partner.uid)
      if (convId) {
        navigation.navigate('Chat', { conversationId: convId, partner })
      }
    } catch (e) {
      console.error('Error opening chat:', e)
    }
  }

  const currentList =
    activeTab === 'active'
      ? connections.active
      : activeTab === 'incoming'
      ? connections.pendingIncoming
      : connections.pendingOutgoing

  const renderConnectionItem = ({ item }) => {
    const partner = item.partner || {}
    const isIncoming = activeTab === 'incoming'
    const isOutgoing = activeTab === 'outgoing'

    return (
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Avatar
            uri={partner.avatar_url}
            name={partner.full_name || 'User'}
            size={48}
            isOnline={activeTab === 'active'}
          />
          <View style={styles.infoCol}>
            <Text style={styles.name}>{partner.full_name || 'Skill Partner'}</Text>
            <Text style={styles.headline} numberOfLines={1}>
              {partner.headline || (partner.skills_teaching?.length ? `Teaches ${partner.skills_teaching.join(', ')}` : 'Skill Swap Member')}
            </Text>
            {item.message ? (
              <Text style={styles.note} numberOfLines={2}>
                "{item.message}"
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          {isIncoming ? (
            <>
              <Button
                title="Decline"
                onPress={() => handleDecline(item.id)}
                variant="ghost"
                size="sm"
                icon={<X size={14} color={colors.textSecondary} />}
                style={{ flex: 1 }}
              />
              <Button
                title="Accept"
                onPress={() => handleAccept(item.id)}
                variant="primary"
                size="sm"
                icon={<Check size={14} color="#06281E" />}
                style={{ flex: 1 }}
              />
            </>
          ) : isOutgoing ? (
            <View style={styles.pendingBadge}>
              <Clock size={14} color={colors.warning} />
              <Text style={styles.pendingBadgeText}>Pending Acceptance</Text>
            </View>
          ) : (
            <>
              <Button
                title="View Profile"
                onPress={() => navigation.navigate('UserProfileDetail', { userId: partner.id || partner.uid, profile: partner })}
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
              />
              <Button
                title="Chat"
                onPress={() => handleMessage(partner)}
                variant="primary"
                size="sm"
                icon={<MessageSquare size={14} color="#06281E" />}
                style={{ flex: 1 }}
              />
            </>
          )}
        </View>
      </Card>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Network & Swaps</Text>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('active')}
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({connections.active.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('incoming')}
          style={[styles.tab, activeTab === 'incoming' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.tabTextActive]}>
            Requests ({connections.pendingIncoming.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('outgoing')}
          style={[styles.tab, activeTab === 'outgoing' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.tabTextActive]}>
            Sent ({connections.pendingOutgoing.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        renderItem={renderConnectionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon={<Users size={32} color={colors.primaryLight} />}
              title={
                activeTab === 'active'
                  ? 'No Active Connections'
                  : activeTab === 'incoming'
                  ? 'No Pending Requests'
                  : 'No Outgoing Invitations'
              }
              description={
                activeTab === 'active'
                  ? 'Discover passionate mentors and send swap invitations to start learning.'
                  : 'You have caught up with all connection requests.'
              }
              actionLabel={activeTab === 'active' ? 'Discover Mentors' : null}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
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
    paddingBottom: 110,
  },
  card: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
  },
  infoCol: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  headline: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
  },
  note: {
    color: colors.primaryLight,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: 12.5,
    fontWeight: '600',
  }
})
