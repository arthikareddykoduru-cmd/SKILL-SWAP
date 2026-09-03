import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell, ChevronLeft, UserPlus, Calendar, MessageSquare, Check, Sparkles } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { subscribeToNotifications, markNotificationRead } from '../services/api'

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((list) => {
      setNotifications(list)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleNotificationPress = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id)
    }
    if (item.type === 'connection_request') {
      navigation.navigate('Connections')
    } else if (item.type === 'session_booked') {
      navigation.navigate('Schedule')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request':
        return <UserPlus size={18} color="#10B981" />
      case 'session_booked':
        return <Calendar size={18} color="#818CF8" />
      default:
        return <Sparkles size={18} color={colors.primaryLight} />
    }
  }

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleNotificationPress(item)}
        style={[styles.notifCard, !item.read && styles.unreadNotif]}
      >
        <View style={styles.iconCircle}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.contentCol}>
          <Text style={styles.title}>{item.title || 'Notification'}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>
            {item.created_at?.toLocaleTimeString
              ? item.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recently'}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <EmptyState
              icon={<Bell size={32} color={colors.primaryLight} />}
              title="All caught up!"
              description="You will see notifications here when someone sends you a swap request or books a session."
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  unreadNotif: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(22, 31, 48, 0.95)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 17,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  }
})
