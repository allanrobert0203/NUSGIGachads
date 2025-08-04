import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useReviews } from '../../hooks/useReviews'

import ThemedText from '../ThemedText'
import ThemedCard from '../ThemedCard'

const ReviewSummary = ({ serviceId }) => {
  const { getReviewStats } = useReviews()
  const stats = getReviewStats(serviceId) || { totalReviews: 0, averageRating: 0, ratingDistribution: {} }

  const renderStars = (rating, size = 16) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'}
        size={size}
        color={index < rating ? '#FFD700' : '#ccc'}
        style={{ marginRight: 1 }}
      />
    ))
  }

  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0
    
    return (
      <View key={rating} style={styles.ratingBarRow}>
        <ThemedText style={styles.ratingLabel}>{rating}</ThemedText>
        <Ionicons name="star" size={12} color="#FFD700" style={{ marginHorizontal: 4 }} />
        <View style={styles.ratingBarContainer}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <ThemedText style={styles.ratingCount}>({count})</ThemedText>
      </View>
    )
  }

  if (stats.totalReviews === 0) {
    return (
      <ThemedCard style={styles.summaryCard}>
        <View style={styles.noReviewsContainer}>
          <Ionicons name="star-outline" size={48} color="#ccc" />
          <ThemedText style={styles.noReviewsTitle}>No Reviews Yet</ThemedText>
          <ThemedText style={styles.noReviewsText}>
            Be the first to review this service!
          </ThemedText>
        </View>
      </ThemedCard>
    )
  }

  return (
    <ThemedCard style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.overallRating}>
          <ThemedText style={styles.averageRating}>
            {stats.averageRating}
          </ThemedText>
          <View style={styles.starsContainer}>
            {renderStars(stats.averageRating, 20)}
          </View>
          <ThemedText style={styles.totalReviews}>
            Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </View>

      <View style={styles.ratingBreakdown}>
        <ThemedText style={styles.breakdownTitle}>Rating Breakdown</ThemedText>
        {[5, 4, 3, 2, 1].map(rating => 
          renderRatingBar(rating, stats.ratingDistribution[rating], stats.totalReviews)
        )}
      </View>
    </ThemedCard>
  )
}

export default ReviewSummary

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftColor: '#FFD700',
    borderLeftWidth: 4,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noReviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  summaryHeader: {
    marginBottom: 20,
  },
  overallRating: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 14,
    opacity: 0.7,
  },
  ratingBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
    paddingTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 12,
    width: 12,
    textAlign: 'center',
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    opacity: 0.7,
    width: 30,
    textAlign: 'right',
  },
})