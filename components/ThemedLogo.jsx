import { View, Image, useColorScheme, StyleSheet } from 'react-native'

// images
import DarkLogo from '../assets/img/dark_logo.jpg'
import LightLogo from '../assets/img/light_logo.jpg'

const ThemedLogo = (props) => {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const logo = isDark ? DarkLogo : LightLogo

  return (
    <View style={[styles.wrapper, isDark && styles.glow]}>
      <Image
        source={logo}
        style={styles.img}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25, // same or slightly more than img
  },
  img: {
    height: 200,
    width: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  glow: {
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25, // Larger for spread effect
    borderColor: '#00f0ff',
  },
})

export default ThemedLogo