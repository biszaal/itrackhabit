import { apiClient } from '../../config/api';
import { Friend, User } from '../../types';

class BackendFriendsService {
  
  // Get user's friends list
  async getFriends(): Promise<Friend[]> {
    try {
      console.log('👥 Fetching friends from backend...');
      const response = await apiClient.get<Friend[]>('/api/friends');
      console.log(`✅ Fetched ${response.length} friends from backend`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to fetch friends:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch friends';
      throw new Error(message);
    }
  }

  // Search for users by email or name
  async searchUsers(query: string): Promise<User[]> {
    try {
      console.log('🔍 Searching users via backend...', query);
      const response = await apiClient.get<User[]>(`/api/friends/search?q=${encodeURIComponent(query)}`);
      console.log(`✅ Found ${response.length} users matching "${query}"`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to search users:', error);
      const message = error instanceof Error ? error.message : 'Failed to search users';
      throw new Error(message);
    }
  }

  // Send friend request
  async sendFriendRequest(userEmail: string): Promise<Friend> {
    try {
      console.log('📤 Sending friend request via backend...', userEmail);
      const response = await apiClient.post<Friend>('/api/friends/request', { userEmail });
      console.log('✅ Friend request sent successfully to:', userEmail);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to send friend request:', error);
      const message = error instanceof Error ? error.message : 'Failed to send friend request';
      throw new Error(message);
    }
  }

  // Accept friend request
  async acceptFriendRequest(friendshipId: string): Promise<Friend> {
    try {
      console.log('✅ Accepting friend request via backend...', friendshipId);
      const response = await apiClient.post<Friend>(`/api/friends/${friendshipId}/accept`);
      console.log('✅ Friend request accepted successfully');
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to accept friend request:', error);
      const message = error instanceof Error ? error.message : 'Failed to accept friend request';
      throw new Error(message);
    }
  }

  // Reject friend request
  async rejectFriendRequest(friendshipId: string): Promise<void> {
    try {
      console.log('❌ Rejecting friend request via backend...', friendshipId);
      await apiClient.post(`/api/friends/${friendshipId}/reject`);
      console.log('✅ Friend request rejected successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to reject friend request:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject friend request';
      throw new Error(message);
    }
  }

  // Remove friend
  async removeFriend(friendshipId: string): Promise<void> {
    try {
      console.log('🗑️ Removing friend via backend...', friendshipId);
      await apiClient.delete(`/api/friends/${friendshipId}`);
      console.log('✅ Friend removed successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to remove friend:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove friend';
      throw new Error(message);
    }
  }

  // Block user
  async blockUser(friendshipId: string): Promise<void> {
    try {
      console.log('🚫 Blocking user via backend...', friendshipId);
      await apiClient.post(`/api/friends/${friendshipId}/block`);
      console.log('✅ User blocked successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to block user:', error);
      const message = error instanceof Error ? error.message : 'Failed to block user';
      throw new Error(message);
    }
  }

  // Get pending friend requests
  async getPendingRequests(): Promise<Friend[]> {
    try {
      console.log('⏳ Fetching pending requests from backend...');
      const response = await apiClient.get<Friend[]>('/api/friends/pending');
      console.log(`✅ Fetched ${response.length} pending requests`);
      return response;
    } catch (error: unknown) {
      console.error('❌ Failed to fetch pending requests:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch pending requests';
      throw new Error(message);
    }
  }
}

export const backendFriendsService = new BackendFriendsService();