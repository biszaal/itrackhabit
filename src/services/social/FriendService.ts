import { apiClient, API_CONFIG } from '../../constants/api';
import { 
  User, 
  Friend, 
  FriendRequest, 
  FriendWithUser,
  FriendWithDetails 
} from '../../types';

class FriendService {
  // Search users by email or name
  async searchUsers(query: string): Promise<User[]> {
    try {
      if (query.length < 2) return [];
      
      const users = await apiClient.get<User[]>(
        `${API_CONFIG.ENDPOINTS.FRIENDS.SEARCH}?q=${encodeURIComponent(query)}`
      );
      
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get current user's friends
  async getFriends(): Promise<FriendWithDetails[]> {
    try {
      const friends = await apiClient.get<FriendWithDetails[]>(
        API_CONFIG.ENDPOINTS.FRIENDS.LIST
      );
      
      return friends || [];
    } catch (error) {
      return [];
    }
  }

  // Get friend requests (received and sent)
  async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      const requests = await apiClient.get<FriendRequest[]>(
        API_CONFIG.ENDPOINTS.FRIENDS.REQUESTS
      );
      
      return requests || [];
    } catch (error) {
      return [];
    }
  }

  // Get pending friend requests (alias for getFriendRequests for compatibility)
  async getPendingFriendRequests(): Promise<FriendRequest[]> {
    return this.getFriendRequests();
  }

  // Send friend request
  async sendFriendRequest(targetUserId: string): Promise<FriendRequest> {
    try {
      const request = await apiClient.post<FriendRequest>(
        API_CONFIG.ENDPOINTS.FRIENDS.SEND_REQUEST,
        { targetUserId }
      );
      
      return request;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      await apiClient.post(
        apiClient.replacePath(API_CONFIG.ENDPOINTS.FRIENDS.ACCEPT_REQUEST, { id: requestId })
      );
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  // Decline friend request
  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      await apiClient.post(
        apiClient.replacePath(API_CONFIG.ENDPOINTS.FRIENDS.DECLINE_REQUEST, { id: requestId })
      );
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  // Remove friend
  async removeFriend(friendId: string): Promise<void> {
    try {
      await apiClient.delete(
        apiClient.replacePath(API_CONFIG.ENDPOINTS.FRIENDS.REMOVE_FRIEND, { id: friendId })
      );
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  // Get friend's habits (if they allow sharing)
  async getFriendHabits(friendId: string): Promise<any[]> {
    try {
      const habits = await apiClient.get<any[]>(
        `/friends/${friendId}/habits`
      );
      
      return habits;
    } catch (error) {
      console.error('Error fetching friend habits:', error);
      return [];
    }
  }

  // Get friend's stats
  async getFriendStats(friendId: string): Promise<any> {
    try {
      const stats = await apiClient.get<any>(
        `/friends/${friendId}/stats`
      );
      
      return stats;
    } catch (error) {
      console.error('Error fetching friend stats:', error);
      return null;
    }
  }

  // Check if users are friends
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      const result = await apiClient.get<{ areFriends: boolean }>(
        `/friends/check?userId1=${userId1}&userId2=${userId2}`
      );
      
      return result.areFriends;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return false;
    }
  }

  // Get friendship status between current user and another user
  async getFriendshipStatus(targetUserId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> {
    try {
      const result = await apiClient.get<{ status: 'none' | 'pending_sent' | 'pending_received' | 'friends' }>(
        `/friends/status/${targetUserId}`
      );
      
      return result.status;
    } catch (error) {
      console.error('Error getting friendship status:', error);
      return 'none';
    }
  }

  // Get mutual friends between current user and another user
  async getMutualFriends(targetUserId: string): Promise<User[]> {
    try {
      const mutualFriends = await apiClient.get<User[]>(
        `/friends/${targetUserId}/mutual`
      );
      
      return mutualFriends;
    } catch (error) {
      console.error('Error fetching mutual friends:', error);
      return [];
    }
  }

  // Get suggested friends (based on mutual connections, etc.)
  async getSuggestedFriends(): Promise<User[]> {
    try {
      const suggestions = await apiClient.get<User[]>(
        '/friends/suggestions'
      );
      
      return suggestions;
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
      return [];
    }
  }
}

export const friendService = new FriendService();