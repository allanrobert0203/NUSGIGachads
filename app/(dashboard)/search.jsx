import { View, TextInput, TouchableWithoutFeedback, Keyboard, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '../../hooks/useBooks';
import { Colors } from '../../constants/Colors';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedCard from '../../components/ThemedCard';
import Spacer from '../../components/Spacer';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const router = useRouter();
  const { fetchAllServices } = useBooks();
  
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all services on component mount
  useEffect(() => {
    loadAllServices();
  }, []);

  const loadAllServices = async () => {
    try {
      setLoading(true);
      console.log('Loading all services for search...');
      const services = await fetchAllServices();
      console.log('Loaded services:', services.length);
      setAllServices(services);
    } catch (error) {
      console.error('Error loading services for search:', error);
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { label: "All Categories", value: "all" },
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
  ];

  const experienceLevels = [
    { label: "All Levels", value: "all" },
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Expert", value: "expert" }
  ];

  const priceRanges = [
    { label: "All Prices", value: "all" },
    { label: "S$7-S$35/hr", value: "7-35" },
    { label: "S$35-S$70/hr", value: "35-70" },
    { label: "S$70-S$140/hr", value: "70-140" },
    { label: "S$140+/hr", value: "140+" }
  ];

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllServices();
    } catch (error) {
      console.error('Error refreshing services:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and search services
  const filteredServices = useMemo(() => {
    let filtered = [...allServices];

    console.log('Filtering services:', filtered.length);

    // Text search - make it more flexible
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(service => {
        const title = (service.title || '').toLowerCase();
        const description = (service.description || '').toLowerCase();
        const skills = (service.skills || '').toLowerCase();
        const category = (service.category || '').toLowerCase();
        const author = (service.author || '').toLowerCase();
        
        return title.includes(searchLower) ||
               description.includes(searchLower) ||
               skills.includes(searchLower) ||
               category.includes(searchLower) ||
               author.includes(searchLower);
      });
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Experience filter
    if (selectedExperience !== 'all') {
      filtered = filtered.filter(service => service.experience === selectedExperience);
    }

    // Price range filter - Updated for SGD
    if (priceRange !== 'all') {
      filtered = filtered.filter(service => {
        const rate = service.hourlyRate || 0;
        switch (priceRange) {
          case '7-35':
            return rate >= 7 && rate <= 35;
          case '35-70':
            return rate > 35 && rate <= 70;
          case '70-140':
            return rate > 70 && rate <= 140;
          case '140+':
            return rate > 140;
          default:
            return true;
        }
      });
    }

    console.log('Filtered services:', filtered.length);
    return filtered;
  }, [allServices, searchText, selectedCategory, selectedExperience, priceRange]);

  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory('all');
    setSelectedExperience('all');
    setPriceRange('all');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedExperience !== 'all' || priceRange !== 'all' || searchText.trim();

  // Helper function to extract hourly rate from author field or hourlyRate field - Updated for SGD
  const getHourlyRate = (service) => {
    if (service.hourlyRate) {
      return `S$${service.hourlyRate}/hr`;
    }
    if (service.author && service.author.includes('S$')) {
      return service.author;
    }
    return 'Rate not specified';
  };

  // Helper function to get category display name
  const getCategoryDisplayName = (categoryValue) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : 'Other';
  };

  const renderServiceCard = ({ item, index }) => (
    <Pressable onPress={() => router.push(`/books/${item.$id}`)}>
      <ThemedCard style={styles.serviceCard}>
        <View style={styles.cardHeader}>
          <ThemedText style={styles.serviceTitle} numberOfLines={2}>
            {item.title || 'Untitled Service'}
          </ThemedText>
          <ThemedText style={styles.priceTag}>
            {getHourlyRate(item)}
          </ThemedText>
        </View>
        
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="folder-outline" size={14} color={theme.textSecondary} />
            <ThemedText style={styles.metaText}>
              {getCategoryDisplayName(item.category)}
            </ThemedText>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={14} color={theme.textSecondary} />
            <ThemedText style={styles.metaText}>
              {item.experience ? 
                item.experience.charAt(0).toUpperCase() + item.experience.slice(1) : 
                'Beginner'
              }
            </ThemedText>
          </View>
          
          {item.deliveryTime && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              <ThemedText style={styles.metaText}>
                {item.deliveryTime}
              </ThemedText>
            </View>
          )}
        </View>

        <ThemedText style={styles.serviceDescription} numberOfLines={3}>
          {item.description || 'No description available'}
        </ThemedText>

        {item.skills && (
          <View style={styles.skillsContainer}>
            {item.skills.split(',').slice(0, 3).map((skill, skillIndex) => (
              <View key={`${item.$id}-skill-${skillIndex}`} style={styles.skillTag}>
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
      </ThemedCard>
    </Pressable>
  );

  const renderFilterChip = (label, value, selectedValue, onPress) => (
    <Pressable
      key={`filter-${value}`}
      onPress={() => onPress(value)}
      style={[
        styles.filterChip,
        selectedValue === value && styles.filterChipActive,
        { borderColor: selectedValue === value ? '#B380FF' : theme.textSecondary }
      ]}
    >
      <ThemedText style={[
        styles.filterChipText,
        selectedValue === value && styles.filterChipTextActive
      ]}>
        {label}
      </ThemedText>
    </Pressable>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading services...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        {/* Search Bar */}
        <View style={[
          styles.searchBarContainer,
          { 
            shadowColor: '#B380FF',
            shadowOpacity: isFocused ? 0.9 : 0.4,
            shadowRadius: isFocused ? 15 : 10,
          }
        ]}>
          <View style={[
            styles.searchBar,
            { 
              backgroundColor: theme.cardBackground,
              borderColor: isFocused ? '#D9B3FF' : '#B380FF',
              borderWidth: isFocused ? 2 : 1.5,
            }
          ]}>
            <Ionicons 
              name="search" 
              size={20} 
              color={isFocused ? '#D9B3FF' : '#B380FF'}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search services, skills, or categories..."
              placeholderTextColor={theme.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={true}
              autoCapitalize="none"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filtersSection}>
          <View style={styles.filterRow}>
            <ThemedText style={styles.filterLabel}>Category:</ThemedText>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories.slice(0, 6)}
              keyExtractor={(item) => `category-${item.value}`}
              renderItem={({ item }) => renderFilterChip(
                item.label, 
                item.value, 
                selectedCategory, 
                setSelectedCategory
              )}
              contentContainerStyle={styles.filterChips}
            />
          </View>

          <View style={styles.filterRow}>
            <ThemedText style={styles.filterLabel}>Experience:</ThemedText>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={experienceLevels}
              keyExtractor={(item) => `experience-${item.value}`}
              renderItem={({ item }) => renderFilterChip(
                item.label, 
                item.value, 
                selectedExperience, 
                setSelectedExperience
              )}
              contentContainerStyle={styles.filterChips}
            />
          </View>

          <View style={styles.filterRow}>
            <ThemedText style={styles.filterLabel}>Price:</ThemedText>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={priceRanges}
              keyExtractor={(item) => `price-${item.value}`}
              renderItem={({ item }) => renderFilterChip(
                item.label, 
                item.value, 
                priceRange, 
                setPriceRange
              )}
              contentContainerStyle={styles.filterChips}
            />
          </View>

          {hasActiveFilters && (
            <Pressable onPress={clearFilters} style={styles.clearFiltersButton}>
              <Ionicons name="refresh-outline" size={16} color="#B380FF" />
              <ThemedText style={styles.clearFiltersText}>Clear Filters</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <ThemedText style={styles.resultsCount}>
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
          </ThemedText>
          <Pressable onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={16} color="#B380FF" />
            <ThemedText style={styles.refreshText}>Refresh</ThemedText>
          </Pressable>
        </View>

        {/* Services List */}
        <FlatList
          data={filteredServices}
          keyExtractor={(item, index) => `service-${item.$id || index}`}
          renderItem={renderServiceCard}
          contentContainerStyle={styles.servicesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#B380FF']}
              tintColor="#B380FF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No services found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {allServices.length === 0 
                  ? "No services have been created yet. Create your first service!"
                  : "Try adjusting your search terms or filters"
                }
              </ThemedText>
              {allServices.length === 0 && (
                <Pressable 
                  onPress={() => router.push('/create')} 
                  style={styles.createServiceButton}
                >
                  <ThemedText style={styles.createServiceText}>Create Service</ThemedText>
                </Pressable>
              )}
            </View>
          }
        />
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    borderRadius: 25,
    marginTop: 60,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 23,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#7F5AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,      
    elevation: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    includeFontPadding: false,
  },
  filtersSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  filterChips: {
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#B380FF20',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#B380FF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  clearFiltersText: {
    color: '#B380FF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#B380FF20',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshText: {
    color: '#B380FF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  servicesList: {
    paddingBottom: 100,
  },
  serviceCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftColor: '#B380FF',
    borderLeftWidth: 4,
    shadowColor: '#B380FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B380FF',
    backgroundColor: '#B380FF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardMeta: {
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
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.9,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  skillTag: {
    backgroundColor: '#7F5AF020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 20,
  },
  createServiceButton: {
    backgroundColor: '#B380FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createServiceText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});