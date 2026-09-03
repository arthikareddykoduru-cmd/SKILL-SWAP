import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Send, Video, Phone, ChevronLeft, MoreVertical } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Avatar from '../components/Avatar'
import { subscribeToMessages, sendMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ChatScreen({ route, navigation }) {
  const { conversationId, partner } = route.params || {}
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const flatListRef = useRef(null)

  useEffect(() => {
    if (!conversationId) return

    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [conversationId])

  const handleSend = async () => {
    if (!inputText.trim() || sending) return
    const textToSend = inputText.trim()
    setInputText('')
    setSending(true)
    try {
      await sendMessage(conversationId, textToSend, partner?.id || partner?.uid)
    } catch (e) {
      console.error('Failed to send:', e)
    } finally {
      setSending(false)
    }
  }

  const renderMessageBubble = ({ item }) => {
    const isMe = item.senderId === user?.uid || item.sender_id === user?.uid
    let timeStr = ''
    if (item.created_at) {
      timeStr = item.created_at instanceof Date
        ? item.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (item.time) {
      timeStr = item.time
    }

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.theirBubbleText]}>
            {item.text || item.content || ''}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.myBubbleTime : styles.theirBubbleTime]}>
            {timeStr}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* Chat Navigation Header */}
      <View style={styles.chatNavHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('UserProfileDetail', { userId: partner?.id || partner?.uid, profile: partner })}
          style={styles.partnerInfo}
        >
          <Avatar
            uri={partner?.avatar_url}
            name={partner?.full_name || 'Partner'}
            size={38}
            isOnline={true}
          />
          <View style={styles.partnerTextGroup}>
            <Text style={styles.partnerName} numberOfLines={1}>{partner?.full_name || 'Skill Partner'}</Text>
            <Text style={styles.onlineStatus}>Online</Text>
          </View>
        </TouchableOpacity>

        {/* Video / Call Action */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Call', {
              partnerId: partner?.id || partner?.uid,
              partnerName: partner?.full_name || 'Skill Partner',
              isCaller: true,
              topic: `Skill Swap with ${partner?.full_name || 'Partner'}`
            })}
            style={styles.iconBtn}
          >
            <Video size={20} color={colors.primaryLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageBubble}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Send a message to begin swapping skills!</Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          >
            <Send size={18} color="#06281E" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backBtn: {
    paddingRight: 8,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 4,
  },
  partnerTextGroup: {
    marginLeft: 10,
    flex: 1,
  },
  partnerName: {
    color: colors.text,
    fontSize: 15.5,
    fontWeight: '700',
  },
  onlineStatus: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubbleWrapper: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  myBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  theirBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#06281E',
    fontWeight: '500',
  },
  theirBubbleText: {
    color: colors.text,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myBubbleTime: {
    color: '#063A2B',
  },
  theirBubbleTime: {
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  }
})
