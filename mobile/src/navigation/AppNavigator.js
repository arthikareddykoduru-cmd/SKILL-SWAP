import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import MainTabNavigator from './MainTabNavigator'
import HomeScreen from '../screens/HomeScreen'
import SearchScreen from '../screens/SearchScreen'
import ConnectionsScreen from '../screens/ConnectionsScreen'
import MessagesScreen from '../screens/MessagesScreen'
import ProfileScreen from '../screens/ProfileScreen'

import ChatScreen from '../screens/ChatScreen'
import CallScreen from '../screens/CallScreen'
import UserProfileDetailScreen from '../screens/UserProfileDetailScreen'
import ScheduleScreen from '../screens/ScheduleScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import SettingsScreen from '../screens/SettingsScreen'

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0F19' },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Connections" component={ConnectionsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />

      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="Call"
        component={CallScreen}
        options={{
          animation: 'fade_from_bottom',
          presentation: 'fullScreenModal'
        }}
      />
      <Stack.Screen name="UserProfileDetail" component={UserProfileDetailScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  )
}
