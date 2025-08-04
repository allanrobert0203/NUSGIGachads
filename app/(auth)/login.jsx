import { StyleSheet, Text, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { useUser } from '../../hooks/useUser'
import { Colors } from '../../constants/Colors'

import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'
import Spacer from '../../components/Spacer'
import ThemedButton from '../../components/ThemedButton'
import ThemedTextInput from "../../components/ThemedTextInput"
import AuthErrorHandler from '../../components/auth/AuthErrorHandler'

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { user, login, authError } = useUser()

  const handleSubmit = async () => {
    if (loading) return
    
    setError(null)
    setLoading(true)
    
    try {
      console.log('🔐 Starting login process...')
      await login(email, password)
      console.log('✅ Login successful, user:', user?.email)
    } catch (error) {
      console.error('❌ Login error:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleSubmit()
  }

  // Show auth error if it exists
  if (authError) {
    return (
      <ThemedView style={styles.container}>
        <AuthErrorHandler 
          error={authError} 
          onRetry={handleRetry}
          showRetry={false}
        />
      </ThemedView>
    )
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>

        <Link href="/" style={styles.backButton}>
        <ThemedText>{'Home'}</ThemedText>
        </Link>
        
        <Spacer />
        <ThemedText title={true} style={styles.title}>
          Login to Your Account
        </ThemedText>

        <Spacer />
        <ThemedTextInput
          style={{ marginBottom: 20, width: "80%" }}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <ThemedTextInput
          style={{ marginBottom: 20, width: "80%" }}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <ThemedButton onPress={handleSubmit} disabled={loading}>
          <Text style={{ color: '#f2f2f2' }}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </ThemedButton>

        <Spacer/>
        {error && (
          <AuthErrorHandler 
            error={error} 
            onRetry={handleRetry}
            showRetry={true}
          />
        )}

        <Spacer height={100} />
        <Link href="/register" replace>
          <ThemedText style={{ textAlign: "center" }}>
            Register instead?
          </ThemedText>
        </Link>

      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  backButtonText: {
    fontWeight: '700',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 30
  },
})