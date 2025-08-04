import { StyleSheet, Text, TouchableWithoutFeedback, Keyboard, ScrollView, Alert } from 'react-native'
import { useBooks } from "../../hooks/useBooks"
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Picker } from '@react-native-picker/picker'

// themed components
import ThemedView from "../../components/ThemedView"
import ThemedText from "../../components/ThemedText"
import ThemedTextInput from "../../components/ThemedTextInput"
import ThemedButton from '../../components/ThemedButton'
import Spacer from '../../components/Spacer'

const Create = () => {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("web-development")
  const [description, setDescription] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("")
  const [skills, setSkills] = useState("")
  const [experience, setExperience] = useState("beginner")
  const [loading, setLoading] = useState(false)

  const { createBook } = useBooks()
  const router = useRouter()

  const categories = [
    { label: "Web Development", value: "web-development" },
    { label: "Mobile Development", value: "mobile-development" },
    { label: "UI/UX Design", value: "ui-ux-design" },
    { label: "Graphic Design", value: "graphic-design" },
    { label: "Content Writing", value: "content-writing" },
    { label: "Digital Marketing", value: "digital-marketing" },
    { label: "Data Analysis", value: "data-analysis" },
    { label: "Video Editing", value: "video-editing" },
    { label: "Photography", value: "photography" },
    { label: "Translation", value: "translation" },
    { label: "Virtual Assistant", value: "virtual-assistant" },
    { label: "Other", value: "other" }
  ]

  const experienceLevels = [
    { label: "Beginner (0-1 years)", value: "beginner" },
    { label: "Intermediate (2-4 years)", value: "intermediate" },
    { label: "Expert (5+ years)", value: "expert" }
  ]

  async function handleSubmit() {
    // Validation
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a service title")
      return
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a service description")
      return
    }
    if (!hourlyRate.trim() || isNaN(parseFloat(hourlyRate))) {
      Alert.alert("Error", "Please enter a valid hourly rate")
      return
    }
    if (!deliveryTime.trim()) {
      Alert.alert("Error", "Please enter expected delivery time")
      return
    }
    if (!skills.trim()) {
      Alert.alert("Error", "Please list your relevant skills")
      return
    }

    setLoading(true)
    
    try {
      console.log('Creating service with data:', {
        title: title.trim(),
        category,
        hourlyRate: parseFloat(hourlyRate),
        experience
      })

      const serviceData = {
        title: title.trim(),
        author: `S$${hourlyRate}/hr`, // Changed from USD to SGD
        description: description.trim(),
        category,
        hourlyRate: parseFloat(hourlyRate),
        deliveryTime: deliveryTime.trim(),
        skills: skills.trim(),
        experience,
        createdAt: new Date().toISOString()
      }

      const createdService = await createBook(serviceData)
      console.log('Service created successfully:', createdService.$id)

      // Reset form
      setTitle("")
      setCategory("web-development")
      setDescription("")
      setHourlyRate("")
      setDeliveryTime("")
      setSkills("")
      setExperience("beginner")

      Alert.alert(
        "Success", 
        "Your service has been created successfully!", 
        [
          { 
            text: "View Services", 
            onPress: () => router.replace("/books") 
          },
          { 
            text: "Search Services", 
            onPress: () => router.replace("/search") 
          }
        ]
      )
    } catch (error) {
      console.error("Service creation error:", error)
      Alert.alert("Error", `Failed to create service: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
      <ThemedView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText title={true} style={styles.heading}>
            Create Your Service
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Showcase your skills and attract clients
          </ThemedText>
          <Spacer height={30} />

          {/* Service Title */}
          <ThemedText style={styles.label}>Service Title *</ThemedText>
          <ThemedTextInput
            style={styles.input}
            placeholder="e.g., I will create a modern website for your business"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
          <ThemedText style={styles.charCount}>{title.length}/80</ThemedText>
          <Spacer height={20} />

          {/* Category */}
          <ThemedText style={styles.label}>Category *</ThemedText>
          <ThemedView style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
              ))}
            </Picker>
          </ThemedView>
          <Spacer height={20} />

          {/* Hourly Rate */}
          <ThemedText style={styles.label}>Hourly Rate (SGD) *</ThemedText>
          <ThemedTextInput
            style={styles.input}
            placeholder="35"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            keyboardType="numeric"
          />
          <ThemedText style={styles.helpText}>
            Set a competitive rate based on your experience and market standards
          </ThemedText>
          <Spacer height={20} />

          {/* Delivery Time */}
          <ThemedText style={styles.label}>Expected Delivery Time *</ThemedText>
          <ThemedTextInput
            style={styles.input}
            placeholder="e.g., 3-5 business days, 1 week, 2 weeks"
            value={deliveryTime}
            onChangeText={setDeliveryTime}
          />
          <Spacer height={20} />

          {/* Experience Level */}
          <ThemedText style={styles.label}>Experience Level *</ThemedText>
          <ThemedView style={styles.pickerContainer}>
            <Picker
              selectedValue={experience}
              onValueChange={setExperience}
              style={styles.picker}
            >
              {experienceLevels.map((exp) => (
                <Picker.Item key={exp.value} label={exp.label} value={exp.value} />
              ))}
            </Picker>
          </ThemedView>
          <Spacer height={20} />

          {/* Skills */}
          <ThemedText style={styles.label}>Key Skills *</ThemedText>
          <ThemedTextInput
            style={styles.input}
            placeholder="e.g., React, Node.js, MongoDB, API Development"
            value={skills}
            onChangeText={setSkills}
            maxLength={200}
          />
          <ThemedText style={styles.charCount}>{skills.length}/200</ThemedText>
          <ThemedText style={styles.helpText}>
            List your most relevant skills separated by commas
          </ThemedText>
          <Spacer height={20} />

          {/* Service Description */}
          <ThemedText style={styles.label}>Service Description *</ThemedText>
          <ThemedTextInput
            style={styles.multiline}
            placeholder="Describe your service in detail. What will you deliver? What makes you the right choice? Include your process, what's included, and any requirements from the client."
            value={description}
            onChangeText={setDescription}
            multiline={true}
            maxLength={1000}
          />
          <ThemedText style={styles.charCount}>{description.length}/1000</ThemedText>
          <Spacer height={30} />

          <ThemedButton onPress={handleSubmit} disabled={loading} style={styles.submitButton}>
            <Text style={styles.buttonText}>
              {loading ? "Creating Service..." : "Publish Service"}
            </Text>
          </ThemedButton>

          <Spacer height={40} />
        </ScrollView>
      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Create

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,      
    elevation: 4,
  },
  multiline: {
    padding: 16,
    borderRadius: 12,
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: 'top',
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  picker: {
    height: 50,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    opacity: 0.6,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})