import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from '../../components/neumorphism';
import { RootStackScreenProps } from '../../types/navigation';
import { socialService, MentorProfile } from '../../services/social';
import { dataService } from '../../services/core';
import { theme } from '../../theme';

type MentorsScreenProps = RootStackScreenProps<'Mentors'>;

const SPECIALTIES = [
  { id: 'all', name: 'All', emoji: '🌟' },
  { id: 'productivity', name: 'Productivity', emoji: '⚡' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'mindfulness', name: 'Mindfulness', emoji: '🧘' },
  { id: 'learning', name: 'Learning', emoji: '📚' },
  { id: 'creative', name: 'Creative', emoji: '🎨' },
  { id: 'psychology', name: 'Psychology', emoji: '🧠' },
];

export const MentorsScreen: React.FC<MentorsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedTab, setSelectedTab] = useState<'all' | 'recommended' | 'connected'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentors();
  }, [selectedSpecialty, selectedTab]);

  const loadMentors = async () => {
    try {
      setLoading(true);
      let mentorData: MentorProfile[];
      
      switch (selectedTab) {
        case 'recommended':
          const habits = await dataService.getHabits();
          const userCategories = [...new Set(habits.map(h => h.type || 'general'))];
          mentorData = await socialService.getRecommendedMentors(userCategories);
          break;
        case 'connected':
          // In a real app, this would show mentors user is connected with
          mentorData = (await socialService.getMentors(selectedSpecialty === 'all' ? undefined : selectedSpecialty)).slice(0, 1);
          break;
        default:
          mentorData = await socialService.getMentors(selectedSpecialty === 'all' ? undefined : selectedSpecialty);
      }
      
      setMentors(mentorData);
    } catch (error) {
      console.error('Failed to load mentors:', error);
      Alert.alert('Error', 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = async (mentorId: string, mentorName: string) => {
    Alert.alert(
      'Request Mentorship',
      `Would you like to request mentorship from ${mentorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              const success = await socialService.requestMentorship(mentorId);
              if (success) {
                Alert.alert('Success', 'Mentorship request sent successfully!');
                await loadMentors();
              } else {
                Alert.alert('Error', 'Failed to send mentorship request');
              }
            } catch (error) {
              console.error('Failed to request mentorship:', error);
              Alert.alert('Error', 'Failed to send mentorship request');
            }
          },
        },
      ]
    );
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={14} color="#FFD700" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#DDD" />);
    }
    
    return <View style={styles.starRating}>{stars}</View>;
  };

  const renderMentorCard = ({ item }: { item: MentorProfile }) => (
    <NeumorphCard
      variant="medium"
      colorType="whiteGlass"
      style={styles.mentorCard}
      animated
    >
      <View style={styles.mentorHeader}>
        <View style={styles.mentorAvatar}>
          <Text style={styles.mentorInitials}>
            {item.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        
        <View style={styles.mentorInfo}>
          <Text style={styles.mentorName}>{item.name}</Text>
          <View style={styles.mentorRating}>
            {renderStarRating(item.averageRating)}
            <Text style={styles.ratingText}>({item.averageRating})</Text>
          </View>
          <Text style={styles.mentorStats}>
            {item.totalMentees} mentees • {item.successRate}% success rate
          </Text>
        </View>
      </View>

      <Text style={styles.mentorBio}>{item.bio}</Text>

      <View style={styles.specialtiesContainer}>
        <Text style={styles.specialtiesLabel}>Specialties:</Text>
        <View style={styles.specialties}>
          {item.specialties.map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyTagText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.badgesContainer}>
        {item.badges.slice(0, 2).map((badge, index) => (
          <View key={index} style={styles.badge}>
            <Ionicons name="ribbon" size={12} color="#666" />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mentorFooter}>
        <NeumorphButton
          title="View Profile"
          variant="secondary"
          size="small"
          onPress={() => navigation.navigate('MentorProfile', { mentorId: item.id })}
          style={styles.profileButton}
        />
        
        {selectedTab !== 'connected' && (
          <NeumorphButton
            title="Request Mentorship"
            variant="primary"
            size="small"
            onPress={() => handleRequestMentorship(item.id, item.name)}
            style={styles.requestButton}
          />
        )}
      </View>
    </NeumorphCard>
  );

  const renderEmptyState = () => (
    <NeumorphCard
      variant="medium"
      colorType="whiteGlass"
      style={styles.emptyCard}
    >
      <Text style={styles.emptyEmoji}>
        {selectedTab === 'connected' ? '🤝' : selectedTab === 'recommended' ? '✨' : '🧑‍🏫'}
      </Text>
      <Text style={styles.emptyTitle}>
        {selectedTab === 'connected' 
          ? 'No mentors connected'
          : selectedTab === 'recommended'
            ? 'No recommendations yet'
            : 'No mentors found'
        }
      </Text>
      <Text style={styles.emptyDescription}>
        {selectedTab === 'connected' 
          ? 'Connect with mentors to see them here!'
          : selectedTab === 'recommended'
            ? 'Add more habits to get personalized recommendations'
            : 'Try adjusting your filters'
        }
      </Text>
    </NeumorphCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: NeumorphismColors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <NeumorphCard 
          variant="subtle" 
          colorType="whiteGlass" 
          style={[styles.header, { marginTop: insets.top - 45, paddingTop: 0 }]} 
          animated
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mentors</Text>
          <View style={styles.placeholder} />
        </NeumorphCard>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <NeumorphButton
            title="All Mentors"
            variant={selectedTab === 'all' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('all')}
            glassIntensity={selectedTab === 'all' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Recommended"
            variant={selectedTab === 'recommended' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('recommended')}
            glassIntensity={selectedTab === 'recommended' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Connected"
            variant={selectedTab === 'connected' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('connected')}
            glassIntensity={selectedTab === 'connected' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
        </View>

        {/* Specialty Filter */}
        <View style={styles.specialtyContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtyScroll}
          >
            {SPECIALTIES.map((specialty) => (
              <TouchableOpacity
                key={specialty.id}
                onPress={() => setSelectedSpecialty(specialty.id)}
                style={[
                  styles.specialtyButton,
                  selectedSpecialty === specialty.id && styles.specialtyButtonActive,
                ]}
              >
                <Text style={styles.specialtyEmoji}>{specialty.emoji}</Text>
                <Text style={[
                  styles.specialtyText,
                  selectedSpecialty === specialty.id && styles.specialtyTextActive,
                ]}>
                  {specialty.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Mentors List */}
        <View style={styles.mentorsContainer}>
          {mentors.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={mentors}
              keyExtractor={item => item.id}
              renderItem={renderMentorCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mentorsList}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    height: 64,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tabButton: {
    flex: 1,
  },
  specialtyContainer: {
    paddingVertical: theme.spacing.sm,
  },
  specialtyScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  specialtyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    shadowColor: NeumorphismColors.darkShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  specialtyButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  specialtyEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  specialtyText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  specialtyTextActive: {
    color: '#333',
    fontWeight: theme.fontWeight.semibold,
  },
  mentorsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  mentorsList: {
    paddingBottom: theme.spacing.xl * 2,
  },
  mentorCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  mentorHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  mentorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  mentorInitials: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  mentorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  starRating: {
    flexDirection: 'row',
    marginRight: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  mentorStats: {
    fontSize: theme.fontSize.sm,
    color: '#666',
  },
  mentorBio: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  specialtiesContainer: {
    marginBottom: theme.spacing.md,
  },
  specialtiesLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  specialtyTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  specialtyTagText: {
    fontSize: theme.fontSize.xs,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    color: '#666',
    fontStyle: 'italic',
  },
  mentorFooter: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  profileButton: {
    flex: 1,
  },
  requestButton: {
    flex: 1,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});