import { View, StyleSheet, Modal, Pressable, ScrollView } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'

import ThemedText from '../ThemedText'
import ThemedView from '../ThemedView'
import ThemedButton from '../ThemedButton'
import ThemedCard from '../ThemedCard'

const BookingConfirmationModal = ({ 
  visible, 
  onClose, 
  booking,
  onConfirmationSubmit
}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    try {
      setSubmitting(true)
      await onConfirmationSubmit()
    } catch (error) {
      console.error('Error confirming booking:', error)
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
            Confirm Booking
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Freelancer's Proposal */}
          <ThemedCard style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              <ThemedText style={styles.proposalTitle}>Freelancer Accepted!</ThemedText>
            </View>
            
            <ThemedText style={styles.proposalSubtitle}>
              Here are the proposed project details:
            </ThemedText>

            <View style={styles.proposalDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Service:</ThemedText>
                <ThemedText style={styles.detailValue}>{booking?.serviceTitle}</ThemedText>
              </View>
              
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Hours:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {booking?.proposed_hours || 'Not specified'} hour{booking?.proposed_hours !== 1 ? 's' : ''}
                </ThemedText>
              </View>
              
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Due Date:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {booking?.proposed_due_date ? new Date(booking.proposed_due_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Not specified'}
                </ThemedText>
              </View>
              
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Rate:</ThemedText>
                <ThemedText style={styles.detailValue}>S${booking?.hourlyRate || 0}/hr</ThemedText>
              </View>
              
              <View style={[styles.detailRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total Cost:</ThemedText>
                <ThemedText style={styles.totalValue}>
                  S${booking?.proposed_total || 'TBD'}
                </ThemedText>
              </View>
            </View>

            {booking?.provider_notes && (
              <View style={styles.notesSection}>
                <ThemedText style={styles.notesLabel}>Freelancer's Notes:</ThemedText>
                <ThemedText style={styles.notesText}>{booking.provider_notes}</ThemedText>
              </View>
            )}
          </ThemedCard>

          {/* Original Request Reminder */}
          <ThemedCard style={styles.originalCard}>
            <View style={styles.originalHeader}>
              <Ionicons name="document-text-outline" size={20} color="#666" />
              <ThemedText style={styles.originalTitle}>Your Original Request</ThemedText>
            </View>
            
            <View style={styles.originalDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Requested Due:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {booking?.preferredStartDate ? new Date(booking.preferredStartDate).toLocaleDateString() : 'Not specified'}
                </ThemedText>
              </View>
              
              {booking?.notes && (
                <View style={styles.originalNotesSection}>
                  <ThemedText style={styles.detailLabel}>Your Notes:</ThemedText>
                  <ThemedText style={styles.originalNotes}>{booking.notes}</ThemedText>
                </View>
              )}
            </View>
          </ThemedCard>

          {/* Confirmation Notice */}
          <View style={styles.confirmationNotice}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <View style={styles.noticeContent}>
              <ThemedText style={styles.noticeTitle}>Ready to Proceed?</ThemedText>
              <ThemedText style={styles.noticeText}>
                By confirming, you agree to the freelancer's proposed terms. Work will begin according to the agreed timeline.
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable 
              onPress={onClose}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <ThemedText style={styles.cancelButtonText}>Review Later</ThemedText>
            </Pressable>

            <ThemedButton 
              onPress={handleConfirm} 
              disabled={submitting}
              style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
            >
              <View style={styles.buttonContent}>
                {submitting ? (
                  <Ionicons name="hourglass-outline" size={18} color="#fff" />
                ) : (
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                )}
                <ThemedText style={styles.confirmButtonText}>
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                </ThemedText>
              </View>
            </ThemedButton>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ThemedView>
    </Modal>
  )
}

export default BookingConfirmationModal

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
  proposalCard: {
    marginBottom: 20,
    padding: 20,
    borderLeftColor: '#34C759',
    borderLeftWidth: 4,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#34C759',
  },
  proposalSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
    marginLeft: 36,
  },
  proposalDetails: {
    marginLeft: 36,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#34C75920',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  notesSection: {
    marginTop: 16,
    marginLeft: 36,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#34C75920',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  originalCard: {
    marginBottom: 20,
    padding: 16,
  },
  originalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    opacity: 0.8,
  },
  originalDetails: {
    marginLeft: 28,
  },
  originalNotesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#66666620',
  },
  originalNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
    opacity: 0.7,
  },
  confirmationNotice: {
    flexDirection: 'row',
    backgroundColor: '#007AFF20',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#007AFF',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#34C759',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
})