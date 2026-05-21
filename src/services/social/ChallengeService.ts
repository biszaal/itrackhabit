import { apiClient } from '../../config/api';
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
      console.log('🏆 ChallengeService.getActiveChallenges - Starting API call');
      
      const challenges = await apiClient.get<Challenge[]>(
        '/api/challenges/active'
      );
      
      console.log('✅ ChallengeService.getActiveChallenges - Success:', challenges);
      return challenges;
    } catch (error: unknown) {
      console.error('❌ ChallengeService.getActiveChallenges - Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error details:', message);
      return [];
    }
  }

  // Get challenges available to join
  async getAvailableChallenges(): Promise<Challenge[]> {
    try {
      const challenges = await apiClient.get<Challenge[]>(
        '/api/challenges/available'
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
      // TODO: Implement get specific challenge endpoint in backend
      console.log('⚠️ getChallenge: Endpoint not implemented in backend');
      return null;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      return null;
    }
  }

  // Create a new challenge
  async createChallenge(challengeData: CreateChallengeRequest): Promise<Challenge> {
    try {
      // TODO: Implement create challenge endpoint in backend
      console.log('⚠️ createChallenge: Endpoint not implemented in backend');
      console.log('Challenge data:', challengeData);
      throw new Error('Create challenge endpoint not implemented');
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  // Join a challenge
  async joinChallenge(challengeId: string): Promise<void> {
    try {
      await apiClient.post(
        `/api/challenges/${challengeId}/join`
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
        `/api/challenges/${challengeId}/leave`
      );
    } catch (error) {
      console.error('Error leaving challenge:', error);
      throw error;
    }
  }

  // Get challenge participants
  async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    try {
      // TODO: Implement get challenge participants endpoint in backend
      console.log('⚠️ getChallengeParticipants: Endpoint not implemented in backend');
      return [];
    } catch (error) {
      console.error('Error fetching challenge participants:', error);
      return [];
    }
  }

  // Get challenge leaderboard
  async getChallengeLeaderboard(challengeId: string): Promise<any[]> {
    try {
      // TODO: Implement challenge leaderboard endpoint in backend
      console.log('⚠️ getChallengeLeaderboard: Endpoint not implemented in backend');
      return [];
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
      // TODO: Implement challenge progress endpoint in backend
      console.log('⚠️ updateChallengeProgress: Endpoint not implemented in backend');
      console.log('Progress data:', progressData);
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  // Get user's progress in a specific challenge
  async getUserChallengeProgress(challengeId: string): Promise<ChallengeProgress | null> {
    try {
      // TODO: Implement user challenge progress endpoint in backend
      console.log('⚠️ getUserChallengeProgress: Endpoint not implemented in backend');
      return null;
    } catch (error) {
      console.error('Error fetching user challenge progress:', error);
      return null;
    }
  }

  // Invite friends to join a challenge
  async inviteFriendsToChallenge(challengeId: string, friendIds: string[]): Promise<void> {
    try {
      // TODO: Implement invite friends to challenge endpoint in backend
      console.log('⚠️ inviteFriendsToChallenge: Endpoint not implemented in backend');
      console.log('Challenge ID:', challengeId, 'Friend IDs:', friendIds);
    } catch (error) {
      console.error('Error inviting friends to challenge:', error);
      throw error;
    }
  }

  // Get challenge invitations for current user
  async getChallengeInvitations(): Promise<any[]> {
    try {
      // TODO: Implement challenge invitations endpoint in backend
      console.log('⚠️ getChallengeInvitations: Endpoint not implemented in backend');
      return [];
    } catch (error) {
      console.error('Error fetching challenge invitations:', error);
      return [];
    }
  }

  // Accept challenge invitation
  async acceptChallengeInvitation(invitationId: string): Promise<void> {
    try {
      // TODO: Implement accept challenge invitation endpoint in backend
      console.log('⚠️ acceptChallengeInvitation: Endpoint not implemented in backend');
    } catch (error) {
      console.error('Error accepting challenge invitation:', error);
      throw error;
    }
  }

  // Decline challenge invitation
  async declineChallengeInvitation(invitationId: string): Promise<void> {
    try {
      // TODO: Implement decline challenge invitation endpoint in backend
      console.log('⚠️ declineChallengeInvitation: Endpoint not implemented in backend');
    } catch (error) {
      console.error('Error declining challenge invitation:', error);
      throw error;
    }
  }

  // Get trending/popular challenges
  async getTrendingChallenges(): Promise<Challenge[]> {
    try {
      // For now, return available challenges since /challenges/trending doesn't exist
      // TODO: Implement trending challenges endpoint in backend
      console.log('⚠️ getTrendingChallenges: Using available challenges as fallback');
      const challenges = await apiClient.get<Challenge[]>(
        '/api/challenges/available'
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
      
      // For now, return available challenges filtered by query
      // TODO: Implement challenge search endpoint in backend
      console.log('⚠️ searchChallenges: Using available challenges as fallback');
      const challenges = await apiClient.get<Challenge[]>('/api/challenges/available');
      
      // Filter challenges by query on frontend for now
      return challenges.filter(challenge => 
        challenge.title.toLowerCase().includes(query.toLowerCase()) ||
        (challenge.description && challenge.description.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching challenges:', error);
      return [];
    }
  }

  // Check if user can join a challenge
  async canJoinChallenge(challengeId: string): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      // TODO: Implement can join challenge endpoint in backend
      console.log('⚠️ canJoinChallenge: Endpoint not implemented, assuming user can join');
      return { canJoin: true };
    } catch (error) {
      console.error('Error checking if user can join challenge:', error);
      return { canJoin: false, reason: 'Unable to check eligibility' };
    }
  }

  // Get challenges from friends (using available challenges for now)
  async getFriendChallenges(): Promise<Challenge[]> {
    try {
      // For now, return available challenges since /api/challenges/friends doesn't exist
      // TODO: Implement friend-specific challenges endpoint in backend
      console.log('⚠️ getFriendChallenges: Using available challenges as fallback');
      const challenges = await apiClient.get<Challenge[]>(
        '/api/challenges/available'
      );
      
      return challenges;
    } catch (error) {
      console.error('Error fetching friend challenges:', error);
      return [];
    }
  }
}

export const challengeService = new ChallengeService();