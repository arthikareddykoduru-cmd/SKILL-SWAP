import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native'
import { colors } from '../theme/colors'

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  style,
  textStyle
}) {
  const getBackgroundColor = () => {
    if (disabled) return colors.cardBorder
    switch (variant) {
      case 'primary':
        return colors.primary
      case 'secondary':
        return colors.cardLight
      case 'outline':
      case 'ghost':
        return 'transparent'
      case 'danger':
        return colors.danger
      default:
        return colors.primary
    }
  }

  const getTextColor = () => {
    if (disabled) return colors.textMuted
    switch (variant) {
      case 'primary':
        return colors.white
      case 'secondary':
        return colors.text
      case 'outline':
        return colors.primaryLight
      case 'ghost':
        return colors.textSecondary
      case 'danger':
        return colors.white
      default:
        return colors.white
    }
  }

  const getBorderColor = () => {
    if (variant === 'outline') return colors.primary
    if (variant === 'secondary') return colors.cardBorder
    return 'transparent'
  }

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 14 }
      case 'lg':
        return { paddingVertical: 15, paddingHorizontal: 24 }
      default:
        return { paddingVertical: 12, paddingHorizontal: 18 }
    }
  }

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 13
      case 'lg':
        return 16
      default:
        return 14.5
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
              },
              textStyle
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  }
})
