import { View, StyleSheet, Modal, TextInput, Pressable, Alert } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'
import { useReviews } from '../../hooks/useReviews'

import ThemedText from '../ThemedText'
import ThemedView from '../ThemedView'
import ThemedButton from '../ThemedButton'

const CreateReviewModal = ({ 
  visible, 
  onClose, 
  serviceId, 
  serviceProviderId, 
  serviceTitle,
  transactionId = null,
  existingReview = null,
  onReviewSubmitted
}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const { createReview, updateReview } = useReviews()

  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!existingReview

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating')
      return
    }

    try {
      setSubmitting(true)

      if (isEditing) {
        await updateReview(existingReview.$id, {
          rating,
          comment: comment.trim()
        })
        Alert.alert('Success', 'Your review has been updated!')
      } else {
        await createReview({
          serviceId,
          serviceProviderId,
          rating,
          comment: comment.trim(),
          transactionId
        })
        Alert.alert('Success', 'Thank you for your review!')
      }

      if (onReviewSubmitted) {
        onReviewSubmitted()
      } else {
        onClose()
      }
      setRating(0)
      setComment('')
    } catch (error) {
      console.error('Error submitting review:', error)
      Alert.alert('Error', error.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStarRating = () => {
    return (
      <View style={styles.starRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </Pressable>
        ))}
      </View>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isEditing ? 'Edit Review' : 'Write a Review'}
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Service Info */}
          <View style={styles.serviceInfo}>
            <Ionicons name="briefcase-outline" size={20} color="#7F5AF0" />
            <ThemedText style={styles.serviceTitle} numberOfLines={2}>
              {serviceTitle}
            </ThemedText>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Your Rating *</ThemedText>
            {renderStarRating()}
            <ThemedText style={styles.ratingText}>
              {rating === 0 ? 'Tap to rate' : 
               rating === 1 ? 'Poor' :
               rating === 2 ? 'Fair' :
               rating === 3 ? 'Good' :
               rating === 4 ? 'Very Good' : 'Excellent'}
            </ThemedText>
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Your Review (Optional)</ThemedText>
            <TextInput
              style={[styles.commentInput, { 
                backgroundColor: theme.uiBackground,
                color: theme.text,
                borderColor: '#7F5AF0'
              }]}
              placeholder="Share your experience with this service (optional)..."
              placeholderTextColor={theme.textSecondary}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <ThemedText style={styles.charCount}>
              {comment.length}/1000 characters
            </ThemedText>
          </View>

          {/* Verification Notice */}
          {transactionId && (
            <View style={styles.verificationNotice}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <ThemedText style={styles.verificationText}>
                This review will be marked as a verified purchase
              </ThemedText>
            </View>
          )}

          {/* Submit Button */}
          <ThemedButton 
            onPress={handleSubmit} 
            disabled={submitting || rating === 0}
            style={[styles.submitButton, (submitting || rating === 0) && styles.submitButtonDisabled]}
          >
            <ThemedText style={styles.submitButtonText}>
              {submitting ? 
                (isEditing ? 'Updating Review...' : 'Submitting Review...') : 
                (isEditing ? 'Update Review' : 'Submit Review')
              }
            </ThemedText>
          </ThemedButton>
        </View>
      </ThemedView>
    </Modal>
  )
}

export default CreateReviewModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#7F5AF020',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F5AF010',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
  },
  verificationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C75920',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  verificationText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
    marginLeft: 8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})