import { createContext, useEffect, useState } from "react"
import { databases, client, DATABASE_CONFIG, handleAppwriteError } from "../lib/appwrite"
import { ID, Permission, Query, Role } from "react-native-appwrite"
import { useUser } from "../hooks/useUser"

export const BookingsContext = createContext()

export function BookingsProvider({ children }) {
  const [userBookings, setUserBookings] = useState([]) // Bookings made by current user
  const [receivedBookings, setReceivedBookings] = useState([]) // Bookings for current user's services
  const [loading, setLoading] = useState(false)
  const { user, refreshAuth } = useUser()

  // Handle authentication errors consistently
  async function handleAuthError(error) {
    const errorInfo = handleAppwriteError(error)
    
    if (errorInfo.isAuthError && errorInfo.shouldLogout) {
      console.log('🔄 Attempting to refresh authentication...')
      const refreshedUser = await refreshAuth()
      
      if (!refreshedUser) {
        console.log('❌ Auth refresh failed, user needs to log in again')
        throw new Error('Your session has expired. Please log in again.')
      }
      
      console.log('✅ Auth refreshed successfully')
      return refreshedUser
    }
    
    throw new Error(errorInfo.message)
  }

  // Test bookings database connection
  async function testBookingsConnection() {
    try {
      console.log('🧪 Testing bookings database connection...')
      console.log('Database ID:', DATABASE_CONFIG.DATABASE_ID)
      console.log('Bookings Collection ID:', DATABASE_CONFIG.BOOKINGS_COLLECTION_ID)
      console.log('Current user ID:', user?.$id)
      console.log('User authenticated:', !!user)
      
      if (!DATABASE_CONFIG.BOOKINGS_COLLECTION_ID) {
        console.log('⚠️ Bookings collection ID not configured')
        return false
      }
      
      if (!user) {
        console.log('⚠️ No user authenticated for bookings test')
        return false
      }
      
      // Try a simple query to test permissions
      await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.BOOKINGS_COLLECTION_ID,
        [
          Query.limit(1),
          Query.equal('clientId', user.$id)
        ]
      )
      
      console.log('✅ Bookings database connection successful!')
      return true
    } catch (error) {
      console.error('❌ Bookings database connection failed:', error.message)
      console.error('Error type:', error.type)
      console.error('Error code:', error.code)
      
      // Check if it's a permissions issue
      if (error.code === 401 || error.type === 'user_unauthorized') {
        console.error('❌ PERMISSIONS ISSUE: The bookings collection needs proper read permissions')
        console.error('❌ Please check Appwrite collection permissions for collection:', DATABASE_CONFIG.BOOKINGS_COLLECTION_ID)
      }
      
      try {
        await handleAuthError(error)
        return await testBookingsConnection()
      } catch (authError) {
        console.error('❌ Bookings auth handling failed:', authError.message)
        return false
      }
    }
  }

  // Fetch bookings made by current user
  async function fetchUserBookings() {
    try {
      if (!DATABASE_CONFIG.BOOKINGS_COLLECTION_ID) {
        console.log('⚠️ Bookings collection not configured, skipping fetch')
        setUserBookings([])
        return []
      }
      
      if (!user) {
        console.log('⚠️ No user authenticated for fetching user bookings')
        setUserBookings([])
        return []
      }

      console.log('📋 Fetching bookings made by user:', user.$id)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.BOOKINGS_COLLECTION_ID,
        [
          Query.equal('clientId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      )

      console.log('✅ Successfully fetched user bookings:', response.documents.length)
      setUserBookings(response.documents)
      return response.documents
    } catch (error) {
      console.error('❌ Error fetching user bookings:', error)
      await handleAuthError(error)
      setUserBookings([])
      return []
    }
  }

  // Fetch bookings received for current user's services
  async function fetchReceivedBookings() {
    try {
      if (!DATABASE_CONFIG.BOOKINGS_COLLECTION_ID) {
        console.log('⚠️ Bookings collection not configured, skipping fetch')
        setReceivedBookings([])
        return []
      }
      
      if (!user) {
        console.log('⚠️ No user authenticated for fetching received bookings')
        setReceivedBookings([])
        return []
      }

      console.log('📋 Fetching bookings received by user:', user.$id)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.BOOKINGS_COLLECTION_ID,
        [
          Query.equal('serviceProviderId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      )

      console.log('✅ Successfully fetched received bookings:', response.documents.length)
      setReceivedBookings(response.documents)
      return response.documents
    } catch (error) {
      console.error('❌ Error fetching received bookings:', error)
      await handleAuthError(error)
      setReceivedBookings([])
      return []
    }
  }

  // Create a new booking
  async function createBooking(bookingData) {
    try {
      if (!DATABASE_CONFIG.BOOKINGS_COLLECTION_ID) {
        throw new Error('Bookings system is not configured. Please contact support.')
      }
      
      if (!user) {
        throw new Error('User must be authenticated to create a booking')
      }

      console.log('📋 Creating new booking for service:', bookingData.serviceId)
      
      const booking = {
        serviceId: bookingData.serviceId,
        serviceTitle: bookingData.serviceTitle,
        serviceProviderId: bookingData.serviceProviderId,
        clientId: user.$id,
        clientEmail: user.email,
        hourlyRate: bookingData.hourlyRate || 0,
        estimatedHours: bookingData.estimatedHours || 1,
        preferredStartDate: bookingData.preferredStartDate,
        notes: bookingData.notes || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        totalEstimate: (bookingData.hourlyRate || 0) * (bookingData.estimatedHours || 1)
      }

      const response = await databases.createDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.BOOKINGS_COLLECTION_ID,
        ID.unique(),
        booking,
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      )

      console.log('✅ Booking created successfully:', response.$id)

      // Update local state
      setUserBookings(prev => [response, ...prev])

      return response
    } catch (error) {
      console.error('❌ Error creating booking:', error)
      await handleAuthError(error)
    }
  }

  // Update booking status
  async function updateBookingStatus(bookingId, status, updateData = {}) {
    try {
      if (!DATABASE_CONFIG.BOOKINGS_COLLECTION_ID) {
        throw new Error('Bookings system is not configured. Please contact support.')
      }
      
      if (!user) {
        throw new Error('User must be authenticated to update booking')
      }

      console.log('📋 Updating booking status:', bookingId, 'to', status)
      
      const finalUpdateData = {
        ...updateData,
        status,
      }


      const response = await databases.updateDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.BOOKINGS_COLLECTION_ID,
        bookingId,
        finalUpdateData
      )

      console.log('✅ Booking status updated successfully')

      // Update local state
      setUserBookings(prev => 
        prev.map(booking => booking.$id === bookingId ? response : booking)
      )
      
      setReceivedBookings(prev => 
        prev.map(booking => booking.$id === bookingId ? response : booking)
      )

      return response
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
      await handleAuthError(error)
    }
  }

  // Get booking statistics
  function getBookingStats() {
    const totalBookings = userBookings.length
    const pendingBookings = userBookings.filter(b => b.status === 'pending').length
    const confirmedBookings = userBookings.filter(b => b.status === 'confirmed').length
    const completedBookings = userBookings.filter(b => b.status === 'completed').length

    return {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings
    }
  }

  useEffect(() => {
    let unsubscribe

    if (user) {
      console.log('👤 Setting up bookings for user:', user.$id)
      
      if (!DATABASE_CONFIG.BOOKINGS_COLLECTION_ID) {
        console.log('⚠️ Bookings collection not configured, skipping setup')
        return
      }
      
      // Wait for user session to be fully established
      setTimeout(() => {
        testBookingsConnection().then(connectionOk => {
          if (connectionOk) {
            fetchUserBookings()
            fetchReceivedBookings()
          } else {
            console.error('❌ Skipping bookings fetch due to connection failure')
          }
        })
      }, 1500)

      // Set up real-time subscription
      const bookingsChannel = `databases.${DATABASE_CONFIG.DATABASE_ID}.collections.${DATABASE_CONFIG.BOOKINGS_COLLECTION_ID}.documents`

      unsubscribe = client.subscribe(bookingsChannel, (response) => {
        const { payload, events } = response
        console.log('🔄 Booking real-time update:', events)

        if (events.some(event => event.includes("create"))) {
          // Update user bookings if it's the current user's booking
          if (payload.clientId === user.$id) {
            setUserBookings(prev => [payload, ...prev])
          }

          // Update received bookings if it's for the current user's service
          if (payload.serviceProviderId === user.$id) {
            setReceivedBookings(prev => [payload, ...prev])
          }
        }

        if (events.some(event => event.includes("update"))) {
          // Update both states
          setUserBookings(prev => 
            prev.map(booking => booking.$id === payload.$id ? payload : booking)
          )
          
          setReceivedBookings(prev => 
            prev.map(booking => booking.$id === payload.$id ? payload : booking)
          )
        }

        if (events.some(event => event.includes("delete"))) {
          // Remove from both states
          setUserBookings(prev => prev.filter(booking => booking.$id !== payload.$id))
          setReceivedBookings(prev => prev.filter(booking => booking.$id !== payload.$id))
        }
      })
    } else {
      console.log('👤 User not authenticated, clearing bookings data')
      setUserBookings([])
      setReceivedBookings([])
    }

    return () => {
      if (unsubscribe) {
        console.log('🧹 Cleaning up bookings real-time subscription')
        unsubscribe()
      }
    }
  }, [user])

  return (
    <BookingsContext.Provider value={{
      userBookings,
      receivedBookings,
      loading,
      fetchUserBookings,
      fetchReceivedBookings,
      createBooking,
      updateBookingStatus,
      getBookingStats,
      testBookingsConnection
    }}>
      {children}
    </BookingsContext.Provider>
  )
}