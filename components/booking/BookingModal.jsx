import { View, StyleSheet, Modal, TextInput, Pressable, Alert, ScrollView } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import { Colors } from '../../constants/Colors'
import { useBookings } from '../../hooks/useBookings'

import ThemedText from '../ThemedText'
import ThemedView from '../ThemedView'
import ThemedButton from '../ThemedButton'
import ThemedCard from '../ThemedCard'

const BookingModal = ({ 
  visible, 
  onClose, 
  service,
  onBookingSuccess
}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const { createBooking } = useBookings()

  const [selectedDate, setSelectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Generate next 30 days for date selection
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Skip weekends for business services
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        })
      }
    }
    
    return dates.slice(0, 20) // Show next 20 business days
  }

  const availableDates = generateAvailableDates()

  const handleSubmit = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a preferred start date')
      return
    }

    if (!service) {
      Alert.alert('Error', 'Service information not available')
      return
    }

    try {
      setSubmitting(true)

      const bookingData = {
        serviceId: service.$id,
        serviceTitle: service.title,
        serviceProviderId: service.userId,
        hourlyRate: service.hourlyRate || 0,
        preferredStartDate: selectedDate,
        notes: notes.trim(),
        estimatedHours: 1, // Default to 1 hour, can be negotiated
      }

      const booking = await createBooking(bookingData)
      
      Alert.alert(
        'Booking Submitted!', 
        'Your booking request has been sent to the service provider. They will review and respond to your request.',
        [
          { 
            text: 'View My Orders', 
            onPress: () => {
              onClose()
              onBookingSuccess()
            }
          }
        ]
      )

      // Reset form
      setSelectedDate('')
      setNotes('')
      
    } catch (error) {
      console.error('Error creating booking:', error)
      Alert.alert('Error', error.message || 'Failed to submit booking')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateEstimatedCost = () => {
    if (!service?.hourlyRate) return 'Rate not specified'
    return `S$${service.hourlyRate}/hr (minimum 1 hour)`
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
            Book Service
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Service Summary */}
          <ThemedCard style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Ionicons name="briefcase" size={20} color="#7F5AF0" />
              <ThemedText style={styles.serviceTitle} numberOfLines={2}>
                {service?.title}
              </ThemedText>
            </View>
            
            <View style={styles.serviceMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <ThemedText style={styles.metaText}>
                  {service?.deliveryTime || 'Delivery time not specified'}
                </ThemedText>
              </View>
              
              <View style={styles.metaItem}>
                <Ionicons name="card-outline" size={16} color="#666" />
                <ThemedText style={styles.metaText}>
                  {calculateEstimatedCost()}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>

          {/* Date Selection */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Preferred Due Date *</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              When would you like this project completed?
            </ThemedText>
            
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateSelector, { 
                backgroundColor: theme.uiBackground,
                borderColor: selectedDate ? '#7F5AF0' : '#E0E0E0'
              }]}
            >
              <Ionicons name="calendar-outline" size={20} color="#7F5AF0" />
              <ThemedText style={[styles.dateSelectorText, !selectedDate && styles.placeholderText]}>
                {selectedDate ? 
                  new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 
                  'Select due date'
                }
              </ThemedText>
              <Ionicons name="chevron-down" size={16} color="#7F5AF0" />
            </Pressable>
            
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <ThemedText style={styles.datePickerTitle}>Select Due Date</ThemedText>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={20} color="#666" />
                  </Pressable>
                </View>
                <View style={styles.dateGrid}>
                  {availableDates.map((date) => (
                    <Pressable
                      key={date.value}
                      onPress={() => {
                        setSelectedDate(date.value)
                        setShowDatePicker(false)
                      }}
                      style={[
                        styles.dateOption,
                        selectedDate === date.value && styles.dateOptionSelected,
                        { backgroundColor: selectedDate === date.value ? '#7F5AF0' : theme.uiBackground }
                      ]}
                    >
                      <ThemedText style={[
                        styles.dateText,
                        selectedDate === date.value && styles.dateTextSelected
                      ]}>
                        {date.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Project Notes */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Project Details</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Describe your project requirements, timeline, and any specific needs
            </ThemedText>
            
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: theme.uiBackground,
                color: theme.text,
                borderColor: '#7F5AF0'
              }]}
              placeholder="Tell the service provider about your project needs, timeline, budget expectations, and any specific requirements..."
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
            <ThemedText style={styles.charCount}>
              {notes.length}/1000 characters
            </ThemedText>
          </View>

          {/* Booking Summary */}
          <ThemedCard style={styles.summaryCard}>
            <ThemedText style={styles.summaryTitle}>Booking Summary</ThemedText>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Service:</ThemedText>
              <ThemedText style={styles.summaryValue} numberOfLines={2}>
                {service?.title}
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Due Date:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Not selected'}
              </ThemedText>
            </View>
            
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Rate:</ThemedText>
              <ThemedText style={styles.summaryValue}>
                {calculateEstimatedCost()}
              </ThemedText>
            </View>
          </ThemedCard>

          {/* Important Notice */}
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle" size={20} color="#FF9500" />
            <View style={styles.noticeContent}>
              <ThemedText style={styles.noticeTitle}>Important</ThemedText>
              <ThemedText style={styles.noticeText}>
                This is a booking request. The service provider will contact you to confirm details, discuss scope, and finalize pricing before work begins.
              </ThemedText>
            </View>
          </View>

          {/* Submit Button */}
          <ThemedButton 
            onPress={handleSubmit} 
            disabled={submitting || !selectedDate}
            style={[styles.submitButton, (!selectedDate || submitting) && styles.submitButtonDisabled]}
          >
            <View style={styles.buttonContent}>
              {submitting ? (
                <Ionicons name="hourglass-outline" size={18} color="#fff" />
              ) : (
                <Ionicons name="send-outline" size={18} color="#fff" />
              )}
              <ThemedText style={styles.submitButtonText}>
                {submitting ? 'Submitting Request...' : 'Submit Booking Request'}
              </ThemedText>
            </View>
          </ThemedButton>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ThemedView>
    </Modal>
  )
}

export default BookingModal

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
  serviceCard: {
    marginBottom: 24,
    padding: 16,
    borderLeftColor: '#7F5AF0',
    borderLeftWidth: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  serviceMeta: {
    marginLeft: 32,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 6,
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  placeholderText: {
    opacity: 0.6,
  },
  datePickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#7F5AF0',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F5AF0',
  },
  dateOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7F5AF0',
    minWidth: 80,
    alignItems: 'center',
  },
  dateOptionSelected: {
    borderColor: '#7F5AF0',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
  },
  summaryCard: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#7F5AF010',
    borderWidth: 1,
    borderColor: '#7F5AF0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#7F5AF0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FF950020',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#FF9500',
    lineHeight: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
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