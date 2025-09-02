import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeumorphCard, NeumorphButton, NeumorphismColors } from '../../components/neumorphism';
import { RootStackScreenProps } from '../../types/navigation';
import { 
  aiInsightsService, 
  HabitRecommendation, 
  HabitInsight, 
  PersonalizedCoaching, 
  HabitCorrelation 
} from '../../services/analytics';
import { theme } from '../../theme';

type AIInsightsScreenProps = RootStackScreenProps<'AIInsights'>;

export const AIInsightsScreen: React.FC<AIInsightsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [recommendations, setRecommendations] = useState<HabitRecommendation[]>([]);
  const [insights, setInsights] = useState<HabitInsight[]>([]);
  const [coaching, setCoaching] = useState<PersonalizedCoaching[]>([]);
  const [correlations, setCorrelations] = useState<HabitCorrelation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'insights' | 'recommendations' | 'coaching' | 'correlations'>('insights');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      setLoading(true);
      await aiInsightsService.initialize();
      
      const [recs, insights, coaching, correlations] = await Promise.all([
        aiInsightsService.getRecommendations(),
        aiInsightsService.getInsights(),
        aiInsightsService.getCoachingMessages(),
        aiInsightsService.analyzeHabitCorrelations(),
      ]);

      setRecommendations(recs);
      setInsights(insights);
      setCoaching(coaching);
      setCorrelations(correlations);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
      Alert.alert('Error', 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await aiInsightsService.refreshInsights();
      await loadAIData();
    } catch (error) {
      console.error('Failed to refresh insights:', error);
      Alert.alert('Error', 'Failed to refresh insights');
    } finally {
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#E74C3C';
      case 'medium': return '#F39C12';
      case 'low': return '#27AE60';
      default: return '#666';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return 'trending-up';
      case 'declining': return 'trending-down';
      case 'stable': return 'remove';
      default: return 'help';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#27AE60';
      case 'declining': return '#E74C3C';
      case 'stable': return '#F39C12';
      default: return '#666';
    }
  };

  const renderRecommendationCard = (item: HabitRecommendation) => (
    <NeumorphCard
      key={item.id}
      variant="medium"
      colorType="whiteGlass"
      style={styles.insightCard}
      animated
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightIcon}>
          <Text style={styles.insightEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.insightInfo}>
          <Text style={styles.insightTitle}>{item.title}</Text>
          <View style={styles.insightMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
            <Text style={styles.confidenceText}>{item.confidence}% confidence</Text>
          </View>
        </View>
      </View>

      <Text style={styles.insightDescription}>{item.description}</Text>
      <Text style={styles.suggestedAction}>💡 {item.suggestedAction}</Text>
      <Text style={styles.estimatedImpact}>📈 {item.estimatedImpact}</Text>

      <View style={styles.insightFooter}>
        <Text style={styles.categoryText}>{item.category}</Text>
        {item.type === 'new_habit' && (
          <NeumorphButton
            title="Add Habit"
            variant="primary"
            size="small"
            onPress={() => navigation.navigate('CreateEditHabit', { 
              template: { title: item.title } 
            })}
            style={styles.actionButton}
          />
        )}
      </View>
    </NeumorphCard>
  );

  const renderInsightCard = (item: HabitInsight) => (
    <NeumorphCard
      key={item.id}
      variant="medium"
      colorType="whiteGlass"
      style={styles.insightCard}
      animated
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightTypeIcon}>
          <Ionicons 
            name={item.type === 'pattern' ? 'analytics' : item.type === 'performance' ? 'trophy' : 'time'} 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={styles.insightInfo}>
          <Text style={styles.insightTitle}>{item.title}</Text>
          <Text style={styles.insightType}>{item.type}</Text>
        </View>
        {item.data.trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={getTrendIcon(item.data.trend)} 
              size={20} 
              color={getTrendColor(item.data.trend)} 
            />
            <Text style={[styles.trendText, { color: getTrendColor(item.data.trend) }]}>
              {item.data.trend}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.insightDescription}>{item.description}</Text>
      
      <View style={styles.dataContainer}>
        <Text style={styles.dataLabel}>{item.data.metric}:</Text>
        <Text style={styles.dataValue}>{item.data.value}</Text>
      </View>

      {item.actionable && (
        <View style={styles.actionableContainer}>
          <Ionicons name="bulb" size={16} color="#F39C12" />
          <Text style={styles.actionableText}>This insight suggests actionable steps</Text>
        </View>
      )}
    </NeumorphCard>
  );

  const renderCoachingCard = (item: PersonalizedCoaching) => (
    <NeumorphCard
      key={item.id}
      variant="medium"
      colorType={item.type === 'celebration' ? 'successGlass' : 'primaryGlass'}
      style={styles.insightCard}
      animated
    >
      <View style={styles.coachingHeader}>
        <Ionicons 
          name={
            item.type === 'motivation' ? 'flash' : 
            item.type === 'celebration' ? 'trophy' : 
            item.type === 'strategy' ? 'bulb' : 'chatbubble'
          } 
          size={24} 
          color={item.type === 'celebration' ? '#27AE60' : theme.colors.primary} 
        />
        <Text style={styles.coachingTitle}>{item.title}</Text>
      </View>
      
      <Text style={styles.coachingMessage}>{item.message}</Text>
      
      <View style={styles.coachingFooter}>
        <Text style={styles.coachingType}>{item.type}</Text>
        {item.habitId && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('HabitDetails', { habitId: item.habitId! })}
            style={styles.habitLink}
          >
            <Text style={styles.habitLinkText}>View Habit</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </NeumorphCard>
  );

  const renderCorrelationCard = (item: HabitCorrelation) => (
    <NeumorphCard
      key={`${item.habitA}-${item.habitB}`}
      variant="medium"
      colorType="whiteGlass"
      style={styles.insightCard}
      animated
    >
      <View style={styles.correlationHeader}>
        <View style={styles.correlationIcon}>
          <Ionicons 
            name={item.type === 'positive' ? 'link' : 'unlink'} 
            size={24} 
            color={item.type === 'positive' ? '#27AE60' : '#E74C3C'} 
          />
        </View>
        <Text style={styles.correlationStrength}>
          {item.strength} {item.type} correlation
        </Text>
      </View>

      <View style={styles.habitPair}>
        <Text style={styles.habitName}>{item.habitATitle}</Text>
        <Ionicons 
          name={item.type === 'positive' ? 'add' : 'remove'} 
          size={20} 
          color={item.type === 'positive' ? '#27AE60' : '#E74C3C'} 
        />
        <Text style={styles.habitName}>{item.habitBTitle}</Text>
      </View>

      <Text style={styles.correlationInsight}>{item.insight}</Text>

      <View style={styles.correlationFooter}>
        <Text style={styles.correlationValue}>
          Correlation: {Math.abs(item.correlation * 100).toFixed(0)}%
        </Text>
      </View>
    </NeumorphCard>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'insights':
        return insights.length === 0 ? (
          <NeumorphCard variant="medium" colorType="whiteGlass" style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No Insights Yet</Text>
            <Text style={styles.emptyDescription}>
              Complete more habits to generate personalized insights!
            </Text>
          </NeumorphCard>
        ) : (
          insights.map(renderInsightCard)
        );

      case 'recommendations':
        return recommendations.length === 0 ? (
          <NeumorphCard variant="medium" colorType="whiteGlass" style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>💡</Text>
            <Text style={styles.emptyTitle}>No Recommendations</Text>
            <Text style={styles.emptyDescription}>
              Keep tracking habits to get AI-powered recommendations!
            </Text>
          </NeumorphCard>
        ) : (
          recommendations.map(renderRecommendationCard)
        );

      case 'coaching':
        return coaching.length === 0 ? (
          <NeumorphCard variant="medium" colorType="whiteGlass" style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🧠</Text>
            <Text style={styles.emptyTitle}>No Coaching Messages</Text>
            <Text style={styles.emptyDescription}>
              Your AI coach will provide guidance as you progress!
            </Text>
          </NeumorphCard>
        ) : (
          coaching.map(renderCoachingCard)
        );

      case 'correlations':
        return correlations.length === 0 ? (
          <NeumorphCard variant="medium" colorType="whiteGlass" style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No Correlations Found</Text>
            <Text style={styles.emptyDescription}>
              Track multiple habits to discover patterns and connections!
            </Text>
          </NeumorphCard>
        ) : (
          correlations.map(renderCorrelationCard)
        );
    }
  };

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
          <Text style={styles.headerTitle}>AI Insights</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#333" />
          </TouchableOpacity>
        </NeumorphCard>

        {/* Tab Selection */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          <NeumorphButton
            title="Insights"
            variant={selectedTab === 'insights' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('insights')}
            glassIntensity={selectedTab === 'insights' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Recommendations"
            variant={selectedTab === 'recommendations' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('recommendations')}
            glassIntensity={selectedTab === 'recommendations' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Coaching"
            variant={selectedTab === 'coaching' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('coaching')}
            glassIntensity={selectedTab === 'coaching' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
          <NeumorphButton
            title="Correlations"
            variant={selectedTab === 'correlations' ? 'primary' : 'secondary'}
            size="small"
            onPress={() => setSelectedTab('correlations')}
            glassIntensity={selectedTab === 'correlations' ? 'medium' : 'subtle'}
            style={styles.tabButton}
          />
        </ScrollView>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {renderTabContent()}
        </ScrollView>
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
  refreshButton: {
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
  tabContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tabButton: {
    marginRight: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  insightCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  insightEmoji: {
    fontSize: 24,
  },
  insightTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    marginBottom: theme.spacing.xs,
  },
  insightType: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textTransform: 'capitalize',
  },
  insightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: theme.fontSize.xs,
    color: 'white',
    fontWeight: theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  confidenceText: {
    fontSize: theme.fontSize.xs,
    color: '#666',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  trendText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  insightDescription: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  suggestedAction: {
    fontSize: theme.fontSize.sm,
    color: '#333',
    marginBottom: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
  },
  estimatedImpact: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    marginBottom: theme.spacing.md,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textTransform: 'capitalize',
  },
  actionButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  dataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dataLabel: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    marginBottom: theme.spacing.xs,
  },
  dataValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
  },
  actionableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  actionableText: {
    fontSize: theme.fontSize.xs,
    color: '#F39C12',
    fontWeight: theme.fontWeight.medium,
  },
  coachingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  coachingTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
  },
  coachingMessage: {
    fontSize: theme.fontSize.md,
    color: '#333',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  coachingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachingType: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    textTransform: 'capitalize',
  },
  habitLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  habitLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  correlationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  correlationStrength: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: '#333',
    textTransform: 'capitalize',
  },
  habitPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  habitName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  correlationInsight: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  correlationFooter: {
    alignItems: 'flex-end',
  },
  correlationValue: {
    fontSize: theme.fontSize.sm,
    color: '#666',
    fontWeight: theme.fontWeight.medium,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
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