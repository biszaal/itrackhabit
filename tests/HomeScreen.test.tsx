import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { HomeScreen } from "../src/screens/HomeScreen";
import { useAuth } from "../src/contexts/AuthContext";
import { dataService } from "../src/services/core/DataService";
import { timerService } from "../src/services/habits/TimerService";

// Mock dependencies
jest.mock("../src/contexts/AuthContext");
jest.mock("../src/services/core/DataService");
jest.mock("../src/services/habits/TimerService");
jest.mock("../src/hooks/useSmartNotifications", () => ({
  useSmartNotifications: () => ({
    isInitialized: true,
    preferences: null,
    updatePreferences: jest.fn(),
    scheduleHabitNotifications: jest.fn(),
    onHabitCompleted: jest.fn(),
    recordActivity: jest.fn(),
    refreshNotifications: jest.fn(),
  }),
  useNotificationSettings: () => ({
    preferences: null,
    isLoading: false,
    isInitialized: true,
    toggleEnabled: jest.fn(),
    toggleHabitReminders: jest.fn(),
    toggleStreakProtection: jest.fn(),
    toggleMotivationalMessages: jest.fn(),
    updateQuietHours: jest.fn(),
    updateFrequency: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockDataService = dataService as jest.Mocked<typeof dataService>;
const mockTimerService = timerService as jest.Mocked<typeof timerService>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {},
};

// Helper function to render HomeScreen with NavigationContainer
const renderHomeScreen = (props = {}) => {
  return render(
    <NavigationContainer>
      <HomeScreen navigation={mockNavigation} route={mockRoute} {...props} />
    </NavigationContainer>
  );
};

describe("HomeScreen", () => {
  const mockHabits = [
    {
      id: "habit1",
      title: "Exercise 30 min",
      notes: "Daily exercise",
      frequency: "daily",
      targetConfig: {
        hasTarget: true,
        targetValue: 30,
        unit: "minutes",
        isTimeBased: true,
      },
      isDoneToday: false,
      currentProgress: null,
      completionStatus: "not_done",
    },
    {
      id: "habit2",
      title: "Meditate 30 min",
      notes: "Daily meditation",
      frequency: "daily",
      targetConfig: {
        hasTarget: true,
        targetValue: 30,
        unit: "minutes",
        isTimeBased: true,
      },
      isDoneToday: true,
      currentProgress: {
        id: "progress1",
        habitId: "habit2",
        date: "2024-01-01",
        status: "done",
        currentValue: 30,
        targetValue: 30,
      },
      completionStatus: "done",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "user123", email: "test@example.com" },
      loading: false,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    mockDataService.initialize.mockResolvedValue();
    mockDataService.getHabits.mockResolvedValue(mockHabits);
    mockDataService.getHabitProgressForDate.mockResolvedValue(null);
    mockTimerService.getTimer.mockReturnValue(null);
  });

  it("should render greeting and date", async () => {
    // Act
    const { getByText } = renderHomeScreen();

    // Assert
    await waitFor(() => {
      expect(getByText(/Good (morning|afternoon|evening)!/)).toBeTruthy();
      expect(getByText(/Today/)).toBeTruthy();
    });
  });

  it("should display habits list", async () => {
    // Act
    const { getByText } = renderHomeScreen();

    // Assert
    await waitFor(() => {
      expect(getByText("Exercise 30 min")).toBeTruthy();
      expect(getByText("Meditate 30 min")).toBeTruthy();
    });
  });

  it("should show progress percentage", async () => {
    // Act
    const { getByText } = renderHomeScreen();

    // Assert
    await waitFor(() => {
      expect(getByText("0%")).toBeTruthy(); // 0 out of 2 habits completed
      expect(getByText("0/2")).toBeTruthy();
    });
  });

  it("should handle habit press", async () => {
    // Act
    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      const habitCard = getByText("Exercise 30 min");
      fireEvent.press(habitCard);
    });

    // Assert
    expect(mockNavigation.navigate).toHaveBeenCalledWith("HabitTimer", {
      habitId: "habit1",
    });
  });

  it("should show loading state initially", () => {
    // Arrange
    mockDataService.getHabits.mockImplementation(() => new Promise(() => {})); // Never resolves

    // Act
    const { getByText } = renderHomeScreen();

    // Assert
    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should display correct emoji for habits", async () => {
    // Act
    const { getByText } = renderHomeScreen();

    // Assert
    await waitFor(() => {
      expect(getByText("💪")).toBeTruthy(); // Exercise emoji
      expect(getByText("🧘")).toBeTruthy(); // Meditation emoji
    });
  });

  it("should handle empty habits list", async () => {
    // Arrange
    mockDataService.getHabits.mockResolvedValue([]);

    // Act
    const { getByText } = renderHomeScreen();

    // Assert
    await waitFor(() => {
      expect(getByText("0")).toBeTruthy(); // Habit count should be 0
    });
  });
});
