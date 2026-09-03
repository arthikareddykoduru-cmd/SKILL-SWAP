import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Easing
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  SwitchCamera,
  RotateCcw,
  ShieldCheck,
  Camera as CameraIcon
} from 'lucide-react-native'
import { CameraView, Camera } from 'expo-camera'
import { Audio } from 'expo-av'
import { useIsFocused } from '@react-navigation/native'
import { colors } from '../theme/colors'
import Avatar from '../components/Avatar'
import { subscribeToCallStatus, endCall, startCall } from '../services/callService'

const { width, height } = Dimensions.get('window')

export default function CallScreen({ route, navigation }) {
  const isFocused = useIsFocused()
  const {
    callId: initialCallId,
    sessionId,
    partnerId,
    partnerName = 'Arthika Reddy Koduru',
    isCaller = false,
    topic = 'Skill Exchange Session'
  } = route.params || {}

  const [callId, setCallId] = useState(initialCallId || sessionId)
  const [callStatus, setCallStatus] = useState(isCaller ? 'ringing' : 'active')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [facing, setFacing] = useState('front')
  const [seconds, setSeconds] = useState(0)
  const [hasCameraPermission, setHasCameraPermission] = useState(false)
  const [hasMicPermission, setHasMicPermission] = useState(false)
  const [isSwapped, setIsSwapped] = useState(false)

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current
  const ringAnim = useRef(new Animated.Value(0.9)).current
  const recordingRef = useRef(null)

  // Request both camera and audio permissions & configure duplex audio
  useEffect(() => {
    let isMounted = true

    async function setupMedia() {
      // 1. Camera Permissions
      try {
        if (Camera && Camera.requestCameraPermissionsAsync) {
          const camRes = await Camera.requestCameraPermissionsAsync()
          if (isMounted) {
            setHasCameraPermission(camRes.status === 'granted' || camRes.granted)
          }
        }
      } catch (err) {
        console.warn('Camera permission request error:', err)
      }

      // 2. Microphone & Audio Setup
      try {
        if (Audio && Audio.requestPermissionsAsync) {
          const micRes = await Audio.requestPermissionsAsync()
          if (isMounted) {
            setHasMicPermission(micRes.status === 'granted' || micRes.granted)
          }

          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false
          })

          if (micRes.status === 'granted' || micRes.granted) {
            try {
              const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.LOW_QUALITY
              )
              recordingRef.current = recording
            } catch (recErr) {
              console.warn('Audio stream preset note:', recErr)
            }
          }
        }
      } catch (audioErr) {
        console.warn('Audio permission request error:', audioErr)
      }
    }

    setupMedia()

    return () => {
      isMounted = false
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {})
      }
    }
  }, [])

  // WhatsApp-style pulse animations
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1.25,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(ringAnim, {
          toValue: 0.9,
          duration: 1800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start()
  }, [])

  // Call duration timer
  useEffect(() => {
    let timer = null
    if (callStatus === 'active') {
      timer = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    } else {
      setSeconds(0)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [callStatus])

  // Initiate call if caller
  useEffect(() => {
    if (isCaller && !initialCallId && partnerId) {
      startCall(partnerId, partnerName, topic)
        .then(newId => setCallId(newId))
        .catch(err => console.warn('Call start error:', err))
    }
  }, [])

  // Hardware media teardown
  const cleanupHardwareMedia = async () => {
    setIsVideoOff(true)
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync()
        recordingRef.current = null
      } catch (e) {}
    }
    if (Audio?.setAudioModeAsync) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false
        })
      } catch (e) {}
    }
  }

  // Real-time call signaling listener
  useEffect(() => {
    if (!callId) return
    const unsubscribe = subscribeToCallStatus(callId, (data) => {
      if (!data) return
      if (data.status === 'active') {
        setCallStatus('active')
      } else if (data.status === 'ringing') {
        setCallStatus('ringing')
      } else if (data.status === 'ended' || data.status === 'declined') {
        setCallStatus(data.status)
        cleanupHardwareMedia()
        setTimeout(() => {
          navigation.goBack()
        }, 500)
      }
    })
    return () => {
      unsubscribe()
      cleanupHardwareMedia()
    }
  }, [callId])

  const formatTimer = () => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'))
  }

  const handleVideoToggle = async () => {
    if (isVideoOff && !hasCameraPermission && Camera?.requestCameraPermissionsAsync) {
      try {
        const res = await Camera.requestCameraPermissionsAsync()
        if (res?.granted || res?.status === 'granted') {
          setHasCameraPermission(true)
        }
      } catch (e) {}
    }
    setIsVideoOff(!isVideoOff)
  }

  const handleMicToggle = async () => {
    if (!isMuted) {
      if (recordingRef.current) {
        try {
          await recordingRef.current.pauseAsync()
        } catch (e) {}
      }
    } else {
      if (recordingRef.current) {
        try {
          await recordingRef.current.startAsync()
        } catch (e) {}
      }
    }
    setIsMuted(!isMuted)
  }

  const handleSpeakerToggle = async () => {
    const nextSpeaker = !isSpeakerOn
    setIsSpeakerOn(nextSpeaker)
    if (Audio?.setAudioModeAsync) {
      try {
        await Audio.setAudioModeAsync({
          playThroughEarpieceAndroid: !nextSpeaker
        })
      } catch (e) {}
    }
  }

  const handleEndCall = async () => {
    await cleanupHardwareMedia()
    if (callId) {
      await endCall(callId)
    }
    navigation.goBack()
  }

  // Automatically tear down media whenever screen loses focus
  useEffect(() => {
    if (!isFocused) {
      cleanupHardwareMedia()
    }
  }, [isFocused])

  // Render camera component
  const renderLiveCamera = () => {
    if (isVideoOff || !isFocused) {
      return (
        <View style={styles.cameraOffPlaceholder}>
          <User size={30} color={colors.textMuted} />
          <Text style={styles.cameraOffText}>Camera Off</Text>
        </View>
      )
    }

    return (
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        mirror={facing === 'front'}
        enableTorch={false}
      />
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#070C16" />

      {/* Main Video Call Stage */}
      <View style={styles.fullStage}>
        {/* Main Canvas: Partner View or Fullscreen Self */}
        {isSwapped ? (
          <View style={StyleSheet.absoluteFillObject}>
            {renderLiveCamera()}
          </View>
        ) : (
          <View style={styles.remotePartnerStage}>
            <View style={styles.remoteAvatarWrap}>
              {callStatus === 'active' && (
                <Animated.View
                  style={[
                    styles.activePulseRing,
                    { transform: [{ scale: pulseAnim }], opacity: isMuted ? 0.2 : 0.6 }
                  ]}
                />
              )}
              {callStatus === 'ringing' && (
                <Animated.View
                  style={[
                    styles.activePulseRing,
                    { transform: [{ scale: ringAnim }], opacity: 0.35 }
                  ]}
                />
              )}
              <Avatar name={partnerName} size={120} />
            </View>

            <Text style={styles.remotePartnerName}>{partnerName}</Text>

            {callStatus === 'ringing' ? (
              <View style={styles.ringingBadge}>
                <Text style={styles.ringingText}>Ringing...</Text>
              </View>
            ) : (
              <View style={styles.callTimerBadge}>
                <View style={[styles.timerDot, { backgroundColor: isMuted ? '#EF4444' : '#10B981' }]} />
                <Text style={styles.callTimerText}>{formatTimer()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Top Header Security & Topic Bar */}
        <View style={styles.topBar}>
          <View style={styles.topicBadge}>
            <Sparkles size={14} color={colors.primaryLight} />
            <Text style={styles.topicText} numberOfLines={1}>{topic}</Text>
          </View>

          <View style={styles.securityBadge}>
            <ShieldCheck size={13} color="#10B981" />
            <Text style={styles.securityText}>End-to-End Encrypted</Text>
          </View>
        </View>

        {/* Floating Picture-in-Picture Card (WhatsApp Style Beside Partner) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsSwapped(!isSwapped)}
          style={styles.floatingSelfCard}
        >
          {isSwapped ? (
            <View style={styles.pipPartnerWrap}>
              <Avatar name={partnerName} size={48} />
              <Text style={styles.pipPartnerText} numberOfLines={1}>{partnerName}</Text>
            </View>
          ) : (
            <View style={styles.pipCameraContainer}>
              {renderLiveCamera()}
              {!isVideoOff && (
                <TouchableOpacity
                  onPress={toggleCameraFacing}
                  style={styles.pipFlipBtn}
                  activeOpacity={0.7}
                >
                  <SwitchCamera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <View style={styles.pipTag}>
                <Text style={styles.pipTagText}>You ({facing})</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Floating Controls Bar */}
      <View style={styles.controlsContainer}>
        {/* Mic Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleMicToggle}
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
        >
          {isMuted ? <MicOff size={24} color="#EF4444" /> : <Mic size={24} color="#FFFFFF" />}
          <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {/* Video Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleVideoToggle}
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
        >
          {isVideoOff ? <VideoOff size={24} color="#EF4444" /> : <VideoIcon size={24} color="#FFFFFF" />}
          <Text style={styles.controlLabel}>{isVideoOff ? 'Turn On' : 'Turn Off'}</Text>
        </TouchableOpacity>

        {/* Flip Camera */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleCameraFacing}
          style={styles.controlButton}
        >
          <RotateCcw size={22} color="#FFFFFF" />
          <Text style={styles.controlLabel}>Flip</Text>
        </TouchableOpacity>

        {/* Speaker Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSpeakerToggle}
          style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
        >
          {isSpeakerOn ? <Volume2 size={24} color="#FFFFFF" /> : <VolumeX size={24} color={colors.textMuted} />}
          <Text style={styles.controlLabel}>{isSpeakerOn ? 'Speaker' : 'Ear'}</Text>
        </TouchableOpacity>

        {/* Hang Up Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleEndCall}
          style={styles.hangupButton}
        >
          <PhoneOff size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070C16',
  },
  fullStage: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#070C16',
  },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 16, 28, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  topicText: {
    color: colors.primaryLight,
    fontSize: 12.5,
    fontWeight: '700',
    maxWidth: width * 0.45,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 16, 28, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  securityText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  remotePartnerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09101E',
  },
  remoteAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2.5,
    borderColor: colors.primaryLight,
  },
  remotePartnerName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 8,
  },
  ringingBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  ringingText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  callTimerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  callTimerText: {
    color: '#E2E8F0',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  floatingSelfCard: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 115,
    height: 165,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 40,
  },
  pipCameraContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  pipPartnerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardLight,
    gap: 6,
  },
  pipPartnerText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 90,
    textAlign: 'center',
  },
  pipFlipBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pipTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  pipTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  cameraOffPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardLight,
    gap: 4,
  },
  cameraOffText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    gap: 4,
  },
  controlButtonActive: {
    opacity: 0.5,
  },
  controlLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  hangupButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  }
})
