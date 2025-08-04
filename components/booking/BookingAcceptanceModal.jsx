import { View, StyleSheet, Modal, TextInput, Pressable, Alert, ScrollView } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'

import ThemedText from '../ThemedText'
import ThemedView from '../ThemedView'
import ThemedButton from '../ThemedButton'
import ThemedCard from '../ThemedCard'

const BookingAcceptanceModal = ({ 
  visible, 
  onClose, 
  booking,
  onAcceptanceSubmit
}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const [proposedHours, setProposedHours] = useState(booking?.estimatedHours?.toString() || '1')
  const [proposedDueDate, setProposedDueDate] = useState('')
  const [providerNotes, setProviderNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Generate next 30 days for date selection
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      })
    }
    
    return dates.slice(0, 20)
  }

  const availableDates = generateAvailableDates()

  const calculateTotal = () => {
    const hours = parseFloat(proposedHours) || 0
    const rate = booking?.hourlyRate || 0
    return (hours * rate).toFixed(2)
  }

  const handleSubmit = async () => {
    if (!proposedHours || parseFloat(proposedHours) <= 0) {
      Alert.alert('Error', 'Please enter valid number of hours')
      return
    }

    if (!proposedDueDate) {
      Alert.alert('Error', 'Please select a due date')
      return
    }

    try {
      setSubmitting(true)

      const acceptanceData = {
        proposedHours: parseFloat(proposedHours),
        proposedDueDate,
        proposedTotal: parseFloat(calculateTotal()),
        providerNotes: providerNotes.trim()
      }

      await onAcceptanceSubmit(acceptanceData)
      
      // Reset form
      setProposedHours('1')
      setProposedDueDate('')
      setProviderNotes('')
      
    } catch (error) {
      console.error('Error accepting booking:', error)
      Alert.alert('Error', error.message || 'Failed to accept booking')
    } finally {
      setSubmitting(false)
    }
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
            Accept Booking Request
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Original Request Summary */}
          <ThemedCard style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <ThemedText style={styles.requestTitle}>Original Request</ThemedText>
            </View>
            
            <View style={styles.requestDetails}>
              <View style={styles.requestRow}>
                <ThemedText style={styles.requestLabel}>Service:</ThemedText>
                <ThemedText style={styles.requestValue}>{booking?.serviceTitle}</ThemedText>
              </View>
              
              <View style={styles.requestRow}>
                <ThemedText style={styles.requestLabel}>Client:</ThemedText>
                <ThemedText style={styles.requestValue}>{booking?.clientEmail?.split('@')[0]}</ThemedText>
              </View>
              
              <View style={styles.requestRow}>
                <ThemedText style={styles.requestLabel}>Requested Due:</ThemedText>
                <ThemedText style={styles.requestValue}>
                  {booking?.preferredStartDate ? new Date(booking.preferredStartDate).toLocaleDateString() : 'Not specified'}
                </ThemedText>
              </View>
              
              {booking?.notes && (
                <View style={styles.requestNotesSection}>
                  <ThemedText style={styles.requestLabel}>Client Notes:</ThemedText>
                  <ThemedText style={styles.requestNotes}>{booking.notes}</ThemedText>
                </View>
              )}
            </View>
          </ThemedCard>

          {/* Your Proposal */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Your Proposal</ThemedText>
            
            {/* Hours Required */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Hours Required *</ThemedText>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.uiBackground,
                  color: theme.text,
                  borderColor: '#007AFF'
                }]}
                placeholder="e.g., 8"
                placeholderTextColor={theme.textSecondary}
                value={proposedHours}
                onChangeText={setProposedHours}
                keyboardType="numeric"
              />
              <ThemedText style={styles.helpText}>
                Estimated hours needed to complete this project
              </ThemedText>
            </View>

            {/* Due Date */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Proposed Due Date *</ThemedText>
              <View style={styles.dateGrid}>
                {availableDates.map((date) => (
                  <Pressable
                    key={date.value}
                    onPress={() => setProposedDueDate(date.value)}
                    style={[
                      styles.dateOption,
                      proposedDueDate === date.value && styles.dateOptionSelected,
                      { 
                        backgroundColor: proposedDueDate === date.value ? '#007AFF' : theme.uiBackground,
                        borderColor: '#007AFF'
                      }
                    ]}
                  >
                    <ThemedText style={[
                      styles.dateText,
                      proposedDueDate === date.value && styles.dateTextSelected
                    ]}>
                      {date.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Provider Notes */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Additional Notes (Optional)</ThemedText>
              <TextInput
                style={[styles.notesInput, { 
                  backgroundColor: theme.uiBackground,
                  color: theme.text,
                  borderColor: '#007AFF'
                }]}
                placeholder="Any additional details, requirements, or clarifications..."
                placeholderTextColor={theme.textSecondary}
                value={providerNotes}
                onChangeText={setProviderNotes}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <ThemedText style={styles.charCount}>
                {providerNotes.length}/500 characters
              </ThemedText>
            </View>
          </View>

          {/* Proposal Summary */}
          <ThemedCard style={styles.summaryCard}>
            <ThemedText style={styles.summaryTitle}>Proposal Summary</ThemedText>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Hours:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {proposedHours || '0'} hour{proposedHours !== '1' ? 's' : ''}
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Rate:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                S${booking?.hourlyRate || 0}/hr
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Due Date:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {proposedDueDate ? new Date(proposedDueDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Not selected'}
              </ThemedText>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <ThemedText style={styles.totalLabel}>Total Estimate:</ThemedText>
              <ThemedText style={styles.totalValue}>
                S${calculateTotal()}
              </ThemedText>
            </View>
          </ThemedCard>

          {/* Submit Button */}
          <ThemedButton 
            onPress={handleSubmit} 
            disabled={submitting || !proposedHours || !proposedDueDate}
            style={[styles.submitButton, (!proposedHours || !proposedDueDate || submitting) && styles.submitButtonDisabled]}
          >
            <View style={styles.buttonContent}>
              {submitting ? (
                <Ionicons name="hourglass-outline" size={18} color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              )}
              <ThemedText style={styles.submitButtonText}>
                {submitting ? 'Sending Proposal...' : 'Send Proposal to Client'}
              </ThemedText>
            </View>
          </ThemedButton>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ThemedView>
    </Modal>
  )
}

export default BookingAcceptanceModal

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
    borderBottomColor: '#007AFF20',
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
  requestCard: {
    marginBottom: 24,
    padding: 16,
    borderLeftColor: '#007AFF',
    borderLeftWidth: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#007AFF',
  },
  requestDetails: {
    marginLeft: 32,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  requestLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    flex: 1,
  },
  requestValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  requestNotesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#007AFF20',
  },
  requestNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#007AFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  charCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dateOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  dateOptionSelected: {
    borderColor: '#007AFF',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#007AFF10',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#007AFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#007AFF20',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#34C759',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
})