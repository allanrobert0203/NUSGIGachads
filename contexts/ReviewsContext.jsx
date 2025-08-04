import { createContext, useEffect, useState } from "react"
import { databases, client, DATABASE_CONFIG, handleAppwriteError } from "../lib/appwrite"
import { ID, Permission, Query, Role } from "react-native-appwrite"
import { useUser } from "../hooks/useUser"

export const ReviewsContext = createContext()

export function ReviewsProvider({ children }) {
  const [reviews, setReviews] = useState({}) // Keyed by serviceId
  const [userReviews, setUserReviews] = useState([]) // Reviews written by current user
  const [receivedReviews, setReceivedReviews] = useState([]) // Reviews received by current user
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

  // Test reviews database connection
  async function testReviewsConnection() {
    try {
      console.log('🧪 Testing reviews database connection...')
      console.log('Database ID:', DATABASE_CONFIG.DATABASE_ID)
      console.log('Reviews Collection ID:', DATABASE_CONFIG.REVIEWS_COLLECTION_ID)
      
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        console.log('⚠️ Reviews collection ID not configured')
        return false
      }
      
      if (!user) {
        console.log('⚠️ No user authenticated for reviews test')
        return false
      }
      
      await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
        [Query.limit(1)]
      )
      
      console.log('✅ Reviews database connection successful!')
      return true
    } catch (error) {
      console.error('❌ Reviews database connection failed:', error.message)
      
      try {
        await handleAuthError(error)
        return await testReviewsConnection()
      } catch (authError) {
        console.error('❌ Reviews auth handling failed:', authError.message)
        return false
      }
    }
  }

  // Fetch reviews for a specific service
  async function fetchServiceReviews(serviceId) {
    try {
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        console.log('⚠️ Reviews collection not configured, skipping fetch')
        return []
      }
      
      if (!user) {
        console.log('⚠️ No user authenticated for fetching reviews')
        return []
      }

      console.log('⭐ Fetching reviews for service:', serviceId)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
        [
          Query.equal('serviceId', serviceId),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      )

      console.log('✅ Successfully fetched service reviews:', response.documents.length)
      
      setReviews(prev => ({
        ...prev,
        [serviceId]: response.documents
      }))

      return response.documents
    } catch (error) {
      console.error('❌ Error fetching service reviews:', error)
      await handleAuthError(error)
      return []
    }
  }

  // Fetch reviews written by current user
  async function fetchUserReviews() {
    try {
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        console.log('⚠️ Reviews collection not configured, skipping fetch')
        setUserReviews([])
        return []
      }
      
      if (!user) {
        console.log('⚠️ No user authenticated for fetching user reviews')
        setUserReviews([])
        return []
      }

      console.log('⭐ Fetching reviews written by user:', user.$id)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
        [
          Query.equal('reviewerId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      )

      console.log('✅ Successfully fetched user reviews:', response.documents.length)
      setUserReviews(response.documents)
      return response.documents
    } catch (error) {
      console.error('❌ Error fetching user reviews:', error)
      await handleAuthError(error)
      setUserReviews([])
      return []
    }
  }

  // Fetch reviews received by current user (for their services)
  async function fetchReceivedReviews() {
    try {
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        console.log('⚠️ Reviews collection not configured, skipping fetch')
        setReceivedReviews([])
        return []
      }
      
      if (!user) {
        console.log('⚠️ No user authenticated for fetching received reviews')
        setReceivedReviews([])
        return []
      }

      console.log('⭐ Fetching reviews received by user:', user.$id)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
        [
          Query.equal('serviceProviderId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      )

      console.log('✅ Successfully fetched received reviews:', response.documents.length)
      setReceivedReviews(response.documents)
      return response.documents
    } catch (error) {
      console.error('❌ Error fetching received reviews:', error)
      await handleAuthError(error)
      setReceivedReviews([])
      return []
    }
  }

  // Create a new review
  async function createReview(reviewData) {
    try {
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        throw new Error('Reviews system is not configured. Please contact support.')
      }
      
      if (!user) {
        throw new Error('User must be authenticated to create a review')
      }

      console.log('⭐ Creating new review for service:', reviewData.serviceId)
      
      // Check if user has already reviewed this specific booking/transaction
      if (reviewData.transactionId) {
        const existingReviews = await databases.listDocuments(
          DATABASE_CONFIG.DATABASE_ID,
          DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
          [
            Query.equal('serviceId', reviewData.serviceId),
            Query.equal('reviewerId', user.$id),
            Query.equal('transactionId', reviewData.transactionId)
          ]
        )

        if (existingReviews.documents.length > 0) {
          throw new Error('You have already reviewed this booking')
        }
      } else {
        // For reviews without transaction ID, check if user has already reviewed this service
        const existingReviews = await databases.listDocuments(
          DATABASE_CONFIG.DATABASE_ID,
          DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
          [
            Query.equal('serviceId', reviewData.serviceId),
            Query.equal('reviewerId', user.$id),
            Query.isNull('transactionId')
          ]
        )

        if (existingReviews.documents.length > 0) {
          throw new Error('You have already reviewed this service')
        }
      }

      const review = {
        serviceId: reviewData.serviceId,
        serviceProviderId: reviewData.serviceProviderId,
        reviewerId: user.$id,
        reviewerEmail: user.email,
        rating: reviewData.rating,
        comment: reviewData.comment || '',
        transactionId: reviewData.transactionId || null,
        isVerifiedPurchase: !!reviewData.transactionId,
        createdAt: new Date().toISOString()
      }

      const response = await databases.createDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
        ID.unique(),
        review,
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      )

      console.log('✅ Review created successfully:', response.$id)

      // Update local state
      setReviews(prev => ({
        ...prev,
        [reviewData.serviceId]: [response, ...(prev[reviewData.serviceId] || [])]
      }))
      
      setUserReviews(prev => [response, ...prev])

      return response
    } catch (error) {
      console.error('❌ Error creating review:', error)
      await handleAuthError(error)
    }
  }

  // Update an existing review
  async function updateReview(reviewId, updateData) {
    try {
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        throw new Error('Reviews system is not configured. Please contact support.')
      }
      
      if (!user) {
        throw new Error('User must be authenticated to update a review')
      }

      console.log('⭐ Updating review:', reviewId)
      
      const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      }

      const response = await databases.updateDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
        reviewId,
        updatedData
      )

      console.log('✅ Review updated successfully')

      // Update local state
      setReviews(prev => {
        const newReviews = { ...prev }
        Object.keys(newReviews).forEach(serviceId => {
          newReviews[serviceId] = newReviews[serviceId].map(review =>
            review.$id === reviewId ? response : review
          )
        })
        return newReviews
      })

      setUserReviews(prev => 
        prev.map(review => review.$id === reviewId ? response : review)
      )

      return response
    } catch (error) {
      console.error('❌ Error updating review:', error)
      await handleAuthError(error)
    }
  }

  // Delete a review
  async function deleteReview(reviewId, serviceId) {
    try {
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        throw new Error('Reviews system is not configured. Please contact support.')
      }
      
      if (!user) {
        throw new Error('User must be authenticated to delete a review')
      }

      console.log('⭐ Deleting review:', reviewId)
      
      await databases.deleteDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.REVIEWS_COLLECTION_ID,
        reviewId
      )

      console.log('✅ Review deleted successfully')

      // Update local state
      setReviews(prev => ({
        ...prev,
        [serviceId]: (prev[serviceId] || []).filter(review => review.$id !== reviewId)
      }))

      setUserReviews(prev => prev.filter(review => review.$id !== reviewId))

    } catch (error) {
      console.error('❌ Error deleting review:', error)
      await handleAuthError(error)
    }
  }

  // Calculate average rating for a service
  function calculateAverageRating(serviceId) {
    const serviceReviews = reviews[serviceId] || []
    if (serviceReviews.length === 0) return 0
    
    const totalRating = serviceReviews.reduce((sum, review) => sum + review.rating, 0)
    return (totalRating / serviceReviews.length).toFixed(1)
  }

  // Get review statistics for a service
  function getReviewStats(serviceId) {
    const serviceReviews = reviews[serviceId] || []
    const totalReviews = serviceReviews.length
    const averageRating = calculateAverageRating(serviceId)
    
    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    }
    
    serviceReviews.forEach(review => {
      ratingDistribution[review.rating]++
    })

    return {
      totalReviews,
      averageRating: parseFloat(averageRating),
      ratingDistribution
    }
  }

  // Check if current user can review a service
  function canUserReview(serviceId, serviceProviderId) {
    if (!user || user.$id === serviceProviderId) return false
    
    const serviceReviews = reviews[serviceId] || []
    const hasReviewed = serviceReviews.some(review => review.reviewerId === user.$id)
    
    return !hasReviewed
  }

  useEffect(() => {
    let unsubscribe

    if (user) {
      console.log('👤 Setting up reviews for user:', user.$id)
      
      if (!DATABASE_CONFIG.REVIEWS_COLLECTION_ID) {
        console.log('⚠️ Reviews collection not configured, skipping setup')
        return
      }
      
      // Wait for user session to be fully established
      setTimeout(() => {
        testReviewsConnection().then(connectionOk => {
          if (connectionOk) {
            fetchUserReviews()
            fetchReceivedReviews()
          } else {
            console.error('❌ Skipping reviews fetch due to connection failure')
          }
        })
      }, 1500)

      // Set up real-time subscription
      const reviewsChannel = `databases.${DATABASE_CONFIG.DATABASE_ID}.collections.${DATABASE_CONFIG.REVIEWS_COLLECTION_ID}.documents`

      unsubscribe = client.subscribe(reviewsChannel, (response) => {
        const { payload, events } = response
        console.log('🔄 Review real-time update:', events)

        if (events.some(event => event.includes("create"))) {
          // Update service reviews
          setReviews(prev => ({
            ...prev,
            [payload.serviceId]: [payload, ...(prev[payload.serviceId] || [])]
          }))

          // Update user reviews if it's the current user's review
          if (payload.reviewerId === user.$id) {
            setUserReviews(prev => [payload, ...prev])
          }

          // Update received reviews if it's for the current user's service
          if (payload.serviceProviderId === user.$id) {
            setReceivedReviews(prev => [payload, ...prev])
          }
        }

        if (events.some(event => event.includes("update"))) {
          // Update all relevant states
          setReviews(prev => {
            const newReviews = { ...prev }
            Object.keys(newReviews).forEach(serviceId => {
              newReviews[serviceId] = newReviews[serviceId].map(review =>
                review.$id === payload.$id ? payload : review
              )
            })
            return newReviews
          })

          setUserReviews(prev => 
            prev.map(review => review.$id === payload.$id ? payload : review)
          )

          setReceivedReviews(prev => 
            prev.map(review => review.$id === payload.$id ? payload : review)
          )
        }

        if (events.some(event => event.includes("delete"))) {
          // Remove from all relevant states
          setReviews(prev => {
            const newReviews = { ...prev }
            Object.keys(newReviews).forEach(serviceId => {
              newReviews[serviceId] = newReviews[serviceId].filter(review => review.$id !== payload.$id)
            })
            return newReviews
          })

          setUserReviews(prev => prev.filter(review => review.$id !== payload.$id))
          setReceivedReviews(prev => prev.filter(review => review.$id !== payload.$id))
        }
      })
    } else {
      console.log('👤 User not authenticated, clearing reviews data')
      setReviews({})
      setUserReviews([])
      setReceivedReviews([])
    }

    return () => {
      if (unsubscribe) {
        console.log('🧹 Cleaning up reviews real-time subscription')
        unsubscribe()
      }
    }
  }, [user])

  return (
    <ReviewsContext.Provider value={{
      reviews,
      userReviews,
      receivedReviews,
      loading,
      fetchServiceReviews,
      fetchUserReviews,
      fetchReceivedReviews,
      createReview,
      updateReview,
      deleteReview,
      calculateAverageRating,
      getReviewStats,
      canUserReview,
      testReviewsConnection
    }}>
      {children}
    </ReviewsContext.Provider>
  )
}