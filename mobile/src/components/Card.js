import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { colors } from '../theme/colors'

export default function Card({ children, style, onPress, elevated = false }) {
  const CardContainer = onPress ? TouchableOpacity : View

  return (
    <CardContainer
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[
        styles.card,
        elevated && styles.elevated,
        style
      ]}
    >
      {children}
    </CardContainer>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  }
})
