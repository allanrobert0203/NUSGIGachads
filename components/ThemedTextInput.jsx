import React, { useState } from 'react'
import { useColorScheme, TextInput, StyleSheet } from 'react-native'
import { Colors } from '../constants/Colors'

const ThemedTextInput = ({ style, ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const [focused, setFocused] = useState(false)

  return (
    <TextInput
      placeholderTextColor={theme.placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.input,
        {
          borderColor: '#A259FF',
          shadowColor: '#A259FF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: focused ? 0.95 : 0.5,
          shadowRadius: focused ? 10 : 6,
          backgroundColor: theme.inputBackground,
          color: theme.text,
        },
        style,
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 16,
  },
})

export default ThemedTextInput
