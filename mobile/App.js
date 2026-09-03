import React from 'react'
import { LogBox } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'

// Ignore non-fatal Firestore network/backend retry notices in development
LogBox.ignoreLogs([
  '@firebase/firestore:',
  'Could not reach Cloud Firestore backend',
  'Failed to get document because the client is offline',
  'The query requires multiple indexes'
])

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#0B0F19" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
