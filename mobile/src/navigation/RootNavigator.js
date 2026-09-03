import React, { useState, useEffect } from 'react'
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme/colors'
import { subscribeToIncomingCalls, acceptCall, declineCall } from '../services/callService'
import IncomingCallModal from '../components/IncomingCallModal'

import AuthNavigator from './AuthNavigator'
import AppNavigator from './AppNavigator'

export const navigationRef = createNavigationContainerRef()

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
}

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuth()
  const [incomingCall, setIncomingCall] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setIncomingCall(null)
      return
    }

    const unsubscribe = subscribeToIncomingCalls((call) => {
      setIncomingCall(call)
    })

    return () => unsubscribe()
  }, [isAuthenticated])

  const handleAcceptCall = async () => {
    if (!incomingCall) return
    const callToAccept = incomingCall
    setIncomingCall(null)
    try {
      await acceptCall(callToAccept.id)
      if (navigationRef.isReady()) {
        navigationRef.navigate('Call', {
          callId: callToAccept.id,
          partnerName: callToAccept.callerName,
          partnerId: callToAccept.callerId,
          isCaller: false,
          topic: callToAccept.topic
        })
      }
    } catch (e) {
      console.warn('Accept call error:', e)
    }
  }

  const handleDeclineCall = async () => {
    if (!incomingCall) return
    const callId = incomingCall.id
    setIncomingCall(null)
    try {
      await declineCall(callId)
    } catch (e) {
      console.warn('Decline call error:', e)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer ref={navigationRef} theme={customDarkTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      <IncomingCallModal
        visible={!!incomingCall}
        callData={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  }
})
