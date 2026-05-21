import { authService } from "../src/services/auth/AuthService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  multiSet: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance
    (authService as any).currentUser = null;
  });

  describe("login", () => {
    it("should login with valid credentials", async () => {
      // Arrange
      const credentials = {
        email: "test@example.com",
        password: "testpass123",
      };

      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.multiSet.mockResolvedValue();

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(credentials.email);
      expect(result.token).toBeDefined();
      expect(mockAsyncStorage.multiSet).toHaveBeenCalled();
    });

    it("should throw error for invalid credentials", async () => {
      // Arrange
      const credentials = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw error for missing credentials", async () => {
      // Arrange
      const credentials = {
        email: "",
        password: "",
      };

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });

  describe("register", () => {
    it("should register new user successfully", async () => {
      // Arrange
      const userData = {
        email: "newuser@example.com",
        password: "testpass123",
        name: "New User",
        confirmPassword: "testpass123",
      };

      mockAsyncStorage.multiSet.mockResolvedValue();

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.token).toBeDefined();
      expect(mockAsyncStorage.multiSet).toHaveBeenCalled();
    });

    it("should register user even with password mismatch (no validation)", async () => {
      // Arrange
      const userData = {
        email: "newuser@example.com",
        password: "testpass123",
        name: "New User",
        confirmPassword: "differentpass",
      };

      mockAsyncStorage.multiSet.mockResolvedValue();

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
    });
  });

  describe("logout", () => {
    it("should clear stored authentication data", async () => {
      // Arrange
      mockAsyncStorage.multiRemove.mockResolvedValue();

      // Act
      await authService.logout();

      // Assert
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        "auth_token",
        "refresh_token",
        "user_data",
        "auth_token",
      ]);
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user when authenticated", async () => {
      // Arrange
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        name: "Test User",
      };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));

      // Act
      const user = await authService.getCurrentUser();

      // Assert
      expect(user).toEqual(mockUser);
    });

    it("should return null when not authenticated", async () => {
      // Arrange
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Act
      const user = await authService.getCurrentUser();

      // Assert
      expect(user).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when user is authenticated", () => {
      // Arrange
      (authService as any).currentUser = { id: "user123" };

      // Act
      const isAuth = authService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(true);
    });

    it("should return false when user is not authenticated", () => {
      // Arrange
      (authService as any).currentUser = null;

      // Act
      const isAuth = authService.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });
  });

  describe("upgradeToTrial", () => {
    it("should upgrade free user to trial", async () => {
      // Arrange
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        subscriptionStatus: "free",
      };

      (authService as any).currentUser = mockUser;
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const updatedUser = await authService.upgradeToTrial();

      // Assert
      expect(updatedUser.subscriptionStatus).toBe("trial");
      expect(updatedUser.trialStartDate).toBeDefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should throw error if user already has trial", async () => {
      // Arrange
      const mockUser = {
        id: "user123",
        subscriptionStatus: "trial",
      };

      (authService as any).currentUser = mockUser;

      // Act & Assert
      await expect(authService.upgradeToTrial()).rejects.toThrow(
        "User already has a trial"
      );
    });
  });

  describe("upgradeToPremium", () => {
    it("should upgrade user to premium", async () => {
      // Arrange
      const mockUser = {
        id: "user123",
        email: "test@example.com",
        subscriptionStatus: "trial",
      };

      (authService as any).currentUser = mockUser;
      mockAsyncStorage.setItem.mockResolvedValue();

      // Act
      const updatedUser = await authService.upgradeToPremium();

      // Assert
      expect(updatedUser.subscriptionStatus).toBe("premium");
      expect(updatedUser.subscriptionEndDate).toBeDefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("getMaxHabitsForUser", () => {
    it("should return unlimited for premium users", () => {
      // Arrange
      const premiumUser = {
        id: "user123",
        subscriptionStatus: "premium",
      };

      // Act
      const maxHabits = authService.getMaxHabitsForUser(premiumUser);

      // Assert
      expect(maxHabits).toBe(Infinity);
    });

    it("should return unlimited for active trial users", () => {
      // Arrange
      const trialUser = {
        id: "user123",
        subscriptionStatus: "trial",
        trialStartDate: new Date().toISOString(),
      };

      // Act
      const maxHabits = authService.getMaxHabitsForUser(trialUser);

      // Assert
      expect(maxHabits).toBe(Infinity);
    });

    it("should return 3 for free users", () => {
      // Arrange
      const freeUser = {
        id: "user123",
        subscriptionStatus: "free",
      };

      // Act
      const maxHabits = authService.getMaxHabitsForUser(freeUser);

      // Assert
      expect(maxHabits).toBe(3);
    });
  });

  describe("isTrialExpired", () => {
    it("should return true for expired trial", () => {
      // Arrange
      const expiredTrialUser = {
        id: "user123",
        subscriptionStatus: "trial",
        trialStartDate: new Date(
          Date.now() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(), // 8 days ago
      };

      // Act
      const isExpired = authService.isTrialExpired(expiredTrialUser);

      // Assert
      expect(isExpired).toBe(true);
    });

    it("should return false for active trial", () => {
      // Arrange
      const activeTrialUser = {
        id: "user123",
        subscriptionStatus: "trial",
        trialStartDate: new Date().toISOString(),
      };

      // Act
      const isExpired = authService.isTrialExpired(activeTrialUser);

      // Assert
      expect(isExpired).toBe(false);
    });
  });
});
