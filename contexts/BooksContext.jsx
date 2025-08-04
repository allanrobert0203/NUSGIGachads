import { createContext, useEffect, useState } from "react"
import { databases, client, DATABASE_CONFIG, handleAppwriteError } from "../lib/appwrite"
import { ID, Permission, Query, Role } from "react-native-appwrite"
import { useUser } from "../hooks/useUser"

export const BooksContext = createContext()

export function BooksProvider({children}) {
  const [books, setBooks] = useState([])
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

  // Test database connection with better error handling
  async function testDatabaseConnection() {
    try {
      console.log('🧪 Testing database connection...')
      console.log('Database ID:', DATABASE_CONFIG.DATABASE_ID)
      console.log('Collection ID:', DATABASE_CONFIG.SERVICES_COLLECTION_ID)
      console.log('User authenticated:', !!user)
      console.log('User ID:', user?.$id)
      
      if (!user) {
        console.log('⚠️ No user authenticated for database test')
        return false
      }
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID, 
        DATABASE_CONFIG.SERVICES_COLLECTION_ID,
        [Query.limit(1)]
      )
      
      console.log('✅ Database connection successful!')
      return true
    } catch (error) {
      console.error('❌ Database connection failed!')
      console.error('Error:', error.message)
      
      try {
        await handleAuthError(error)
        // If we get here, auth was refreshed, try again
        return await testDatabaseConnection()
      } catch (authError) {
        console.error('❌ Auth handling failed:', authError.message)
        return false
      }
    }
  }

  // Fetch all services (for search page - gets all users' services)
  async function fetchAllServices() {
    try {
      console.log('📋 Fetching all services...')
      console.log('User authenticated:', !!user)
      
      if (!user) {
        console.log('⚠️ No user authenticated, cannot fetch services')
        return []
      }
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID, 
        DATABASE_CONFIG.SERVICES_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      )
      
      console.log('✅ Successfully fetched all services:', response.documents.length)
      return response.documents
    } catch (error) {
      console.error('❌ Error fetching all services:', error.message)
      await handleAuthError(error)
    }
  }

  // Fetch user's own services (for books/jobs page)
  async function fetchBooks() {
    try {
      if (!user) {
        console.log('⚠️ No user authenticated, cannot fetch user services')
        setBooks([])
        return []
      }

      console.log('📋 Fetching user services for:', user.$id)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID, 
        DATABASE_CONFIG.SERVICES_COLLECTION_ID,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      )
      
      console.log('✅ Successfully fetched user services:', response.documents.length)
      setBooks(response.documents)
      return response.documents
    } catch (error) {
      console.error('❌ Error fetching user services:', error.message)
      
      try {
        await handleAuthError(error)
        // If auth was refreshed, try again
        return await fetchBooks()
      } catch (authError) {
        console.error('❌ Final error in fetchBooks:', authError.message)
        setBooks([])
        throw authError
      }
    }
  }

  async function fetchBookById(id) {
    try {
      console.log('📄 Fetching service by ID:', id)
      
      if (!user) {
        throw new Error('Authentication required to view service details')
      }
      
      const response = await databases.getDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.SERVICES_COLLECTION_ID,
        id
      )

      console.log('✅ Successfully fetched service:', response.title)
      return response
    } catch (error) {
      console.error('❌ Error fetching service by ID:', error.message)
      await handleAuthError(error)
    }
  }

  async function createBook(data) {
    try {
      if (!user) {
        throw new Error('User must be authenticated to create a service')
      }

      console.log('📝 Creating new service:', data.title)
      console.log('User ID:', user.$id)
      
      const serviceData = {
        title: data.title,
        author: data.author || `S$${data.hourlyRate || 0}/hr`,
        description: data.description,
        category: data.category || 'other',
        hourlyRate: data.hourlyRate || 0,
        deliveryTime: data.deliveryTime || 'Not specified',
        skills: data.skills || '',
        experience: data.experience || 'beginner',
        createdAt: data.createdAt || new Date().toISOString(),
        userId: user.$id
      }

      const response = await databases.createDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.SERVICES_COLLECTION_ID,
        ID.unique(),
        serviceData,
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      )

      console.log('✅ Service created successfully:', response.$id)
      setBooks(prevBooks => [response, ...prevBooks])
      return response
    } catch (error) {
      console.error('❌ Error creating service:', error.message)
      await handleAuthError(error)
    }
  }

  async function deleteBook(id) {
    try {
      if (!user) {
        throw new Error('User must be authenticated to delete a service')
      }

      console.log('🗑️ Deleting service:', id)
      
      await databases.deleteDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.SERVICES_COLLECTION_ID,
        id,
      )
      
      setBooks(prevBooks => prevBooks.filter(book => book.$id !== id))
      console.log('✅ Service deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting service:', error.message)
      await handleAuthError(error)
    }
  }

  async function refreshServices() {
    if (user) {
      try {
        await fetchBooks()
      } catch (error) {
        console.error('Error refreshing services:', error)
      }
    }
  }

  useEffect(() => {
    let unsubscribe
    const channel = `databases.${DATABASE_CONFIG.DATABASE_ID}.collections.${DATABASE_CONFIG.SERVICES_COLLECTION_ID}.documents`

    if (user) {
      console.log('👤 User authenticated, setting up services...')
      console.log('User ID:', user.$id)
      console.log('User email:', user.email)
      
      // Wait for user session to be fully established
      setTimeout(() => {
        testDatabaseConnection().then(connectionOk => {
          if (connectionOk) {
            fetchBooks()
          } else {
            console.error('❌ Skipping fetchBooks due to connection failure')
          }
        })
      }, 1500) // Increased delay

      // Set up real-time subscription
      unsubscribe = client.subscribe(channel, (response) => {
        const { payload, events } = response
        console.log('🔄 Real-time update:', events)

        if (events.some(event => event.includes("create"))) {
          setBooks((prevBooks) => {
            const exists = prevBooks.some(book => book.$id === payload.$id)
            if (!exists) {
              return [payload, ...prevBooks]
            }
            return prevBooks
          })
        }

        if (events.some(event => event.includes("update"))) {
          setBooks((prevBooks) => 
            prevBooks.map(book => 
              book.$id === payload.$id ? payload : book
            )
          )
        }

        if (events.some(event => event.includes("delete"))) {
          setBooks((prevBooks) => 
            prevBooks.filter((book) => book.$id !== payload.$id)
          )
        }
      })

    } else {
      console.log('👤 User not authenticated, clearing services')
      setBooks([])
    }

    return () => {
      if (unsubscribe) {
        console.log('🧹 Cleaning up real-time subscription')
        unsubscribe()
      }
    }

  }, [user])

  return (
    <BooksContext.Provider 
      value={{ 
        books, 
        fetchBooks, 
        fetchAllServices,
        fetchBookById, 
        createBook, 
        deleteBook,
        refreshServices,
        testDatabaseConnection
      }}
    >
      {children}
    </BooksContext.Provider>
  )
}