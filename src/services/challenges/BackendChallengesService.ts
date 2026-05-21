import { apiClient } from '../../config/api';
import { Challenge, ChallengeProgress } from '../../types';

class BackendChallengesService {
  
  // Get all challenges
  async getChallenges(): Promise<Challenge[]> {
    try {
      console.log('🏆 Fetching challenges from backend...');
      const response = await apiClient.get<Challenge[]>('/api/challenges');
      console.log(`✅ Fetched ${response.length} challenges from backend`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to fetch challenges:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch challenges';
      throw new Error(message);
    }
  }

  // Get challenges created by friends
  async getFriendChallenges(): Promise<Challenge[]> {
    try {
      console.log('👥 Fetching friend challenges from backend...');
      const response = await apiClient.get<Challenge[]>('/api/challenges/friends');
      console.log(`✅ Fetched ${response.length} friend challenges from backend`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to fetch friend challenges:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch friend challenges';
      throw new Error(message);
    }
  }

  // Get user's challenge progress
  async getChallengeProgress(challengeId: string): Promise<ChallengeProgress[]> {
    try {
      console.log('📊 Fetching challenge progress from backend...', challengeId);
      const response = await apiClient.get<ChallengeProgress[]>(`/api/challenges/${challengeId}/progress`);
      console.log(`✅ Fetched challenge progress for ${challengeId}`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to fetch challenge progress:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch challenge progress';
      throw new Error(message);
    }
  }

  // Create a new challenge
  async createChallenge(challengeData: {
    title: string;
    description?: string;
    type: 'streak' | 'completion' | 'custom';
    habitId?: string;
    startDate: string;
    endDate: string;
    members?: string[];
  }): Promise<Challenge> {
    try {
      console.log('➕ Creating challenge via backend...', challengeData.title);
      const response = await apiClient.post<Challenge>('/api/challenges', challengeData);
      console.log('✅ Challenge created successfully:', response.id);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to create challenge:', error);
      const message = error instanceof Error ? error.message : 'Failed to create challenge';
      throw new Error(message);
    }
  }

  // Join a challenge
  async joinChallenge(challengeId: string): Promise<void> {
    try {
      console.log('🎯 Joining challenge via backend...', challengeId);
      await apiClient.post(`/api/challenges/${challengeId}/join`);
      console.log('✅ Successfully joined challenge:', challengeId);
    } catch (error: unknown) {
      console.error('❌ Failed to join challenge:', error);
      const message = error instanceof Error ? error.message : 'Failed to join challenge';
      throw new Error(message);
    }
  }

  // Leave a challenge
  async leaveChallenge(challengeId: string): Promise<void> {
    try {
      console.log('🚪 Leaving challenge via backend...', challengeId);
      await apiClient.post(`/api/challenges/${challengeId}/leave`);
      console.log('✅ Successfully left challenge:', challengeId);
    } catch (error: unknown) {
      console.error('❌ Failed to leave challenge:', error);
      const message = error instanceof Error ? error.message : 'Failed to leave challenge';
      throw new Error(message);
    }
  }

  // Update challenge progress
  async updateChallengeProgress(challengeId: string, progressData: {
    score?: number;
    lastActivityDate?: string;
  }): Promise<ChallengeProgress> {
    try {
      console.log('📈 Updating challenge progress via backend...', challengeId);
      const response = await apiClient.put<ChallengeProgress>(`/api/challenges/${challengeId}/progress`, progressData);
      console.log('✅ Challenge progress updated successfully');
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to update challenge progress:', error);
      const message = error instanceof Error ? error.message : 'Failed to update challenge progress';
      throw new Error(message);
    }
  }
}

export const backendChallengesService = new BackendChallengesService();