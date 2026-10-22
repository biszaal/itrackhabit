import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HabitNotificationSettingsScreen from "../src/screens/habits/HabitNotificationSettingsScreen";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockParams: object | undefined;

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockParams }),
}));

jest.mock("../src/services/core", () => ({
  dataService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getHabitById: jest.fn().mockResolvedValue({ id: "h1", title: "Read" }),
  },
}));

jest.mock("../src/services/notifications", () => ({
  enhancedNotificationService: {
    getHabitReminderSettings: jest
      .fn()
      .mockResolvedValue({ habitId: "h1", enabled: true, reminderTimes: [] }),
    saveHabitReminderSettings: jest.fn().mockResolvedValue(undefined),
  },
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <HabitNotificationSettingsScreen />
    </SafeAreaProvider>
  );

describe("HabitNotificationSettingsScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  // Profile's "Smart notifications" row navigated here with no params, so
  // destructuring route.params threw and took the app down on tap.
  it("renders without crashing when navigated to with no params", async () => {
    mockParams = undefined;
    const { getByText } = renderScreen();
    await waitFor(() =>
      expect(getByText("Pick a habit to set up its reminders.")).toBeTruthy()
    );
  });

  it("loads the habit when given a habitId", async () => {
    mockParams = { habitId: "h1" };
    const { getByText } = renderScreen();
    await waitFor(() => expect(getByText("Reminders")).toBeTruthy());
  });
});
