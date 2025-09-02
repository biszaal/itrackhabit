import { apiClient, API_CONFIG } from '../../constants/api';
import { 
  Challenge,
  ChallengeWithParticipants,
  ChallengeParticipant,
  ChallengeProgress,
  CreateChallengeRequest,
  User
} from '../../types';

class ChallengeService {
  // Get all challenges (user's active and available to join)
  async getChallenges(): Promise<{ active: Challenge[]; available: Challenge[] }> {
    try {
      const [active, available] = await Promise.all([
        this.getActiveChallenges(),
        this.getAvailableChallenges()
      ]);

      return { active, available };
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return { active: [], available: [] };
    }
  }

  // Get all challenges for the current user (alias for getActiveChallenges)
  async getUserChallenges(): Promise<Challenge[]> {
    return this.getActiveChallenges();
  }

  // Get challenges user is currently participating in
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const challenges = await apiClient.get<Challenge[]>(
        API_CONFIG.ENDPOINTS.CHALLENGES.LIST + '?status=active'
      );
      
      return challenges;
    } catch (error) {
      console.error('Error fetching active challenges:', error);
      return [];
    }
  }

  // Get challenges available to join
  async getAvailableChallenges(): Promise<Challenge[]> {
    try {
      const challenges = await apiClient.get<Challenge[]>(
        API_CONFIG.ENDPOINTS.CHALLENGES.LIST + '?status=available'
      );
      
      return challenges;
    } catch (error) {
      console.error('Error fetching available challenges:', error);
      return [];
    }
  }

  // Get specific challenge details
  async getChallenge(challengeId: string): Promise<Challenge | null> {
    try {
      const challenge = await apiClient.get<Challenge>(
        apiClient.replacePath(API_CONFIG.ENDPOINTS.CHALLENGES.GET, { id: challengeId })
      );
      
      return challenge;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      return null;
    }
  }

  // Create a new challenge
  async createChallenge(challengeData: CreateChallengeRequest): Promise<Challenge> {
    try {
      const challenge = await apiClient.post<Challenge>(
        API_CONFIG.ENDPOINTS.CHALLENGES.CREATE,
        challengeData
      );
      
      return challenge;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  // Join a challenge
  async joinChallenge(challengeId: string): Promise<void> {
    try {
      await apiClient.post(
        apiClient.replacePath(API_CONFIG.ENDPOINTS.CHALLENGES.JOIN, { id: challengeId })
      );
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  // Leave a challenge
  async leaveChallenge(challengeId: string): Promise<void> {
    try {
      await apiClient.post(
        apiClient.replacePath(API_CONFIG.ENDPOINTS.CHALLENGES.LEAVE, { id: challengeId })
      );
    } catch (error) {
      console.error('Error leaving challenge:', error);
      throw error;
    }
  }

  // Get challenge participants
  async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    try {
      const participants = await apiClient.get<ChallengeParticipant[]>(
        apiClient.replacePath(API_CONFIG.ENDPOINTS.CHALLENGES.PARTICIPANTS, { id: challengeId })
      );
      
      return participants;
    } catch (error) {
      console.error('Error fetching challenge participants:', error);
      return [];
    }
  }

  // Get challenge leaderboard
  async getChallengeLeaderboard(challengeId: string): Promise<any[]> {
    try {
      const leaderboard = await apiClient.get<any[]>(
        `/challenges/${challengeId}/leaderboard`
      );
      
      return leaderboard;
    } catch (error) {
      console.error('Error fetching challenge leaderboard:', error);
      return [];
    }
  }

  // Update challenge progress (called when user completes habit)
  async updateChallengeProgress(challengeId: string, progressData: {
    value?: number;
    completed?: boolean;
    notes?: string;
  }): Promise<void> {
    try {
      await apiClient.post(
        `/challenges/${challengeId}/progress`,
        progressData
      );
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  // Get user's progress in a specific challenge
  async getUserChallengeProgress(challengeId: string): Promise<ChallengeProgress | null> {
    try {
      const progress = await apiClient.get<ChallengeProgress>(
        `/challenges/${challengeId}/my-progress`
      );
      
      return progress;
    } catch (error) {
      console.error('Error fetching user challenge progress:', error);
      return null;
    }
  }

  // Invite friends to join a challenge
  async inviteFriendsToChallenge(challengeId: string, friendIds: string[]): Promise<void> {
    try {
      await apiClient.post(
        `/challenges/${challengeId}/invite`,
        { friendIds }
      );
    } catch (error) {
      console.error('Error inviting friends to challenge:', error);
      throw error;
    }
  }

  // Get challenge invitations for current user
  async getChallengeInvitations(): Promise<any[]> {
    try {
      const invitations = await apiClient.get<any[]>(
        '/challenges/invitations'
      );
      
      return invitations;
    } catch (error) {
      console.error('Error fetching challenge invitations:', error);
      return [];
    }
  }

  // Accept challenge invitation
  async acceptChallengeInvitation(invitationId: string): Promise<void> {
    try {
      await apiClient.post(
        `/challenges/invitations/${invitationId}/accept`
      );
    } catch (error) {
      console.error('Error accepting challenge invitation:', error);
      throw error;
    }
  }

  // Decline challenge invitation
  async declineChallengeInvitation(invitationId: string): Promise<void> {
    try {
      await apiClient.post(
        `/challenges/invitations/${invitationId}/decline`
      );
    } catch (error) {
      console.error('Error declining challenge invitation:', error);
      throw error;
    }
  }

  // Get trending/popular challenges
  async getTrendingChallenges(): Promise<Challenge[]> {
    try {
      const challenges = await apiClient.get<Challenge[]>(
        '/challenges/trending'
      );
      
      return challenges;
    } catch (error) {
      console.error('Error fetching trending challenges:', error);
      return [];
    }
  }

  // Search challenges
  async searchChallenges(query: string): Promise<Challenge[]> {
    try {
      if (query.length < 2) return [];
      
      const challenges = await apiClient.get<Challenge[]>(
        `/challenges/search?q=${encodeURIComponent(query)}`
      );
      
      return challenges;
    } catch (error) {
      console.error('Error searching challenges:', error);
      return [];
    }
  }

  // Check if user can join a challenge
  async canJoinChallenge(challengeId: string): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      const result = await apiClient.get<{ canJoin: boolean; reason?: string }>(
        `/challenges/${challengeId}/can-join`
      );
      
      return result;
    } catch (error) {
      console.error('Error checking if user can join challenge:', error);
      return { canJoin: false, reason: 'Unable to check eligibility' };
    }
  }

  // Get challenges from friends
  async getFriendChallenges(): Promise<Challenge[]> {
    try {
      const challenges = await apiClient.get<Challenge[]>(
        '/challenges/friends'
      );
      
      return challenges;
    } catch (error) {
      console.error('Error fetching friend challenges:', error);
      return [];
    }
  }
}

export const challengeService = new ChallengeService();