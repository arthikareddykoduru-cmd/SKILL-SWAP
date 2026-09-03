import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration
} from 'react-native'
import { Phone, PhoneOff, Video, Sparkles } from 'lucide-react-native'
import { colors } from '../theme/colors'
import Avatar from './Avatar'

export default function IncomingCallModal({
  visible,
  callData,
  onAccept,
  onDecline
}) {
  if (!callData) return null

  const callerName = callData.callerName || 'Skill Partner'
  const topic = callData.topic || 'Skill Exchange Session'

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Top Badge */}
        <View style={styles.headerBadge}>
          <Sparkles size={16} color={colors.primaryLight} />
          <Text style={styles.headerBadgeText}>INCOMING 1:1 CALL</Text>
        </View>

        {/* Center Caller Info */}
        <View style={styles.callerContainer}>
          <View style={styles.avatarRings}>
            <View style={styles.ringOuter} />
            <Avatar name={callerName} size={110} />
          </View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callTopic}>{topic}</Text>
          <Text style={styles.ringingStatus}>Ringing...</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {/* Decline Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDecline}
            style={styles.declineBtn}
          >
            <PhoneOff size={28} color="#FFFFFF" />
            <Text style={styles.btnLabel}>Decline</Text>
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAccept}
            style={styles.acceptBtn}
          >
            <Phone size={28} color="#FFFFFF" />
            <Text style={styles.btnLabel}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C16',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  headerBadgeText: {
    color: colors.primaryLight,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  callerContainer: {
    alignItems: 'center',
  },
  avatarRings: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ringOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.35)',
  },
  callerName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  callTopic: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
  },
  ringingStatus: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  declineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  acceptBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  btnLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  }
})
