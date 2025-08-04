import { StyleSheet, Text, Pressable, ScrollView, View, Alert } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { useBooks } from "../../../hooks/useBooks"
import { useUser } from "../../../hooks/useUser"
import { useMessaging } from "../../../hooks/useMessaging"
import { useReviews } from "../../../hooks/useReviews"
import { useBookings } from "../../../hooks/useBookings"
import { Colors } from "../../../constants/Colors"
import { Ionicons } from "@expo/vector-icons"

import ThemedText from "../../../components/ThemedText"
import ThemedButton from "../../../components/ThemedButton"
import ThemedView from "../../../components/ThemedView"
import Spacer from "../../../components/Spacer"
import ThemedCard from "../../../components/ThemedCard"
import ThemedLoader from "../../../components/ThemedLoader"
import ReviewSummary from "../../../components/reviews/ReviewSummary"
import ReviewCard from "../../../components/reviews/ReviewCard"
import BookingModal from "../../../components/booking/BookingModal"

const BookDetails = () => {
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contacting, setContacting] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)

  const { id } = useLocalSearchParams()
  const { fetchBookById, deleteBook } = useBooks()
  const { user } = useUser()
  const { createOrGetConversation } = useMessaging()
  const { testBookingsConnection } = useBookings()
  const { 
    reviews, 
    fetchServiceReviews, 
    getReviewStats,
    testReviewsConnection
  } = useReviews()
  const router = useRouter()

  const handleDelete = async () => {
    await deleteBook(id)
    setService(null)
    router.replace('/books')
  }

  const handleContactProvider = async () => {
    if (!service || !user) {
      Alert.alert('Error', 'Service or user information not available')
      return
    }

    // Check if service has userId
    if (!service.userId) {
      Alert.alert(
        'Error', 
        'This service does not have owner information. Cannot start conversation.',
        [
          { text: 'OK' }
        ]
      )
      return
    }

    // Prevent contacting yourself
    if (service.userId === user.$id) {
      Alert.alert('Error', 'You cannot contact yourself')
      return
    }

    try {
      setContacting(true)
      console.log('Creating conversation with service provider...')
      console.log('Service userId:', service.userId)
      console.log('Current user:', user.$id)
      console.log('Service ID:', service.$id)
      console.log('Service title:', service.title)
      
      try {
        const conversation = await createOrGetConversation(
          service.userId,
          service.$id,
          service.title
        )
        
        console.log('=== CONVERSATION RESULT ===')
        console.log('Conversation object:', conversation)
        console.log('Conversation type:', typeof conversation)
        console.log('Has $id:', !!conversation?.$id)
        console.log('Conversation $id:', conversation?.$id)
        
        if (!conversation) {
          throw new Error('createOrGetConversation returned null/undefined')
        }
        
        if (!conversation.$id) {
          throw new Error(`createOrGetConversation returned object without $id: ${JSON.stringify(conversation)}`)
        }
        
        console.log('✅ Conversation created/found successfully:', conversation.$id)
        
        // Navigate to the conversation
        router.push(`/messages/${conversation.$id}`)
        
      } catch (conversationError) {
        console.error('=== CONVERSATION CREATION SPECIFIC ERROR ===')
        console.error('Error in createOrGetConversation:', conversationError)
        throw conversationError
      }
      
    } catch (error) {
      console.error('=== CONVERSATION CREATION ERROR ===')
      console.error('Error message:', error.message)
      console.error('Full error:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to start conversation. '
      
      if (error.message.includes('permission')) {
        errorMessage += 'Permission denied. Please check your account settings.'
      } else if (error.message.includes('collection')) {
        errorMessage += 'Database configuration error. Please contact support.'
      } else if (error.message.includes('user')) {
        errorMessage += 'User information not found.'
      } else if (error.message.includes('undefined')) {
        errorMessage += 'Server response error. Please try again.'
      } else if (error.message.includes('$id')) {
        errorMessage += 'Database response format error. Please try again.'
      } else {
        errorMessage += error.message
      }
      
      Alert.alert('Error', errorMessage)
    } finally {
      setContacting(false)
    }
  }

  const handleBookingSuccess = () => {
    setShowBookingModal(false)
    router.push('/orders')
  }

  // Helper function to get experience level display
  const getExperienceDisplay = (experience) => {
    switch (experience) {
      case 'beginner':
        return { text: 'Beginner (0-1 years)', icon: 'star-outline', color: '#34C759' }
      case 'intermediate':
        return { text: 'Intermediate (2-4 years)', icon: 'star-half-outline', color: '#FF9500' }
      case 'expert':
        return { text: 'Expert (5+ years)', icon: 'star', color: '#FF3B30' }
      default:
        return { text: 'Beginner (0-1 years)', icon: 'star-outline', color: '#34C759' }
    }
  }

  // Helper function to get category display name
  const getCategoryDisplayName = (categoryValue) => {
    const categories = {
      'web-development': 'Web Development',
      'mobile-development': 'Mobile Development',
      'ui-ux-design': 'UI/UX Design',
      'graphic-design': 'Graphic Design',
      'content-writing': 'Content Writing',
      'digital-marketing': 'Digital Marketing',
      'data-analysis': 'Data Analysis',
      'video-editing': 'Video Editing',
      'photography': 'Photography',
      'translation': 'Translation',
      'virtual-assistant': 'Virtual Assistant',
      'other': 'Other'
    }
    return categories[categoryValue] || 'Other'
  }

  // Helper function to extract hourly rate
  const getHourlyRate = (service) => {
    if (service.hourlyRate) {
      return `S$${service.hourlyRate}/hr`
    }
    if (service.author && service.author.includes('S$')) {
      return service.author
    }
    return 'Rate not specified'
  }

  // Check if current user owns this service
  const isOwner = user && service && service.userId === user.$id
  
  const serviceReviews = reviews[id] || []
  const reviewStats = getReviewStats(id) || { totalReviews: 0, averageRating: 0, ratingDistribution: {} }

  useEffect(() => {
    async function loadService() {
      try {
        setLoading(true)
        console.log('Loading service with ID:', id)
        const serviceData = await fetchBookById(id)
        console.log('Loaded service data:', {
          id: serviceData.$id,
          title: serviceData.title,
          userId: serviceData.userId,
          author: serviceData.author,
          hasUserId: !!serviceData.userId
        })
        setService(serviceData)
        
        // Fetch reviews for this service
        const reviewsAvailable = await testReviewsConnection()
        if (reviewsAvailable) {
          await fetchServiceReviews(id)
        } else {
          console.log('⚠️ Reviews system not available, skipping review fetch')
        }
      } catch (error) {
        console.error('Error loading service:', error)
        setService(null)
      } finally {
        setLoading(false)
      }
    }

    loadService()

    return () => setService(null)
  }, [id])

  if (loading) {
    return (
      <ThemedView safe={true} style={styles.container}>
        <ThemedLoader />
      </ThemedView>
    )
  }

  if (!service) {
    return (
      <ThemedView safe={true} style={styles.container}>
        <ThemedCard style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" style={styles.errorIcon} />
          <ThemedText style={styles.errorTitle}>Service Not Found</ThemedText>
          <ThemedText style={styles.errorText}>
            This service may have been deleted or doesn't exist.
          </ThemedText>
          <Spacer height={20} />
          <ThemedButton onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </ThemedButton>
        </ThemedCard>
      </ThemedView>
    )
  }

  const experienceInfo = getExperienceDisplay(service.experience)

  return (
    <ThemedView safe={true} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <ThemedCard style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.titleSection}>
              <ThemedText style={styles.serviceTitle}>{service.title}</ThemedText>
              <View style={styles.categoryBadge}>
                <Ionicons name="folder-outline" size={14} color="#7F5AF0" />
                <ThemedText style={styles.categoryText}>
                  {getCategoryDisplayName(service.category)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.priceSection}>
              <ThemedText style={styles.priceTag}>
                {getHourlyRate(service)}
              </ThemedText>
            </View>
          </View>

          <Spacer height={16} />

          {/* Service Provider Info */}
          <View style={styles.providerSection}>
            <View style={styles.providerHeader}>
              <Ionicons name="person-circle-outline" size={24} color="#7F5AF0" />
              <ThemedText style={styles.providerTitle}>Service Provider</ThemedText>
            </View>
            
            <View style={styles.providerDetails}>
              <View style={styles.providerRow}>
                <Ionicons name="mail-outline" size={16} color="#666" />
                <ThemedText style={styles.providerText}>
                  {service.userId ? 'Professional Freelancer' : 'Anonymous Provider'}
                </ThemedText>
              </View>
              
              <View style={styles.providerRow}>
                <Ionicons name={experienceInfo.icon} size={16} color={experienceInfo.color} />
                <ThemedText style={[styles.providerText, { color: experienceInfo.color }]}>
                  {experienceInfo.text}
                </ThemedText>
              </View>

              {service.deliveryTime && (
                <View style={styles.providerRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <ThemedText style={styles.providerText}>
                    Delivery: {service.deliveryTime}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </ThemedCard>

        {/* Description Card */}
        <ThemedCard style={styles.descriptionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#7F5AF0" />
            <ThemedText style={styles.sectionTitle}>Service Description</ThemedText>
          </View>
          <Spacer height={12} />
          <ThemedText style={styles.description}>
            {service.description || 'No description provided.'}
          </ThemedText>
        </ThemedCard>

        {/* Skills Card */}
        {service.skills && (
          <ThemedCard style={styles.skillsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="code-slash-outline" size={20} color="#7F5AF0" />
              <ThemedText style={styles.sectionTitle}>Skills & Expertise</ThemedText>
            </View>
            <Spacer height={12} />
            <View style={styles.skillsContainer}>
              {service.skills.split(',').map((skill, index) => (
                <View key={`skill-${index}`} style={styles.skillTag}>
                  <ThemedText style={styles.skillText}>
                    {skill.trim()}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedCard>
        )}

        {/* Service Details Card */}
        <ThemedCard style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#7F5AF0" />
            <ThemedText style={styles.sectionTitle}>Service Details</ThemedText>
          </View>
          <Spacer height={12} />
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Category:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {getCategoryDisplayName(service.category)}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Experience Level:</ThemedText>
            <ThemedText style={[styles.detailValue, { color: experienceInfo.color }]}>
              {experienceInfo.text}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Hourly Rate:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {getHourlyRate(service)}
            </ThemedText>
          </View>
          
          {service.deliveryTime && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Delivery Time:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {service.deliveryTime}
              </ThemedText>
            </View>
          )}

          {service.$createdAt && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Posted:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {new Date(service.$createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
          )}
        </ThemedCard>

        {/* Reviews Section */}
        <ReviewSummary serviceId={id} />
        
        {serviceReviews.length > 0 && (
          <ThemedCard style={styles.reviewsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color="#7F5AF0" />
              <ThemedText style={styles.sectionTitle}>Customer Reviews</ThemedText>
            </View>
            <Spacer height={12} />
            
            {serviceReviews.slice(0, 3).map((review) => (
              <ReviewCard 
                key={review.$id} 
                review={review}
                showServiceTitle={false}
              />
            ))}
            
            {serviceReviews.length > 3 && (
              <Pressable style={styles.viewAllReviews}>
                <ThemedText style={styles.viewAllText}>
                  View all {serviceReviews.length} reviews
                </ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#7F5AF0" />
              </Pressable>
            )}
          </ThemedCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isOwner ? (
            <>
              <ThemedText style={styles.ownerNote}>
                This is your service listing
              </ThemedText>
              <Spacer height={16} />
              <Pressable 
                onPress={handleDelete} 
                style={({ pressed }) => [
                  styles.deleteButton, 
                  pressed ? styles.deleteButtonPressed : styles.deleteButtonNotPressed
                ]}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete Service</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Show contact button only if service has userId */}
              {service.userId ? (
                <>
                  <ThemedButton 
                    style={styles.bookButton}
                    onPress={() => setShowBookingModal(true)}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons name="calendar-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Book Service</Text>
                    </View>
                  </ThemedButton>

                  <ThemedButton 
                    style={styles.contactButton}
                    onPress={handleContactProvider}
                    disabled={contacting}
                  >
                    <View style={styles.buttonContent}>
                      {contacting ? (
                        <Ionicons name="hourglass-outline" size={18} color="#fff" />
                      ) : (
                        <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                      )}
                      <Text style={styles.buttonText}>
                        {contacting ? 'Starting Conversation...' : 'Contact Provider'}
                      </Text>
                    </View>
                  </ThemedButton>
                </>
              ) : (
                <View style={styles.noContactCard}>
                  <Ionicons name="alert-circle-outline" size={24} color="#FF9500" />
                  <ThemedText style={styles.noContactText}>
                    This service provider cannot be contacted directly.
                  </ThemedText>
                </View>
              )}
              
            </>
          )}
        </View>

        <Spacer height={40} />
      </ScrollView>
      
      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        service={service}
        onBookingSuccess={handleBookingSuccess}
      />
    </ThemedView>
  )
}

export default BookDetails

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    marginBottom: 16,
    padding: 20,
    borderLeftColor: '#7F5AF0',
    borderLeftWidth: 4,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  serviceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 30,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F5AF020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#7F5AF0',
    fontWeight: '600',
    marginLeft: 4,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceTag: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F5AF0',
    backgroundColor: '#7F5AF020',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    textAlign: 'center',
  },
  providerSection: {
    borderTopWidth: 1,
    borderTopColor: '#7F5AF020',
    paddingTop: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  providerDetails: {
    marginLeft: 32,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  providerText: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  descriptionCard: {
    marginBottom: 16,
    padding: 20,
  },
  skillsCard: {
    marginBottom: 16,
    padding: 20,
  },
  detailsCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#7F5AF020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#7F5AF0',
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#7F5AF010',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  actionSection: {
    alignItems: 'center',
  },
  bookButton: {
    width: '100%',
    marginBottom: 12,
    paddingVertical: 16,
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  ownerNote: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
  },
  contactButton: {
    width: '100%',
    marginBottom: 12,
    paddingVertical: 16,
    backgroundColor: '#7F5AF0',
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF950020',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  noContactText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 12,
    flex: 1,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#7F5AF0',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  favoriteText: {
    color: '#7F5AF0',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: 200,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  deleteButtonPressed: {
    opacity: 0.8,
  },
  deleteButtonNotPressed: {
    opacity: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorCard: {
    margin: 20,
    padding: 30,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  reviewsCard: {
    marginBottom: 16,
    padding: 20,
  },
  viewAllReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
  },
  viewAllText: {
    color: '#7F5AF0',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
})