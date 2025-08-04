import { createContext, useEffect, useState } from "react"
import { account, handleAppwriteError, testAuthStatus } from "../lib/appwrite"
import { ID } from "react-native-appwrite"

export const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState(null)

  async function login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email)
      setAuthError(null)
      
      // Create new session (this will handle any existing sessions automatically)
      const session = await account.createEmailPasswordSession(email, password)
      console.log('✅ Session created:', session.$id)
      
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get user account details
      const response = await account.get()
      console.log('✅ User account retrieved:', response.$id)
      console.log('User email:', response.email)
      console.log('User status:', response.status)
      
      setUser(response)
      return response
    } catch (error) {
      console.error('❌ Login failed:', error.message)
      const errorInfo = handleAppwriteError(error)
      setAuthError(errorInfo.message)
      throw new Error(errorInfo.message)
    }
  }

  async function register(email, password) {
    try {
      console.log('📝 Attempting registration for:', email)
      setAuthError(null)
      
      // Create account
      const account_response = await account.create(ID.unique(), email, password)
      console.log('✅ Account created:', account_response.$id)
      
      // Wait a moment before login
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Automatically login after registration
      const user_response = await login(email, password)
      console.log('✅ Auto-login successful after registration')
      
      return user_response
    } catch (error) {
      console.error('❌ Registration failed:', error.message)
      const errorInfo = handleAppwriteError(error)
      setAuthError(errorInfo.message)
      throw new Error(errorInfo.message)
    }
  }

  async function logout() {
    try {
      console.log('🚪 Logging out user:', user?.email)
      await account.deleteSession("current")
      setUser(null)
      setAuthError(null)
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout failed:', error.message)
      // Still clear user state even if logout fails
      setUser(null)
      setAuthError(null)
    }
  }

  async function refreshAuth() {
    try {
      console.log('🔄 Refreshing authentication...')
      const authTest = await testAuthStatus()
      
      if (authTest.success) {
        setUser(authTest.user)
        setAuthError(null)
        console.log('✅ Auth refresh successful')
        return authTest.user
      } else {
        console.log('❌ Auth refresh failed')
        setUser(null)
        setAuthError(authTest.error.message)
        return null
      }
    } catch (error) {
      console.error('❌ Auth refresh error:', error)
      setUser(null)
      setAuthError('Authentication refresh failed')
      return null
    }
  }

  async function getInitialUserValue() {
    try {
      console.log('🔍 Checking for existing user session...')
      
      const authTest = await testAuthStatus()
      
      if (authTest.success) {
        console.log('✅ Found existing session for user:', authTest.user.email)
        console.log('User ID:', authTest.user.$id)
        console.log('User status:', authTest.user.status)
        setUser(authTest.user)
        setAuthError(null)
      } else {
        console.log('ℹ️ No valid session found:', authTest.error.message)
        setUser(null)
        if (authTest.error.isAuthError) {
          setAuthError(null) // Don't show auth errors on initial load
        } else {
          setAuthError(authTest.error.message)
        }
      }
    } catch (error) {
      console.error('❌ Initial auth check failed:', error)
      setUser(null)
      setAuthError('Failed to check authentication status')
    } finally {
      setAuthChecked(true)
      console.log('✅ Auth check completed')
    }
  }

  // Clear auth error when user changes
  useEffect(() => {
    if (user) {
      setAuthError(null)
    }
  }, [user])

  useEffect(() => {
    getInitialUserValue()
  }, [])

  // Log user state changes
  useEffect(() => {
    if (user) {
      console.log('👤 User state updated - Logged in:', user.email, '(ID:', user.$id + ')')
    } else {
      console.log('👤 User state updated - Logged out')
    }
  }, [user])

  return (
    <UserContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      authChecked,
      authError,
      refreshAuth
    }}>
      {children}
    </UserContext.Provider>
  );
}