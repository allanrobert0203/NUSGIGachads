import { StyleSheet, FlatList, Pressable, View, RefreshControl, Alert } from 'react-native'
import { useState, useCallback } from 'react'
import { useBookings } from '../../hooks/useBookings'
import { useUser } from '../../hooks/useUser'
import { useMessaging } from '../../hooks/useMessaging'
import { useReviews } from '../../hooks/useReviews'
import { Colors } from '../../constants/Colors'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import ThemedCard from "../../components/ThemedCard"
import ThemedLoader from "../../components/ThemedLoader"
import CreateReviewModal from "../../components/reviews/CreateReviewModal"
import BookingAcceptanceModal from "../../components/booking/BookingAcceptanceModal"
import BookingConfirmationModal from "../../components/booking/BookingConfirmationModal"

const Orders = () => {
  const { userBookings, receivedBookings, fetchUserBookings, fetchReceivedBookings, updateBookingStatus, getBookingStats } = useBookings()
  const { createOrGetConversation } = useMessaging()
  const { userReviews, canUserReview } = useReviews()
  const { user } = useUser()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('my-orders') // 'my-orders' or 'received-orders'
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedBooking, setExpandedBooking] = useState(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null)
  const [acceptanceModalVisible, setAcceptanceModalVisible] = useState(false)
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false)
  const [selectedBookingForAcceptance, setSelectedBookingForAcceptance] = useState(null)
  const [selectedBookingForConfirmation, setSelectedBookingForConfirmation] = useState(null)

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserBookings()
      fetchReceivedBookings()
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchUserBookings()
      await fetchReceivedBookings()
    } catch (error) {
      console.error('Error refreshing bookings:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId)
      await updateBookingStatus(bookingId, newStatus)
      Alert.alert('Success', `Booking status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating booking status:', error)
      Alert.alert('Error', 'Failed to update booking status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAcceptBooking = (booking) => {
    setSelectedBookingForAcceptance(booking)
    setAcceptanceModalVisible(true)
  }

  const handleConfirmBooking = (booking) => {
    setSelectedBookingForConfirmation(booking)
    setConfirmationModalVisible(true)
  }

  const handleAcceptanceSubmit = async (acceptanceData) => {
    try {
      setUpdatingId(selectedBookingForAcceptance.$id)
      await updateBookingStatus(selectedBookingForAcceptance.$id, 'pending-buyer', {
        proposed_hours: acceptanceData.proposedHours,
        proposed_due_date: acceptanceData.proposedDueDate,
        proposed_total: acceptanceData.proposedTotal,
        provider_notes: acceptanceData.providerNotes
      })
      setAcceptanceModalVisible(false)
      setSelectedBookingForAcceptance(null)
      Alert.alert('Success', 'Booking proposal sent to client for confirmation')
    } catch (error) {
      console.error('Error accepting booking:', error)
      Alert.alert('Error', 'Failed to accept booking')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleConfirmationSubmit = async () => {
    try {
      setUpdatingId(selectedBookingForConfirmation.$id)
      await updateBookingStatus(selectedBookingForConfirmation.$id, 'confirmed')
      setConfirmationModalVisible(false)
      setSelectedBookingForConfirmation(null)
      Alert.alert('Success', 'Booking confirmed! Work can now begin.')
    } catch (error) {
      console.error('Error confirming booking:', error)
      Alert.alert('Error', 'Failed to confirm booking')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleMessageClient = async (booking) => {
    try {
      console.log('💬 Opening conversation with client for booking:', booking.$id)
      console.log('Client ID:', booking.clientId)
      console.log('Service ID:', booking.serviceId)
      console.log('Service Title:', booking.serviceTitle)
      
      // Create or get conversation with the client
      const conversation = await createOrGetConversation(
        booking.clientId,
        booking.serviceId,
        booking.serviceTitle
      )
      
      if (conversation && conversation.$id) {
        console.log('✅ Conversation ready, navigating to:', conversation.$id)
        router.push(`/messages/${conversation.$id}`)
      } else {
        throw new Error('Failed to create conversation')
      }
    } catch (error) {
      console.error('Error opening conversation:', error)
      Alert.alert('Error', 'Failed to open conversation: ' + error.message)
    }
  }

  const toggleBookingExpansion = (bookingId) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId)
  }

  const handleWriteReview = (booking) => {
    setSelectedBookingForReview(booking)
    setReviewModalVisible(true)
  }

  const handleReviewSubmitted = () => {
    setReviewModalVisible(false)
    setSelectedBookingForReview(null)
    // Refresh bookings to update any review-related state
    fetchUserBookings()
  }

  // Check if user has already reviewed this service from this booking
  const hasUserReviewedBooking = (booking) => {
    if (!userReviews || !booking.serviceId) return false
    return userReviews.some(review => 
      review.serviceId === booking.serviceId && 
      review.transactionId === booking.$id
    )
  }
  // Helper function to get status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
      case 'pending-freelancer':
        return { text: 'Pending Freelancer', icon: 'time-outline', color: '#FF9500' }
      case 'pending-freelancer':
        return { text: 'Pending Freelancer', icon: 'time-outline', color: '#FF9500' }
      case 'pending-buyer':
        return { text: 'Pending Confirmation', icon: 'hourglass-outline', color: '#007AFF' }
      case 'confirmed':
        return { text: 'Confirmed', icon: 'checkmark-circle-outline', color: '#007AFF' }
      case 'in-progress':
        return { text: 'In Progress', icon: 'play-circle-outline', color: '#7F5AF0' }
      case 'awaiting-review':
        return { text: 'Awaiting Review', icon: 'star-outline', color: '#FFD700' }
      case 'completed':
        return { text: 'Completed', icon: 'checkmark-circle', color: '#34C759' }
      case 'declined':
        return { text: 'Declined', icon: 'close-circle-outline', color: '#FF3B30' }
      case 'disputed':
        return { text: 'Disputed', icon: 'alert-triangle', color: '#FF3B30' }
      case 'cancelled':
        return { text: 'Cancelled', icon: 'close-circle-outline', color: '#FF3B30' }
      default:
        return { text: 'Unknown', icon: 'help-circle-outline', color: '#8E8E93' }
    }
  }

  const renderBookingCard = ({ item }) => {
    const statusInfo = getStatusDisplay(item.status)
    const isUpdating = updatingId === item.$id
    const isMyOrder = activeTab === 'my-orders'
    const isExpanded = expandedBooking === item.$id

    return (
      <Pressable 
        onPress={() => !isMyOrder && toggleBookingExpansion(item.$id)}
        disabled={isMyOrder}
      >
        <ThemedCard style={[styles.bookingCard, isUpdating && styles.cardUpdating]}>
        {/* Header Section */}
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <ThemedText style={styles.serviceTitle} numberOfLines={2}>
              {item.serviceTitle}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
              <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
              <ThemedText style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.priceSection}>
            <ThemedText style={styles.priceTag}>
              S${item.hourlyRate}/hr
            </ThemedText>
            <ThemedText style={styles.estimateText}>
              Est: S${item.totalEstimate || (item.hourlyRate * (item.estimatedHours || 1))}
            </ThemedText>
            {!isMyOrder && (
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#7F5AF0" 
                style={styles.expandIcon}
              />
            )}
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <ThemedText style={styles.detailText}>
              Due: {new Date(item.preferredStartDate).toLocaleDateString()}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <ThemedText style={styles.detailText}>
              {isMyOrder ? 'Provider' : 'Client'}: {isMyOrder ? 'Service Provider' : item.clientEmail?.split('@')[0]}
            </ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <ThemedText style={styles.detailText}>
              Estimated: {item.estimatedHours || 1} hour{(item.estimatedHours || 1) !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <ThemedText style={styles.detailText}>
              Booked: {new Date(item.$createdAt).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesSection}>
            <ThemedText style={styles.notesLabel}>Project Notes:</ThemedText>
            <ThemedText style={styles.notesText} numberOfLines={3}>
              {item.notes}
            </ThemedText>
          </View>
        )}

        {/* Actions for received bookings (service provider) */}
        {!isMyOrder && (item.status === 'pending' || item.status === 'pending-freelancer') && (
          <View style={styles.actionSection}>
            <Pressable 
              onPress={() => handleMessageClient(item)}
              style={[styles.actionButton, styles.discussButton]}
              disabled={isUpdating}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Discuss</ThemedText>
            </Pressable>

            <Pressable 
              onPress={() => handleAcceptBooking(item)}
              style={[styles.actionButton, styles.confirmButton]}
              disabled={isUpdating}
            >
              <Ionicons name="checkmark-outline" size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
            </Pressable>

            <Pressable 
              onPress={() => handleStatusUpdate(item.$id, 'declined')}
              style={[styles.actionButton, styles.cancelButton]}
              disabled={isUpdating}
            >
              <Ionicons name="close-outline" size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Decline</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Actions for confirmed bookings */}
        {!isMyOrder && item.status === 'confirmed' && (
          <View style={styles.actionSection}>
            <Pressable 
              onPress={() => handleMessageClient(item)}
              style={[styles.actionButton, styles.discussButton]}
              disabled={isUpdating}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Discuss</ThemedText>
            </Pressable>

            <Pressable 
              onPress={() => handleStatusUpdate(item.$id, 'awaiting-review')}
              style={[styles.actionButton, styles.completeButton]}
              disabled={isUpdating}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <ThemedText style={styles.actionButtonText}>Mark Complete</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Confirm booking button for pending-buyer status */}
        {isMyOrder && item.status === 'pending-buyer' && (
          <View style={styles.confirmationSection}>
            <View style={styles.proposalDetails}>
              <ThemedText style={styles.proposalTitle}>Freelancer's Proposal:</ThemedText>
              <View style={styles.proposalRow}>
                <ThemedText style={styles.proposalLabel}>Hours:</ThemedText>
                <ThemedText style={styles.proposalValue}>{item.proposed_hours || 'Not specified'}</ThemedText>
              </View>
              <View style={styles.proposalRow}>
                <ThemedText style={styles.proposalLabel}>Due Date:</ThemedText>
                <ThemedText style={styles.proposalValue}>
                  {item.proposed_due_date ? new Date(item.proposed_due_date).toLocaleDateString() : 'Not specified'}
                </ThemedText>
              </View>
              <View style={styles.proposalRow}>
                <ThemedText style={styles.proposalLabel}>Total:</ThemedText>
                <ThemedText style={[styles.proposalValue, styles.proposalTotal]}>
                  S${item.proposed_total || 'TBD'}
                </ThemedText>
              </View>
              {item.provider_notes && (
                <View style={styles.proposalNotesSection}>
                  <ThemedText style={styles.proposalLabel}>Provider Notes:</ThemedText>
                  <ThemedText style={styles.proposalNotes}>{item.provider_notes}</ThemedText>
                </View>
              )}
            </View>
            <Pressable 
              onPress={() => handleConfirmBooking(item)}
              style={styles.confirmBookingButton}
              disabled={isUpdating}
            >
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <ThemedText style={styles.confirmBookingText}>Confirm Booking</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Review/Dispute options for awaiting-review status */}
        {isMyOrder && item.status === 'awaiting-review' && !hasUserReviewedBooking(item) && (
          <View style={styles.reviewSection}>
            <ThemedText style={styles.completionNotice}>
              Freelancer marked this job as completed. Please review:
            </ThemedText>
            <View style={styles.completionActions}>
              <Pressable 
                onPress={() => handleWriteReview(item)}
                style={styles.approveReviewButton}
              >
                <Ionicons name="star-outline" size={16} color="#fff" />
                <ThemedText style={styles.approveReviewText}>Approve & Review</ThemedText>
              </Pressable>
              
              <Pressable 
                onPress={() => handleStatusUpdate(item.$id, 'disputed')}
                style={styles.disputeButton}
                disabled={isUpdating}
              >
                <Ionicons name="alert-triangle" size={16} color="#fff" />
                <ThemedText style={styles.disputeText}>Dispute</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        {/* Review button for completed bookings (My Orders only) */}
        {isMyOrder && item.status === 'completed' && !hasUserReviewedBooking(item) && (
          <View style={styles.reviewSection}>
            <Pressable 
              onPress={() => handleWriteReview(item)}
              style={styles.reviewButton}
            >
              <Ionicons name="star-outline" size={16} color="#FFD700" />
              <ThemedText style={styles.reviewButtonText}>Write Review</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Show if already reviewed */}
        {isMyOrder && item.status === 'completed' && hasUserReviewedBooking(item) && (
          <View style={styles.reviewedSection}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <ThemedText style={styles.reviewedText}>Review submitted</ThemedText>
          </View>
        )}
      </ThemedCard>
      </Pressable>
    )
  }

  const EmptyState = ({ isMyOrders }) => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={isMyOrders ? "receipt-outline" : "briefcase-outline"} 
        size={80} 
        color="#7F5AF0" 
        style={styles.emptyIcon} 
      />
      <ThemedText style={styles.emptyTitle}>
        {isMyOrders ? 'No Orders Yet' : 'No Booking Requests'}
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {isMyOrders 
          ? 'Browse services and make your first booking to get started.'
          : 'When clients book your services, they will appear here.'
        }
      </ThemedText>
      {isMyOrders && (
        <Pressable 
          onPress={() => router.push('/search')}
          style={styles.browseButton}
        >
          <Ionicons name="search-outline" size={20} color="#fff" />
          <ThemedText style={styles.browseButtonText}>Browse Services</ThemedText>
        </Pressable>
      )}
    </View>
  )

  const stats = getBookingStats()
  const currentData = activeTab === 'my-orders' ? userBookings : receivedBookings

  return (
    <ThemedView style={styles.container} safe={true}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.greeting}>
            Order Management
          </ThemedText>
          <ThemedText title={true} style={styles.heading}>
            Your Bookings
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Track and manage your service bookings
          </ThemedText>
        </View>
        
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.total}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Orders</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.pending}</ThemedText>
            <ThemedText style={styles.statLabel}>Pending</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.completed}</ThemedText>
            <ThemedText style={styles.statLabel}>Completed</ThemedText>
          </View>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <Pressable 
          onPress={() => setActiveTab('my-orders')}
          style={[styles.tab, activeTab === 'my-orders' && styles.activeTab]}
        >
          <Ionicons 
            name="receipt-outline" 
            size={20} 
            color={activeTab === 'my-orders' ? '#7F5AF0' : '#666'} 
          />
          <ThemedText style={[styles.tabText, activeTab === 'my-orders' && styles.activeTabText]}>
            My Orders ({userBookings.length})
          </ThemedText>
        </Pressable>

        <Pressable 
          onPress={() => setActiveTab('received-orders')}
          style={[styles.tab, activeTab === 'received-orders' && styles.activeTab]}
        >
          <Ionicons 
            name="briefcase-outline" 
            size={20} 
            color={activeTab === 'received-orders' ? '#7F5AF0' : '#666'} 
          />
          <ThemedText style={[styles.tabText, activeTab === 'received-orders' && styles.activeTabText]}>
            Requests ({receivedBookings.length})
          </ThemedText>
        </Pressable>
      </View>

      {/* Orders List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.$id}
        renderItem={renderBookingCard}
        contentContainerStyle={[
          styles.list,
          currentData.length === 0 && styles.listEmpty
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7F5AF0']}
            tintColor="#7F5AF0"
          />
        }
        ListEmptyComponent={<EmptyState isMyOrders={activeTab === 'my-orders'} />}
      />
      
      {/* Review Modal */}
      {selectedBookingForReview && (
        <CreateReviewModal
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false)
            setSelectedBookingForReview(null)
          }}
          serviceId={selectedBookingForReview.serviceId}
          serviceProviderId={selectedBookingForReview.serviceProviderId}
          serviceTitle={selectedBookingForReview.serviceTitle}
          transactionId={selectedBookingForReview.$id}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      
      {/* Booking Acceptance Modal */}
      {selectedBookingForAcceptance && (
        <BookingAcceptanceModal
          visible={acceptanceModalVisible}
          onClose={() => {
            setAcceptanceModalVisible(false)
            setSelectedBookingForAcceptance(null)
          }}
          booking={selectedBookingForAcceptance}
          onAcceptanceSubmit={handleAcceptanceSubmit}
        />
      )}
      
      {/* Booking Confirmation Modal */}
      {selectedBookingForConfirmation && (
        <BookingConfirmationModal
          visible={confirmationModalVisible}
          onClose={() => {
            setConfirmationModalVisible(false)
            setSelectedBookingForConfirmation(null)
          }}
          booking={selectedBookingForConfirmation}
          onConfirmationSubmit={handleConfirmationSubmit}
        />
      )}
    </ThemedView>
  )
}

export default Orders

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#7F5AF020',
  },
  headerContent: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7F5AF0',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#7F5AF020',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#7F5AF020',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: '#666',
  },
  activeTabText: {
    color: '#7F5AF0',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  bookingCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderLeftColor: '#7F5AF0',
    borderLeftWidth: 4,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardUpdating: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceTag: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7F5AF0',
  },
  estimateText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  expandIcon: {
    marginTop: 4,
  },
  detailsSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.8,
  },
  notesSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  notesText: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  discussButton: {
    backgroundColor: '#7F5AF0',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  completeButton: {
    backgroundColor: '#7F5AF0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  contactSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
    alignItems: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#7F5AF020',
  },
  contactButtonText: {
    color: '#7F5AF0',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F5AF0',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reviewSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
    alignItems: 'center',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  reviewButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  reviewedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
  },
  reviewedText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  confirmationSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
  },
  proposalDetails: {
    backgroundColor: '#007AFF10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  proposalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  proposalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  proposalLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  proposalValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  proposalTotal: {
    color: '#007AFF',
    fontSize: 14,
  },
  proposalNotesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#007AFF20',
  },
  proposalNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  confirmBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmBookingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  completionNotice: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
    color: '#FFD700',
  },
  completionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  approveReviewText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  disputeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
})