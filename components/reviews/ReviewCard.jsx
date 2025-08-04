import { View, StyleSheet, Pressable } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../../hooks/useUser'
import { useReviews } from '../../hooks/useReviews'

import ThemedText from '../ThemedText'
import ThemedCard from '../ThemedCard'

const ReviewCard = ({ review, showServiceTitle = false, onEdit, onDelete }) => {
  const { user } = useUser()
  const [showFullComment, setShowFullComment] = useState(false)
  
  const isOwnReview = user && review.reviewerId === user.$id
  const reviewDate = new Date(review.$createdAt).toLocaleDateString()
  const isUpdated = review.updatedAt && review.updatedAt !== review.createdAt

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color={index < rating ? '#FFD700' : '#ccc'}
        style={{ marginRight: 2 }}
      />
    ))
  }

  const truncateComment = (comment, maxLength = 150) => {
    if (!comment || comment.length <= maxLength) return comment
    return showFullComment ? comment : comment.substring(0, maxLength) + '...'
  }

  return (
    <ThemedCard style={styles.reviewCard}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#7F5AF0" />
          </View>
          <View style={styles.reviewerDetails}>
            <ThemedText style={styles.reviewerName}>
              {review.reviewerEmail?.split('@')[0] || 'Anonymous'}
            </ThemedText>
            <View style={styles.ratingContainer}>
              {renderStars(review.rating)}
              <ThemedText style={styles.ratingText}>
                {review.rating}/5
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.reviewMeta}>
          <ThemedText style={styles.reviewDate}>
            {reviewDate}
          </ThemedText>
          {review.isVerifiedPurchase && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <ThemedText style={styles.verifiedText}>Verified</ThemedText>
            </View>
          )}
          {isUpdated && (
            <ThemedText style={styles.updatedText}>
              (edited)
            </ThemedText>
          )}
        </View>
      </View>

      {/* Service Title (if shown) */}
      {showServiceTitle && review.serviceTitle && (
        <View style={styles.serviceInfo}>
          <Ionicons name="briefcase-outline" size={14} color="#7F5AF0" />
          <ThemedText style={styles.serviceTitle}>
            {review.serviceTitle}
          </ThemedText>
        </View>
      )}

      {/* Comment */}
      {review.comment && (
        <View style={styles.commentSection}>
          <ThemedText style={styles.comment}>
            {truncateComment(review.comment)}
          </ThemedText>
          {review.comment.length > 150 && (
            <Pressable onPress={() => setShowFullComment(!showFullComment)}>
              <ThemedText style={styles.showMoreText}>
                {showFullComment ? 'Show less' : 'Show more'}
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}

      {/* Actions (for own reviews) */}
      {isOwnReview && (onEdit || onDelete) && (
        <View style={styles.reviewActions}>
          {onEdit && (
            <Pressable onPress={() => onEdit(review)} style={styles.actionButton}>
              <Ionicons name="create-outline" size={16} color="#7F5AF0" />
              <ThemedText style={styles.actionText}>Edit</ThemedText>
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={() => onDelete(review)} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
              <ThemedText style={[styles.actionText, { color: '#FF6B6B' }]}>Delete</ThemedText>
            </Pressable>
          )}
        </View>
      )}
    </ThemedCard>
  )
}

export default ReviewCard

const styles = StyleSheet.create({
  reviewCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftColor: '#FFD700',
    borderLeftWidth: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7F5AF020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.8,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C75920',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  verifiedText: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '600',
    marginLeft: 2,
  },
  updatedText: {
    fontSize: 10,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#7F5AF010',
    borderRadius: 8,
  },
  serviceTitle: {
    fontSize: 12,
    color: '#7F5AF0',
    fontWeight: '500',
    marginLeft: 4,
  },
  commentSection: {
    marginBottom: 12,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  showMoreText: {
    fontSize: 12,
    color: '#7F5AF0',
    fontWeight: '600',
    marginTop: 4,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#7F5AF0',
  },
})