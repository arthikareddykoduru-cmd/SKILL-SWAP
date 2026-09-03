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
import { MessageSquare, ChevronRight, Sparkles } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Avatar from '../components/Avatar'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { getConversations, subscribeToConversations } from '../services/api'

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadConversations = async () => {
    try {
      const res = await getConversations()
      setConversations(res)
    } catch (e) {
      console.warn('Error fetching conversations:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadConversations()
    const unsubscribe = subscribeToConversations((list) => {
      setConversations(list)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const formatTimestamp = (item) => {
    const rawTime = item.last_message_at || item.lastMessageAt || item.created_at
    if (!rawTime) return 'Just now'
    if (rawTime.toDate) {
      return rawTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (rawTime instanceof Date) {
      return rawTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return 'Just now'
  }

  const renderConversationItem = ({ item }) => {
    const partner = item.partner || {}
    const timeDisplay = formatTimestamp(item)

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate('Chat', { conversationId: item.id, partner })}
        style={styles.chatRow}
      >
        <Avatar
          uri={partner.avatar_url}
          name={partner.full_name || 'User'}
          size={50}
          isOnline={true}
        />
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.partnerName}>{partner.full_name || 'Skill Partner'}</Text>
            <Text style={styles.timestamp}>{timeDisplay}</Text>
          </View>
          <View style={styles.messagePreviewRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message || item.lastMessage || 'Start chatting with your partner'}
            </Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const uniqueConversations = React.useMemo(() => {
    const list = []
    const seen = new Set()
    for (const c of conversations) {
      const nameKey = c.partner?.full_name ? c.partner.full_name.trim().toLowerCase() : ''
      const idKey = c.partnerId || c.id
      const key = nameKey || idKey
      if (!seen.has(key)) {
        seen.add(key)
        list.push(c)
      }
    }
    return list
  }, [conversations])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={uniqueConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConversations(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon={<MessageSquare size={32} color={colors.primaryLight} />}
              title="No Messages Yet"
              description="Connect with other users or send a swap proposal to start a conversation."
              actionLabel="Find Mentors"
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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 110,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    color: colors.text,
    fontSize: 15.5,
    fontWeight: '700',
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 11.5,
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  }
})
