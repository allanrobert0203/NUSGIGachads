import { createContext, useEffect, useState } from "react"
import { databases, client, DATABASE_CONFIG, handleAppwriteError } from "../lib/appwrite"
import { ID, Permission, Query, Role } from "react-native-appwrite"
import { useUser } from "../hooks/useUser"

export const MessagingContext = createContext()

export function MessagingProvider({ children }) {
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState({})
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

  // Test messaging database connection
  async function testMessagingConnection() {
    try {
      console.log('🧪 Testing messaging database connection...')
      console.log('Database ID:', DATABASE_CONFIG.DATABASE_ID)
      console.log('Conversations Collection ID:', DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID)
      console.log('Messages Collection ID:', DATABASE_CONFIG.MESSAGES_COLLECTION_ID)
      
      if (!user) {
        console.log('⚠️ No user authenticated for messaging test')
        return false
      }
      
      // Test conversations collection
      await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID,
        [Query.limit(1)]
      )
      
      // Test messages collection
      await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.MESSAGES_COLLECTION_ID,
        [Query.limit(1)]
      )
      
      console.log('✅ Messaging database connection successful!')
      return true
    } catch (error) {
      console.error('❌ Messaging database connection failed:', error.message)
      
      try {
        await handleAuthError(error)
        // If we get here, auth was refreshed, try again
        return await testMessagingConnection()
      } catch (authError) {
        console.error('❌ Messaging auth handling failed:', authError.message)
        return false
      }
    }
  }

  // Fetch user's conversations
  async function fetchConversations() {
    if (!user) {
      console.log('⚠️ No user authenticated for conversations')
      setConversations([])
      return []
    }

    try {
      setLoading(true)
      console.log('💬 Fetching conversations for user:', user.$id)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('participant1Id', user.$id),
            Query.equal('participant2Id', user.$id)
          ]),
          Query.orderDesc('lastMessageAt')
        ]
      )

      console.log('✅ Successfully fetched conversations:', response.documents.length)
      setConversations(response.documents)
      return response.documents
    } catch (error) {
      console.error('❌ Error fetching conversations:', error)
      
      try {
        await handleAuthError(error)
        // If auth was refreshed, try again
        return await fetchConversations()
      } catch (authError) {
        console.error('❌ Final error in fetchConversations:', authError.message)
        setConversations([])
        throw authError
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages for a specific conversation
  async function fetchMessages(conversationId) {
    try {
      if (!user) {
        throw new Error('Authentication required to fetch messages')
      }

      console.log('💬 Fetching messages for conversation:', conversationId)
      console.log('💬 Current user:', user.$id)
      
      const response = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.MESSAGES_COLLECTION_ID,
        [
          Query.equal('conversationId', conversationId),
          Query.orderAsc('$createdAt'),
          Query.limit(100)
        ]
      )

      console.log('✅ Successfully fetched messages:', response.documents.length)
      console.log('✅ Messages data:', response.documents)
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: response.documents
      }))

      return response.documents
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      
      try {
        await handleAuthError(error)
        // If auth was refreshed, try again
        console.log('🔄 Retrying fetchMessages after auth refresh...')
        return await fetchMessages(conversationId)
      } catch (authError) {
        console.error('❌ Final error in fetchMessages:', authError.message)
        throw authError
      }
    }
  }

  // Create or get existing conversation
  async function createOrGetConversation(otherUserId, serviceId = null, serviceTitle = null) {
    console.log('=== CREATE OR GET CONVERSATION START ===')
    console.log('Current user:', user?.$id)
    console.log('Other user ID:', otherUserId)
    console.log('Service ID:', serviceId)
    console.log('Service title:', serviceTitle)

    if (!user || !otherUserId) {
      const error = new Error('Both users must be specified and authenticated')
      console.error('❌ Validation failed:', error.message)
      throw error
    }

    if (user.$id === otherUserId) {
      const error = new Error('Cannot create conversation with yourself')
      console.error('❌ Self-conversation attempt:', error.message)
      throw error
    }

    try {
      console.log('💬 Step 1: Checking for existing conversation...')
      
      // First, check if conversation already exists
      const existingConversations = await databases.listDocuments(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID,
        [
          Query.or([
            Query.and([
              Query.equal('participant1Id', user.$id),
              Query.equal('participant2Id', otherUserId)
            ]),
            Query.and([
              Query.equal('participant1Id', otherUserId),
              Query.equal('participant2Id', user.$id)
            ])
          ])
        ]
      )

      console.log('💬 Step 2: Existing conversations check complete')
      console.log('Found existing conversations:', existingConversations.documents.length)
      
      if (existingConversations.documents.length > 0) {
        const existingConversation = existingConversations.documents[0]
        console.log('✅ Found existing conversation:', existingConversation.$id)
        return existingConversation
      }

      // Create new conversation
      console.log('💬 Step 3: Creating new conversation...')
      const conversationData = {
        participant1Id: user.$id,
        participant2Id: otherUserId,
        participant1Email: user.email,
        participant2Email: 'Unknown User',
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        serviceId: serviceId || null,
        serviceTitle: serviceTitle || null,
        unreadCount1: 0,
        unreadCount2: 0,
      }

      console.log('💬 Step 4: Conversation data prepared:', JSON.stringify(conversationData, null, 2))
      
      console.log('💬 Step 5: Calling databases.createDocument...')
      const response = await databases.createDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID,
        ID.unique(),
        conversationData,
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      )

      console.log('💬 Step 6: Database response received')
      console.log('Response type:', typeof response)
      console.log('Response is null/undefined:', response == null)
      console.log('Full response:', JSON.stringify(response, null, 2))
      
      if (!response) {
        const error = new Error('Database returned null/undefined response')
        console.error('❌ Null response error:', error.message)
        throw error
      }
      
      if (!response.$id) {
        const error = new Error(`Database response missing $id property. Response: ${JSON.stringify(response)}`)
        console.error('❌ Missing $id error:', error.message)
        throw error
      }
      
      console.log('✅ Created new conversation successfully:', response.$id)
      
      // Update local state
      setConversations(prev => [response, ...prev])
      
      console.log('=== CREATE OR GET CONVERSATION SUCCESS ===')
      return response
      
    } catch (error) {
      console.error('=== CREATE OR GET CONVERSATION ERROR ===')
      console.error('Error type:', typeof error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Error type property:', error.type)
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      
      try {
        await handleAuthError(error)
        // If auth was refreshed, try again
        console.log('🔄 Retrying conversation creation after auth refresh...')
        return await createOrGetConversation(otherUserId, serviceId, serviceTitle)
      } catch (authError) {
        console.error('❌ Final error in createOrGetConversation:', authError.message)
        throw authError
      }
    }
  }

  // Send a message
  async function sendMessage(conversationId, content, messageType = 'text') {
    const trimmedContent = content.trim()
    
    if (!user || !conversationId || !content.trim()) {
      console.log('🚫 sendMessage validation failed:', {
        hasUser: !!user,
        hasConversationId: !!conversationId,
        hasContent: !!trimmedContent
      })
      throw new Error('Invalid message data or authentication required')
    }

    try {
      console.log('💬 Sending message to conversation:', conversationId)
      console.log('💬 Message content:', trimmedContent)
      console.log('💬 Sender ID:', user.$id)

      const messageData = {
        conversationId,
        senderId: user.$id,
        senderEmail: user.email,
        content: trimmedContent,
        messageType,
        isRead: false,
        sentAt: new Date().toISOString()
      }

      console.log('💬 Creating message document...')
      
      const response = await databases.createDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData,
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      )

      console.log('✅ Message sent successfully:', response.$id)
      
      // Update local messages state immediately
      setMessages(prev => {
        const currentMessages = prev[conversationId] || []
        // Check if message already exists to prevent duplicates
        const messageExists = currentMessages.some(msg => msg.$id === response.$id)
        if (messageExists) {
          console.log('⚠️ Message already exists in local state, skipping duplicate')
          return prev
        }
        
        return {
          ...prev,
          [conversationId]: [...currentMessages, response]
        }
      })

      await updateConversationLastMessage(conversationId, trimmedContent)
      return response
    } catch (error) {
      console.error('❌ Error sending message:', error)
      
      try {
        await handleAuthError(error)
        // If auth was refreshed, try again
        console.log('🔄 Retrying message send after auth refresh...')
        return await sendMessage(conversationId, content, messageType)
      } catch (authError) {
        console.error('❌ Final error in sendMessage:', authError.message)
        throw authError
      }
    }
  }

  // Update conversation's last message
  async function updateConversationLastMessage(conversationId, lastMessage) {
    try {
      if (!user) {
        throw new Error('Authentication required to update conversation')
      }

      await databases.updateDocument(
        DATABASE_CONFIG.DATABASE_ID,
        DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID,
        conversationId,
        {
          lastMessage: lastMessage.substring(0, 100),
          lastMessageAt: new Date().toISOString()
        }
      )

      setConversations(prev => 
        prev.map(conv => 
          conv.$id === conversationId 
            ? { ...conv, lastMessage, lastMessageAt: new Date().toISOString() }
            : conv
        )
      )
    } catch (error) {
      console.error('❌ Error updating conversation last message:', error)
    }
  }

  // Mark messages as read
  async function markMessagesAsRead(conversationId) {
    try {
      if (!user) {
        console.log('⚠️ No user authenticated for marking messages as read')
        return
      }

      const conversationMessages = messages[conversationId] || []
      const unreadMessages = conversationMessages.filter(
        msg => !msg.isRead && msg.senderId !== user.$id
      )

      for (const message of unreadMessages) {
        await databases.updateDocument(
          DATABASE_CONFIG.DATABASE_ID,
          DATABASE_CONFIG.MESSAGES_COLLECTION_ID,
          message.$id,
          { isRead: true }
        )
      }

      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg => 
          msg.senderId !== user.$id ? { ...msg, isRead: true } : msg
        )
      }))

      console.log('✅ Marked messages as read for conversation:', conversationId)
    } catch (error) {
      console.error('❌ Error marking messages as read:', error)
    }
  }

  // Get other participant info
  function getOtherParticipant(conversation) {
    if (!conversation || !user) return null
    
    return {
      id: conversation.participant1Id === user.$id ? conversation.participant2Id : conversation.participant1Id,
      email: conversation.participant1Id === user.$id ? conversation.participant2Email : conversation.participant1Email
    }
  }

  // Get unread count for current user
  function getUnreadCount(conversation) {
    if (!conversation || !user) return 0
    
    const conversationMessages = messages[conversation.$id] || []
    return conversationMessages.filter(
      msg => !msg.isRead && msg.senderId !== user.$id
    ).length
  }

  useEffect(() => {
    let unsubscribeConversations
    let unsubscribeMessages

    if (user) {
      console.log('👤 Setting up messaging for user:', user.$id)
      
      // Wait for user session to be fully established
      setTimeout(() => {
        testMessagingConnection().then(connectionOk => {
          if (connectionOk) {
            fetchConversations()
          } else {
            console.error('❌ Skipping fetchConversations due to connection failure')
          }
        })
      }, 1500) // Increased delay

      // Set up real-time subscriptions
      const conversationsChannel = `databases.${DATABASE_CONFIG.DATABASE_ID}.collections.${DATABASE_CONFIG.CONVERSATIONS_COLLECTION_ID}.documents`
      const messagesChannel = `databases.${DATABASE_CONFIG.DATABASE_ID}.collections.${DATABASE_CONFIG.MESSAGES_COLLECTION_ID}.documents`

      unsubscribeConversations = client.subscribe(conversationsChannel, (response) => {
        const { payload, events } = response
        console.log('🔄 Conversation real-time update:', events)

        if (events.some(event => event.includes("create"))) {
          setConversations(prev => {
            const exists = prev.some(conv => conv.$id === payload.$id)
            if (!exists && (payload.participant1Id === user.$id || payload.participant2Id === user.$id)) {
              return [payload, ...prev]
            }
            return prev
          })
        }

        if (events.some(event => event.includes("update"))) {
          setConversations(prev => 
            prev.map(conv => 
              conv.$id === payload.$id ? payload : conv
            )
          )
        }
      })

      unsubscribeMessages = client.subscribe(messagesChannel, (response) => {
        const { payload, events } = response
        console.log('🔄 Message real-time update:', events)

        if (events.some(event => event.includes("create"))) {
          setMessages(prev => ({
            ...prev,
            [payload.conversationId]: [...(prev[payload.conversationId] || []), payload]
          }))
        }
      })
    } else {
      console.log('👤 User not authenticated, clearing messaging data')
      setConversations([])
      setMessages({})
    }

    return () => {
      if (unsubscribeConversations) unsubscribeConversations()
      if (unsubscribeMessages) unsubscribeMessages()
    }
  }, [user])

  return (
    <MessagingContext.Provider value={{
      conversations,
      messages,
      loading,
      fetchConversations,
      fetchMessages,
      createOrGetConversation,
      sendMessage,
      markMessagesAsRead,
      getOtherParticipant,
      getUnreadCount,
      testMessagingConnection
    }}>
      {children}
    </MessagingContext.Provider>
  )
}