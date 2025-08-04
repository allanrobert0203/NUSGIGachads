import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Colors } from '../constants/Colors'

function ThemedButton({ style, ...props }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        pressed ? styles.pressed : styles.notPressed,
        style,
      ]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#7F5AF0',
    padding: 18,
    borderRadius: 12,
    marginVertical: 10,

    
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  pressed: {
    backgroundColor: '#A085F7', 
    shadowOpacity: 0.9,
    shadowRadius: 20,
  },
  notPressed: {
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
})

export default ThemedButton