import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
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

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {},
};

// HomeScreen calls useSafeAreaInsets, which needs a provider with metrics —
// there is no real window to measure in the test renderer.
const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderHomeScreen = (props = {}) =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <NavigationContainer>
        {/* Partial navigation/route stubs — HomeScreen only uses navigate. */}
        <HomeScreen
          navigation={mockNavigation as any}
          route={mockRoute as any}
          {...props}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );

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
      currentStreak: 0,
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
      currentStreak: 4,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: "user123", name: "Sam Rivers", email: "test@example.com" },
      loading: false,
      isAuthenticated: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    } as any);

    // HomeScreen loads through getUserData, not getHabits.
    mockDataService.getUserData.mockResolvedValue({ habits: mockHabits } as any);
    mockDataService.markHabitProgress.mockResolvedValue({} as any);
    mockTimerService.getTimer.mockReturnValue(null as any);
  });

  it("greets the user by first name", async () => {
    const { getByText } = renderHomeScreen();

    // The greeting and name share one <Text>, so match the composed string.
    await waitFor(() => {
      expect(getByText(/Good (morning|afternoon|evening),\s*Sam\./)).toBeTruthy();
    });
  });

  it("displays the habits list", async () => {
    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      expect(getByText("Exercise 30 min")).toBeTruthy();
      expect(getByText("Meditate 30 min")).toBeTruthy();
    });
  });

  it("shows today's completion progress", async () => {
    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      // one of two habits done
      expect(getByText("1 of 2 done")).toBeTruthy();
      // the ring label renders the number and "%" as sibling nodes
      expect(getByText(/^50\s*%$/)).toBeTruthy();
    });
  });

  it("shows the best current streak", async () => {
    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      expect(getByText("4")).toBeTruthy();
    });
  });

  it("opens habit details when a habit is pressed", async () => {
    const { getByText } = renderHomeScreen();

    await waitFor(() => expect(getByText("Exercise 30 min")).toBeTruthy());
    fireEvent.press(getByText("Exercise 30 min"));

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith("HabitDetails", {
        habitId: "habit1",
      });
    });
  });

  it("shows the empty state when there are no habits", async () => {
    mockDataService.getUserData.mockResolvedValue({ habits: [] } as any);

    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      expect(getByText("No habits yet — start with one.")).toBeTruthy();
      expect(getByText("Create a habit")).toBeTruthy();
    });
  });

  it("routes to templates from the empty state", async () => {
    mockDataService.getUserData.mockResolvedValue({ habits: [] } as any);

    const { getByText } = renderHomeScreen();

    await waitFor(() => expect(getByText("Create a habit")).toBeTruthy());
    fireEvent.press(getByText("Create a habit"));

    expect(mockNavigation.navigate).toHaveBeenCalledWith("HabitTemplates");
  });

  it("keeps a habit checked after its timer is reset by completing it", async () => {
    // Completing a timed session marks the habit done and resets the timer to
    // zero. The reset timer must not drag the row back to "not done yet".
    mockDataService.getHabitProgressForDate.mockImplementation(
      async (habitId: string) =>
        habitId === "habit1"
          ? ({ id: "p1", habitId, status: "done", currentValue: 0 } as any)
          : null
    );
    mockTimerService.getTimer.mockImplementation((habitId: string) =>
      habitId === "habit1"
        ? ({
            habitId,
            currentTime: 0,
            targetTime: 1800,
            isRunning: false,
            isPaused: false,
            startTime: Date.now(),
          } as any)
        : (null as any)
    );

    const { getByLabelText } = renderHomeScreen();

    await waitFor(() => {
      expect(
        getByLabelText("Mark Exercise 30 min as not done")
      ).toBeTruthy();
    });
  });

  it("marks a running timed habit done when its checkbox is tapped", async () => {
    mockDataService.getHabitProgressForDate.mockResolvedValue(null as any);
    mockTimerService.getTimer.mockImplementation((habitId: string) =>
      habitId === "habit1"
        ? ({
            habitId,
            // 5 minutes into a 30 minute session — the row renders as partial.
            currentTime: 300,
            targetTime: 1800,
            isRunning: true,
            isPaused: false,
            startTime: Date.now(),
          } as any)
        : (null as any)
    );
    mockDataService.markHabitProgress.mockResolvedValue({
      id: "p1",
      habitId: "habit1",
      status: "done",
      currentValue: 5,
    } as any);

    const { getByLabelText } = renderHomeScreen();

    const partialButton = await waitFor(() =>
      getByLabelText("Mark Exercise 30 min as done, currently 5 of 30")
    );
    fireEvent.press(partialButton);

    await waitFor(() => {
      expect(mockDataService.markHabitProgress).toHaveBeenCalledWith(
        "habit1",
        expect.any(String),
        "done"
      );
      // The session should not keep ticking on a completed habit.
      expect(mockTimerService.resetTimer).toHaveBeenCalledWith("habit1");
      expect(getByLabelText("Mark Exercise 30 min as not done")).toBeTruthy();
    });
  });

  it("falls back to an empty list when loading fails", async () => {
    mockDataService.getUserData.mockRejectedValue(new Error("db unavailable"));

    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      expect(getByText("No habits yet — start with one.")).toBeTruthy();
    });
  });
});
