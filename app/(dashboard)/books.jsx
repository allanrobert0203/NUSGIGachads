import { StyleSheet, FlatList, Pressable, View, RefreshControl, Alert } from 'react-native'
import { useState, useCallback } from 'react'
import { useBooks } from '../../hooks/useBooks'
import { useUser } from '../../hooks/useUser'
import { Colors } from '../../constants/Colors'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import ThemedCard from "../../components/ThemedCard"

const Books = () => {
  const { books, fetchBooks, deleteBook } = useBooks()
  const { user } = useUser()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBooks()
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchBooks()
    } catch (error) {
      console.error('Error refreshing services:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleQuickDelete = async (serviceId, serviceTitle) => {
    Alert.alert(
      "Delete Service",
      `Are you sure you want to delete "${serviceTitle}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(serviceId)
              await deleteBook(serviceId)
            } catch (error) {
              console.error('Error deleting service:', error)
              Alert.alert('Error', 'Failed to delete service. Please try again.')
            } finally {
              setDeletingId(null)
            }
          }
        }
      ]
    )
  }

  // Helper function to get experience level display
  const getExperienceDisplay = (experience) => {
    switch (experience) {
      case 'beginner':
        return { text: 'Beginner', icon: 'star-outline', color: '#34C759' }
      case 'intermediate':
        return { text: 'Intermediate', icon: 'star-half-outline', color: '#FF9500' }
      case 'expert':
        return { text: 'Expert', icon: 'star', color: '#FF3B30' }
      default:
        return { text: 'Beginner', icon: 'star-outline', color: '#34C759' }
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

  const renderServiceCard = ({ item }) => {
    const experienceInfo = getExperienceDisplay(item.experience)
    const isDeleting = deletingId === item.$id

    return (
      <Pressable 
        onPress={() => router.push(`/books/${item.$id}`)}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed && styles.cardPressed
        ]}
      >
        <ThemedCard style={[styles.card, isDeleting && styles.cardDeleting]}>
          {/* Header Section */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <ThemedText style={styles.title} numberOfLines={2}>
                {item.title}
              </ThemedText>
              <View style={styles.categoryBadge}>
                <Ionicons name="folder-outline" size={12} color="#7F5AF0" />
                <ThemedText style={styles.categoryText}>
                  {getCategoryDisplayName(item.category)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.priceSection}>
              <ThemedText style={styles.priceTag}>
                {getHourlyRate(item)}
              </ThemedText>
            </View>
          </View>

          {/* Meta Information */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Ionicons name={experienceInfo.icon} size={14} color={experienceInfo.color} />
              <ThemedText style={[styles.metaText, { color: experienceInfo.color }]}>
                {experienceInfo.text}
              </ThemedText>
            </View>
            
            {item.deliveryTime && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <ThemedText style={styles.metaText}>
                  {item.deliveryTime}
                </ThemedText>
              </View>
            )}

            {item.$createdAt && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <ThemedText style={styles.metaText}>
                  {new Date(item.$createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Description Preview */}
          {item.description && (
            <ThemedText style={styles.description} numberOfLines={2}>
              {item.description}
            </ThemedText>
          )}

          {/* Skills Preview */}
          {item.skills && (
            <View style={styles.skillsPreview}>
              {item.skills.split(',').slice(0, 3).map((skill, index) => (
                <View key={`${item.$id}-skill-${index}`} style={styles.skillTag}>
                  <ThemedText style={styles.skillText}>
                    {skill.trim()}
                  </ThemedText>
                </View>
              ))}
              {item.skills.split(',').length > 3 && (
                <ThemedText style={styles.moreSkills}>
                  +{item.skills.split(',').length - 3} more
                </ThemedText>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Pressable 
              onPress={() => router.push(`/books/${item.$id}`)}
              style={styles.viewButton}
            >
              <Ionicons name="eye-outline" size={16} color="#7F5AF0" />
              <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
            </Pressable>

            <Pressable 
              onPress={(e) => {
                e.stopPropagation()
                handleQuickDelete(item.$id, item.title)
              }}
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Ionicons name="hourglass-outline" size={16} color="#FF6B6B" />
              ) : (
                <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
              )}
              <ThemedText style={styles.deleteButtonText}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusIndicator}>
            <View style={styles.activeStatus} />
            <ThemedText style={styles.statusText}>Active</ThemedText>
          </View>
        </ThemedCard>
      </Pressable>
    )
  }

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="briefcase-outline" size={80} color="#7F5AF0" style={styles.emptyIcon} />
      <ThemedText style={styles.emptyTitle}>No Services Yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Create your first service to start attracting clients and showcase your skills.
      </ThemedText>
      <Pressable 
        onPress={() => router.push('/create')}
        style={styles.createButton}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <ThemedText style={styles.createButtonText}>Create Your First Service</ThemedText>
      </Pressable>
    </View>
  )

  return (
    <ThemedView style={styles.container} safe={true}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.greeting}>
            Welcome back, {user?.email?.split('@')[0] || 'Freelancer'}!
          </ThemedText>
          <ThemedText title={true} style={styles.heading}>
            Your Services
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Manage and track your freelance services
          </ThemedText>
        </View>
        
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{books.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Active Services</ThemedText>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable 
          onPress={() => router.push('/create')}
          style={styles.quickActionButton}
        >
          <Ionicons name="add-circle" size={24} color="#7F5AF0" />
          <ThemedText style={styles.quickActionText}>New Service</ThemedText>
        </Pressable>
        
        <Pressable 
          onPress={() => router.push('/search')}
          style={styles.quickActionButton}
        >
          <Ionicons name="search" size={24} color="#7F5AF0" />
          <ThemedText style={styles.quickActionText}>Browse Services</ThemedText>
        </Pressable>
        
        <Pressable 
          onPress={onRefresh}
          style={styles.quickActionButton}
        >
          <Ionicons name="refresh" size={24} color="#7F5AF0" />
          <ThemedText style={styles.quickActionText}>Refresh</ThemedText>
        </Pressable>
      </View>

      {/* Services List */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.$id}
        renderItem={renderServiceCard}
        contentContainerStyle={[
          styles.list,
          books.length === 0 && styles.listEmpty
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
        ListEmptyComponent={EmptyState}
      />
    </ThemedView>
  )
}

export default Books

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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#7F5AF020',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#7F5AF010',
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 12,
    color: '#7F5AF0',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  cardPressable: {
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderLeftColor: '#7F5AF0',
    borderLeftWidth: 4,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  cardDeleting: {
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    lineHeight: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F5AF015',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    color: '#7F5AF0',
    fontWeight: '600',
    marginLeft: 3,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceTag: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7F5AF0',
    backgroundColor: '#7F5AF020',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  metaSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 12,
  },
  skillsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  skillTag: {
    backgroundColor: '#7F5AF015',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 11,
    color: '#7F5AF0',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF010',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#7F5AF010',
  },
  viewButtonText: {
    fontSize: 12,
    color: '#7F5AF0',
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF6B6B10',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '600',
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
  createButton: {
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
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
})