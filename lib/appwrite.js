import { Client, Account, Avatars, Databases } from "react-native-appwrite"

export const client = new Client()

// Configuration
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '6860ef510001d9ff1a12'
const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1'

client
  .setProject(PROJECT_ID)
  .setEndpoint(ENDPOINT)
  // Remove setPlatform for web to allow proper CORS handling
  // .setPlatform('localhost') // This line causes CORS issues for web clients

export const account = new Account(client)
export const avatars = new Avatars(client)
export const databases = new Databases(client)

// Database configuration
export const DATABASE_CONFIG = {
  DATABASE_ID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '6860efb40034368dd9d3',
  SERVICES_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_SERVICES_COLLECTION_ID || '6860f096000662169436',
  CONVERSATIONS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_CONVERSATIONS_COLLECTION_ID || '6860f14d003c47e9bdab',
  MESSAGES_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || '6860f2480004ede12d56',
  REVIEWS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID || '6886e76c003c492bce7a',
  BOOKINGS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID || '688faab8002bd5dde7c6'
}

// Enhanced error handling for authentication issues
export function handleAppwriteError(error) {
  console.error('Appwrite Error Details:', {
    message: error.message,
    code: error.code,
    type: error.type,
    response: error.response
  })

  // Handle network/fetch errors
  if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
    return {
      isAuthError: false,
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      shouldLogout: false
    }
  }

  // Handle invalid credentials specifically
  if (error.type === 'user_invalid_credentials' || 
      error.message.includes('Invalid credentials')) {
    return {
      isAuthError: true,
      message: 'Invalid email or password. Please check your credentials and try again.',
      shouldLogout: false
    }
  }

  if (error.message.includes('missing scope') || 
      error.message.includes('guests') || 
      error.code === 401 ||
      error.type === 'user_unauthorized' ||
      error.type === 'general_unauthorized_scope') {
    return {
      isAuthError: true,
      message: 'Authentication required. Please log in again.',
      shouldLogout: true
    }
  }

  if (error.message.includes('Collection with the requested ID could not be found') ||
      error.message.includes('Database not found')) {
    return {
      isAuthError: false,
      message: 'Database configuration error. Please check your setup.',
      shouldLogout: false
    }
  }

  return {
    isAuthError: false,
    message: error.message || 'An unexpected error occurred',
    shouldLogout: false
  }
}

// Test authentication status
export async function testAuthStatus() {
  try {
    console.log('🔍 Testing authentication status...')
    const user = await account.get()
    console.log('✅ User authenticated:', user.email, '(ID:', user.$id + ')')
    return { success: true, user }
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message)
    return { success: false, error: handleAppwriteError(error) }
  }
}

// Log configuration on startup
console.log('🔧 Appwrite Configuration:')
console.log('Project ID:', PROJECT_ID)
console.log('Endpoint:', ENDPOINT)
console.log('Database ID:', DATABASE_CONFIG.DATABASE_ID)
console.log('Services Collection:', DATABASE_CONFIG.SERVICES_COLLECTION_ID)
console.log('Conversations Collection:', DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID)
console.log('Messages Collection:', DATABASE_CONFIG.MESSAGES_COLLECTION_ID)
console.log('Reviews Collection:', DATABASE_CONFIG.REVIEWS_COLLECTION_ID)
console.log('Bookings Collection:', DATABASE_CONFIG.BOOKINGS_COLLECTION_ID)