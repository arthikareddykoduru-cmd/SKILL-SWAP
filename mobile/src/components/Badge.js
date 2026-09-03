import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'

export default function Badge({ label, type = 'teaching', size = 'md', style }) {
  const isTeaching = type === 'teaching'
  const isLearning = type === 'learning'
  const isNeutral = type === 'neutral'
  const isSuccess = type === 'success'

  const getBgColor = () => {
    if (isTeaching) return 'rgba(16, 185, 129, 0.15)'
    if (isLearning) return 'rgba(99, 102, 241, 0.15)'
    if (isSuccess) return 'rgba(16, 185, 129, 0.2)'
    return 'rgba(148, 163, 184, 0.12)'
  }

  const getTextColor = () => {
    if (isTeaching) return '#34D399'
    if (isLearning) return '#A5B4FC'
    if (isSuccess) return '#10B981'
    return '#CBD5E1'
  }

  const getBorderColor = () => {
    if (isTeaching) return 'rgba(16, 185, 129, 0.3)'
    if (isLearning) return 'rgba(99, 102, 241, 0.3)'
    if (isSuccess) return 'rgba(16, 185, 129, 0.4)'
    return 'rgba(148, 163, 184, 0.2)'
  }

  const isSmall = size === 'sm'

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: isSmall ? 11 : 12.5,
          }
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  }
})
