import { Image, TouchableOpacity, StyleSheet, Text, Alert, ScrollView, TextInput, View, Linking } from 'react-native'
import { useState, useEffect } from 'react'
import { useUser } from '../../hooks/useUser'
import { useReviews } from '../../hooks/useReviews'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import defaultProfilePic from '../../assets/img/avatar_placeholder.png'
import { Ionicons } from '@expo/vector-icons'

import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import ThemedButton from '../../components/ThemedButton'
import ThemedCard from '../../components/ThemedCard'
import ReviewCard from '../../components/reviews/ReviewCard'

function Profile() {
  const { logout, user } = useUser()
  const { receivedReviews, getReviewStats } = useReviews()
  const [profilePic, setProfilePic] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [description, setDescription] = useState('')
  const [projectLinks, setProjectLinks] = useState([])
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectUrl, setNewProjectUrl] = useState('')
  const [portfolioPhotos, setPortfolioPhotos] = useState([])
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedUri = await AsyncStorage.getItem('profilePic')
        const savedDescription = await AsyncStorage.getItem('profileDescription')
        const savedProjects = await AsyncStorage.getItem('projectLinks')
        const savedPhotos = await AsyncStorage.getItem('portfolioPhotos')
        
        if (savedUri !== null) {
          setProfilePic(savedUri)
        }
        if (savedDescription !== null) {
          setDescription(savedDescription)
        }
        if (savedProjects !== null) {
          setProjectLinks(JSON.parse(savedProjects))
        }
        if (savedPhotos !== null) {
          setPortfolioPhotos(JSON.parse(savedPhotos))
        }
      } catch (error) {
        console.log('Error loading profile data:', error)
      }
    }
    
    loadProfileData()
  }, [])

  const verifyPermission = async () => {
    if (hasPermission) return true
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    setHasPermission(status === 'granted')
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library to upload images.',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      )
    }
    return status === 'granted'
  }

  const selectProfileImage = async () => {
    const permissionGranted = await verifyPermission()
    if (!permissionGranted) return
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      })
      
      if (!result.canceled) {
        const selectedUri = result.assets[0].uri
        setProfilePic(selectedUri)
        await AsyncStorage.setItem('profilePic', selectedUri)
      }
    } catch (error) {
      console.log('Image picker error:', error)
      Alert.alert('Error', 'Failed to select image')
    }
  }

  const addPortfolioPhoto = async () => {
    const permissionGranted = await verifyPermission()
    if (!permissionGranted) return
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      })
      
      if (!result.canceled) {
        const selectedUri = result.assets[0].uri
        const newPhotos = [...portfolioPhotos, selectedUri]
        setPortfolioPhotos(newPhotos)
        await AsyncStorage.setItem('portfolioPhotos', JSON.stringify(newPhotos))
      }
    } catch (error) {
      console.log('Image picker error:', error)
      Alert.alert('Error', 'Failed to select image')
    }
  }

  const removePortfolioPhoto = async (index) => {
    const newPhotos = portfolioPhotos.filter((_, i) => i !== index)
    setPortfolioPhotos(newPhotos)
    await AsyncStorage.setItem('portfolioPhotos', JSON.stringify(newPhotos))
  }

  const saveDescription = async () => {
    try {
      await AsyncStorage.setItem('profileDescription', description)
      setIsEditingDescription(false)
    } catch (error) {
      console.log('Error saving description:', error)
      Alert.alert('Error', 'Failed to save description')
    }
  }

  const addProjectLink = async () => {
    if (!newProjectTitle.trim() || !newProjectUrl.trim()) {
      Alert.alert('Error', 'Please enter both title and URL')
      return
    }
    
    // Basic URL validation
    if (!newProjectUrl.startsWith('http://') && !newProjectUrl.startsWith('https://')) {
      Alert.alert('Error', 'Please enter a valid URL starting with http:// or https://')
      return
    }
    
    try {
      const newProject = { title: newProjectTitle.trim(), url: newProjectUrl.trim() }
      const updatedProjects = [...projectLinks, newProject]
      setProjectLinks(updatedProjects)
      await AsyncStorage.setItem('projectLinks', JSON.stringify(updatedProjects))
      setNewProjectTitle('')
      setNewProjectUrl('')
    } catch (error) {
      console.log('Error adding project link:', error)
      Alert.alert('Error', 'Failed to add project link')
    }
  }

  const removeProjectLink = async (index) => {
    try {
      const updatedProjects = projectLinks.filter((_, i) => i !== index)
      setProjectLinks(updatedProjects)
      await AsyncStorage.setItem('projectLinks', JSON.stringify(updatedProjects))
    } catch (error) {
      console.log('Error removing project link:', error)
    }
  }

  const openProjectLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open link')
    })
  }

  // Calculate overall rating from all received reviews
  const calculateOverallRating = () => {
    if (!receivedReviews || receivedReviews.length === 0) return 0
    const totalRating = receivedReviews.reduce((sum, review) => sum + review.rating, 0)
    return (totalRating / receivedReviews.length).toFixed(1)
  }

  const overallRating = calculateOverallRating()
  const displayedReviews = showAllReviews ? (receivedReviews || []) : (receivedReviews || []).slice(0, 3)

  return (
    <ScrollView style={styles.scrollContainer}>
      <ThemedView style={styles.container}>
        <Spacer height={70}/>
        {/* Profile Picture */}
        <TouchableOpacity onPress={selectProfileImage}>
          <Image
            source={profilePic ? { uri: profilePic } : defaultProfilePic}
            style={styles.profilePic}
          />
          <ThemedText style={styles.tapToChangeText}>Tap to change</ThemedText>
        </TouchableOpacity>
        <Spacer height={20}/>

        {/* User Email */}
        <ThemedText title={true} style={styles.heading}>
          {user.email}
        </ThemedText>
        
        {/* Rating Summary */}
        {receivedReviews && receivedReviews.length > 0 && (
          <View style={styles.ratingSection}>
            <View style={styles.ratingDisplay}>
              <ThemedText style={styles.overallRating}>{overallRating}</ThemedText>
              <View style={styles.starsContainer}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Ionicons
                    key={index}
                    name={index < Math.floor(overallRating) ? 'star' : index < overallRating ? 'star-half' : 'star-outline'}
                    size={16}
                    color={index < overallRating ? '#FFD700' : '#ccc'}
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <ThemedText style={styles.reviewCount}>
                {receivedReviews?.length || 0} review{(receivedReviews?.length || 0) !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          </View>
        )}
        
        <Spacer />

        {/* Description Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About Me</ThemedText>
          {isEditingDescription ? (
            <View>
              <TextInput
                style={styles.descriptionInput}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about yourself, your skills, interests..."
                placeholderTextColor="#999"
              />
              <View style={styles.descriptionButtons}>
                <ThemedButton onPress={saveDescription} style={[styles.smallButton, styles.saveButton]}>
                  <Text style={styles.buttonText}>Save</Text>
                </ThemedButton>
                <ThemedButton 
                  onPress={() => setIsEditingDescription(false)} 
                  style={[styles.smallButton, styles.cancelButton]}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </ThemedButton>
              </View>
            </View>
          ) : (
            <View>
              <ThemedText style={styles.descriptionText}>
                {description || "No description yet. Tap 'Edit' to add one!"}
              </ThemedText>
              <ThemedButton 
                onPress={() => setIsEditingDescription(true)} 
                style={[styles.smallButton, styles.editButton]}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </ThemedButton>
            </View>
          )}
        </View>
        <Spacer />

        {/* Project Links Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Projects</ThemedText>
          
          {/* Add New Project */}
          <View style={styles.addProjectContainer}>
            <TextInput
              style={styles.projectInput}
              value={newProjectTitle}
              onChangeText={setNewProjectTitle}
              placeholder="Project title"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.projectInput}
              value={newProjectUrl}
              onChangeText={setNewProjectUrl}
              placeholder="Link"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <ThemedButton onPress={addProjectLink} style={[styles.smallButton, styles.addButton]}>
              <Text style={styles.buttonText}>Add Project</Text>
            </ThemedButton>
          </View>

          {/* Project Links List */}
          {projectLinks.map((project, index) => (
            <View key={index} style={styles.projectItem}>
              <TouchableOpacity 
                style={styles.projectLink}
                onPress={() => openProjectLink(project.url)}
              >
                <ThemedText style={styles.projectTitle}>{project.title}</ThemedText>
                <ThemedText style={styles.projectUrl}>{project.url}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => removeProjectLink(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <Spacer />

        {/* Past Project Examples Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Past Project Examples</ThemedText>
          
          <ThemedButton onPress={addPortfolioPhoto} style={[styles.smallButton, styles.addButton]}>
            <Text style={styles.buttonText}>Add Photo</Text>
          </ThemedButton>
          
          <View style={styles.photosGrid}>
            {portfolioPhotos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.portfolioPhoto} />
                <TouchableOpacity 
                  onPress={() => removePortfolioPhoto(index)}
                  style={styles.photoRemoveButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
        <Spacer />

        {/* Reviews Section */}
        {receivedReviews && receivedReviews.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Recent Reviews</ThemedText>
            
            {displayedReviews.map((review) => (
              <ReviewCard 
                key={review.$id} 
                review={review}
                showServiceTitle={true}
              />
            ))}
            
            {receivedReviews && receivedReviews.length > 3 && (
              <ThemedButton 
                onPress={() => setShowAllReviews(!showAllReviews)} 
                style={[styles.smallButton, styles.viewMoreButton]}
              >
                <Text style={styles.buttonText}>
                  {showAllReviews ? 'Show Less' : `View All ${receivedReviews?.length || 0} Reviews`}
                </Text>
              </ThemedButton>
            )}
          </View>
        )}
        <Spacer />

        <ThemedButton onPress={logout} style={styles.logoutButton}>
          <Text style={styles.buttonText}>Logout</Text>
        </ThemedButton>
        
        <Spacer height={100} />
      </ThemedView>
    </ScrollView>
  )
}

export default Profile

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#ccc',
    resizeMode: 'cover',
  },
  tapToChangeText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.7,
  },
  section: {
    width: '100%',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    backgroundColor: '#fff',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  descriptionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  addProjectContainer: {
    marginBottom: 15,
  },
  projectInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(204, 204, 204, 0.3)',
  },
  projectLink: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  projectUrl: {
    fontSize: 12,
    opacity: 0.7,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  portfolioPhoto: {
    width: 80,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    resizeMode: 'cover',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  addButton: {
    backgroundColor: '#FF9800',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  removeButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#f2f2f2',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  overallRating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 12,
    opacity: 0.8,
  },
  viewMoreButton: {
    backgroundColor: '#FFD700',
    alignSelf: 'center',
    marginTop: 10,
  },
})