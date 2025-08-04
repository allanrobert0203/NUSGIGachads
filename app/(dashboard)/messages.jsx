import { StyleSheet, FlatList, Pressable, View, RefreshControl, Alert } from 'react-native'
import { useState, useCallback } from 'react'
import { useMessaging } from '../../hooks/useMessaging'
import { useUser } from '../../hooks/useUser'
import { Colors } from '../../constants/Colors'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'

import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import ThemedCard from "../../components/ThemedCard"
import ThemedLoader from "../../components/ThemedLoader"

const Messages = () => {
  const { conversations, loading, fetchConversations, getOtherParticipant, getUnreadCount } = useMessaging()
  const { user } = useUser()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations()
    }, [])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchConversations()
    } catch (error) {
      console.error('Error refreshing conversations:', error)
      Alert.alert('Error', 'Failed to refresh conversations')
    } finally {
      setRefreshing(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderConversationCard = ({ item }) => {
    const otherParticipant = getOtherParticipant(item)
    const unreadCount = getUnreadCount(item)
    const hasUnread = unreadCount > 0

    return (
      <Pressable 
        onPress={() => router.push(`/messages/${item.$id}`)}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed && styles.cardPressed
        ]}
      >
        <ThemedCard style={[styles.conversationCard, hasUnread && styles.unreadCard]}>
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={[styles.avatar, hasUnread && styles.avatarUnread]}>
              <Ionicons 
                name="person" 
                size={24} 
                color={hasUnread ? '#fff' : '#7F5AF0'} 
              />
            </View>

            {/* Conversation Info */}
            <View style={styles.conversationInfo}>
              <View style={styles.headerRow}>
                <ThemedText style={[styles.participantName, hasUnread && styles.unreadText]} numberOfLines={1}>
                  {otherParticipant?.email?.split('@')[0] || 'Unknown User'}
                </ThemedText>
                <ThemedText style={styles.timeText}>
                  {formatTime(item.lastMessageAt)}
                </ThemedText>
              </View>

              {/* Service Context */}
              {item.serviceTitle && (
                <View style={styles.serviceContext}>
                  <Ionicons name="briefcase-outline" size={12} color="#7F5AF0" />
                  <ThemedText style={styles.serviceTitle} numberOfLines={1}>
                    {item.serviceTitle}
                  </ThemedText>
                </View>
              )}

              {/* Last Message */}
              <ThemedText 
                style={[styles.lastMessage, hasUnread && styles.unreadText]} 
                numberOfLines={2}
              >
                {item.lastMessage || 'No messages yet'}
              </ThemedText>
            </View>

            {/* Unread Badge */}
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <ThemedText style={styles.unreadCount}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Status Indicator */}
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, hasUnread ? styles.statusActive : styles.statusInactive]} />
          </View>
        </ThemedCard>
      </Pressable>
    )
  }

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#7F5AF0" style={styles.emptyIcon} />
      <ThemedText style={styles.emptyTitle}>No Conversations Yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Start messaging by contacting service providers or browse available services.
      </ThemedText>
      <Pressable 
        onPress={() => router.push('/search')}
        style={styles.browseButton}
      >
        <Ionicons name="search-outline" size={20} color="#fff" />
        <ThemedText style={styles.browseButtonText}>Browse Services</ThemedText>
      </Pressable>
    </View>
  )

  if (loading && conversations.length === 0) {
    return (
      <ThemedView style={styles.container} safe={true}>
        <ThemedLoader />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container} safe={true}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.greeting}>
            Messages
          </ThemedText>
          <ThemedText title={true} style={styles.heading}>
            Your Conversations
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Connect with clients and service providers
          </ThemedText>
        </View>
        
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{conversations.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Conversations</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {conversations.reduce((total, conv) => total + getUnreadCount(conv), 0)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Unread</ThemedText>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable 
          onPress={() => router.push('/search')}
          style={styles.quickActionButton}
        >
          <Ionicons name="search" size={24} color="#7F5AF0" />
          <ThemedText style={styles.quickActionText}>Find Services</ThemedText>
        </Pressable>
        
        <Pressable 
          onPress={onRefresh}
          style={styles.quickActionButton}
        >
          <Ionicons name="refresh" size={24} color="#7F5AF0" />
          <ThemedText style={styles.quickActionText}>Refresh</ThemedText>
        </Pressable>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.$id}
        renderItem={renderConversationCard}
        contentContainerStyle={[
          styles.list,
          conversations.length === 0 && styles.listEmpty
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

export default Messages

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
    minWidth: 100,
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
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  conversationCard: {
    padding: 16,
    borderRadius: 16,
    borderLeftColor: '#7F5AF0',
    borderLeftWidth: 3,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7F5AF020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarUnread: {
    backgroundColor: '#7F5AF0',
  },
  conversationInfo: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  serviceContext: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: 12,
    color: '#7F5AF0',
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 18,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusInactive: {
    backgroundColor: '#8E8E93',
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
})