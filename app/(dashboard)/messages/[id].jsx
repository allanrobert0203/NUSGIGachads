import { StyleSheet, FlatList, Pressable, View, TextInput, Alert, Keyboard } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMessaging } from '../../../hooks/useMessaging'
import { useUser } from '../../../hooks/useUser'
import { Colors } from '../../../constants/Colors'
import { useColorScheme } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import ThemedText from "../../../components/ThemedText"
import ThemedView from "../../../components/ThemedView"
import ThemedLoader from "../../../components/ThemedLoader"

const ConversationScreen = () => {
  const { id: conversationId } = useLocalSearchParams()
  const { 
    messages, 
    conversations, 
    fetchMessages, 
    sendMessage, 
    markMessagesAsRead, 
    getOtherParticipant 
  } = useMessaging()
  const { user } = useUser()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [lastSentMessage, setLastSentMessage] = useState('')
  const [lastSentTime, setLastSentTime] = useState(0)
  const flatListRef = useRef(null)

  const conversation = conversations.find(conv => conv.$id === conversationId)
  const conversationMessages = messages[conversationId] || []
  const otherParticipant = conversation ? getOtherParticipant(conversation) : null

  useEffect(() => {
    if (conversationId) {
      loadMessages()
      markMessagesAsRead(conversationId)
    }
  }, [conversationId])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (conversationMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [conversationMessages.length])

  const loadMessages = async () => {
    try {
      setLoading(true)
      console.log('📥 Loading messages for conversation:', conversationId)
      await fetchMessages(conversationId)
      console.log('📥 Messages loaded, count:', conversationMessages.length)
    } catch (error) {
      console.error('Error loading messages:', error)
      Alert.alert('Error', 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    const trimmedMessage = messageText.trim()
    const now = Date.now()
    
    // Prevent sending if already sending, empty message, or duplicate within 1 second
    if (!trimmedMessage || sending || 
        (trimmedMessage === lastSentMessage && now - lastSentTime < 1000)) {
      console.log('🚫 Message send blocked:', {
        empty: !trimmedMessage,
        sending,
        duplicate: trimmedMessage === lastSentMessage && now - lastSentTime < 1000
      })
      return
    }

    console.log('📤 Sending message:', trimmedMessage)
    setMessageText('')
    setSending(true)
    setLastSentMessage(trimmedMessage)
    setLastSentTime(now)

    try {
      const sentMessage = await sendMessage(conversationId, trimmedMessage)
      console.log('✅ Message sent successfully:', sentMessage.$id)
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message: ' + error.message)
      setMessageText(trimmedMessage) // Restore message text on error
    } finally {
      setSending(false)
    }
  }


  const formatMessageTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === user.$id
    const previousMessage = index > 0 ? conversationMessages[index - 1] : null
    const showDateSeparator = !previousMessage || 
      new Date(item.sentAt || item.$createdAt).toDateString() !== new Date(previousMessage.sentAt || previousMessage.$createdAt).toDateString()

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <ThemedText style={styles.dateText}>
              {formatMessageDate(item.sentAt || item.$createdAt)}
            </ThemedText>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            <ThemedText style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </ThemedText>
            <ThemedText style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(item.sentAt || item.$createdAt)}
            </ThemedText>
          </View>
        </View>
      </View>
    )
  }

  const EmptyMessagesComponent = () => (
    <View style={styles.emptyMessages}>
      <Ionicons name="chatbubble-outline" size={64} color="#7F5AF0" />
      <ThemedText style={styles.emptyText}>
        Start your conversation
      </ThemedText>
      <ThemedText style={styles.emptySubtext}>
        Type a message below to begin chatting
      </ThemedText>
    </View>
  )

  if (loading) {
    return (
      <ThemedView style={styles.container} safe={true}>
        <ThemedLoader />
      </ThemedView>
    )
  }

  if (!conversation) {
    return (
      <ThemedView style={styles.container} safe={true}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <ThemedText style={styles.errorText}>Conversation not found</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container} safe={true}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#7F5AF0" />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.participantName}>
              {otherParticipant?.email?.split('@')[0] || 'Unknown User'}
            </ThemedText>
            {conversation.serviceTitle && (
              <ThemedText style={styles.serviceContext} numberOfLines={1}>
                Re: {conversation.serviceTitle}
              </ThemedText>
            )}
          </View>
        </View>

        <Pressable style={styles.headerAction}>
          <Ionicons name="information-circle-outline" size={24} color={theme.text} />
        </Pressable>
      </View>

      {/* Messages Area */}
      <View style={[styles.messagesArea, { backgroundColor: theme.background }]}>
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          keyExtractor={(item) => item.$id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesList,
            conversationMessages.length === 0 && styles.emptyMessagesList
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false })
            }, 100)
          }}
          ListEmptyComponent={EmptyMessagesComponent}
        />
      </View>

      {/* Message Input Area - Fixed at Bottom */}
      <View style={[styles.inputContainer, { backgroundColor: theme.navBackground }]}>
        <View style={[styles.inputRow, { backgroundColor: theme.uiBackground }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.messageInput, { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: messageText.trim() ? '#7F5AF0' : '#E0E0E0'
              }]}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary || '#999'}
              value={messageText}
              onChangeText={setMessageText}
              multiline={true}
              maxLength={1000}
              editable={!sending}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
          </View>
          
          <Pressable 
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) ? styles.sendButtonDisabled : styles.sendButtonEnabled
            ]}
            disabled={!messageText.trim() || sending}
          >
            <Ionicons 
              name={sending ? "hourglass-outline" : "send"} 
              size={24} 
              color="#FFFFFF" 
            />
          </Pressable>
        </View>
        
        {messageText.length > 800 && (
          <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
            {messageText.length}/1000
          </ThemedText>
        )}
      </View>
    </ThemedView>
  )
}

export default ConversationScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#7F5AF020',
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 60,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7F5AF020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#7F5AF0',
  },
  headerText: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceContext: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    color: '#7F5AF0',
  },
  headerAction: {
    padding: 8,
    borderRadius: 20,
  },
  messagesArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  messagesList: {
    paddingVertical: 12,
    paddingBottom: 120,
  },
  emptyMessagesList: {
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
    backgroundColor: '#7F5AF020',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 3,
    paddingHorizontal: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageBubble: {
    backgroundColor: '#7F5AF0',
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  myMessageTime: {
    color: '#fff',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#666',
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  startTypingButton: {
    backgroundColor: '#7F5AF0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  startTypingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#7F5AF020',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#7F5AF0',
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  messageInput: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    maxHeight: 100,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonEnabled: {
    backgroundColor: '#7F5AF0',
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  charCount: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#7F5AF0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})