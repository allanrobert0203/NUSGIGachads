import React from 'react'
import { Text, useColorScheme } from 'react-native'
import { Colors } from '../constants/Colors'

const ThemedText = ({ style, title = false, ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const textColor = title ? theme.title : theme.text

  return (
    <Text
      style={[
        {
          color: textColor,
          fontWeight: title ? '700' : '400',
          fontSize: title ? 24 : 16,
          letterSpacing: title ? 1 : 0.5,
          textShadowColor: colorScheme === 'dark' && title ? 'rgba(127, 90, 240, 0.8)' : 'transparent',
          textShadowOffset: title ? { width: 0, height: 1 } : { width: 0, height: 0 },
          textShadowRadius: title ? 6 : 0,
        },
        style,
      ]}
      {...props}
    />
  )
}

export default ThemedText