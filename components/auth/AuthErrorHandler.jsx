import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../../hooks/useUser'

import ThemedView from '../ThemedView'
import ThemedText from '../ThemedText'
import ThemedCard from '../ThemedCard'

const AuthErrorHandler = ({ error, onRetry, showRetry = true }) => {
  const { logout } = useUser()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  if (!error) return null

  return (
    <ThemedCard style={styles.errorCard}>
      <View style={styles.errorContent}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" style={styles.errorIcon} />
        
        <ThemedText style={styles.errorTitle}>Authentication Error</ThemedText>
        
        <ThemedText style={styles.errorMessage}>
          {error}
        </ThemedText>

        <View style={styles.buttonContainer}>
          {showRetry && onRetry && (
            <Pressable onPress={onRetry} style={styles.retryButton}>
              <Ionicons name="refresh-outline" size={16} color="#007AFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          )}
          
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={16} color="#FF3B30" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>
      </View>
    </ThemedCard>
  )
}

export default AuthErrorHandler

const styles = StyleSheet.create({
  errorCard: {
    margin: 20,
    padding: 24,
    borderLeftColor: '#FF3B30',
    borderLeftWidth: 4,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  retryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
})