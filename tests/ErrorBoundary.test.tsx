import React from "react";
import { Text } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary, buildCrashReport } from "../src/components/ErrorBoundary";
import { feedbackService } from "../src/services/feedback/FeedbackService";
import { reviewPromptService } from "../src/services/feedback/ReviewPromptService";
import { dataExportService } from "../src/services/core/DataExportService";

jest.mock("../src/services/feedback/FeedbackService", () => ({
  feedbackService: {
    submit: jest.fn(),
    getDeviceInfo: () => ({ appVersion: "1.1.0 (31)", platform: "ios", osVersion: "26.0", deviceModel: "iPhone 17" }),
  },
}));
jest.mock("../src/services/feedback/ReviewPromptService", () => ({
  reviewPromptService: { recordCrash: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("../src/services/core/DataExportService", () => ({
  dataExportService: { exportAllData: jest.fn() },
}));

const submit = feedbackService.submit as jest.Mock;
const recordCrash = reviewPromptService.recordCrash as jest.Mock;
const exportAllData = dataExportService.exportAllData as jest.Mock;

let shouldThrow = true;
const Boom = () => {
  if (shouldThrow) throw new Error("Kaboom");
  return <Text>Child OK</Text>;
};

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderBoundary = () =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    </SafeAreaProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  shouldThrow = true;
});

describe("ErrorBoundary", () => {
  it("shows the crash screen and records the crash", async () => {
    const screen = renderBoundary();
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
    expect(screen.getByText("Your habits are safe on this device.")).toBeTruthy();
    await waitFor(() => expect(recordCrash).toHaveBeenCalled());
  });

  it("remounts the app on Try again", () => {
    const screen = renderBoundary();
    shouldThrow = false;
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Child OK")).toBeTruthy();
  });

  it("shows the report before sending it as a bug from the crash screen", async () => {
    submit.mockResolvedValue({ status: "sent" });
    const screen = renderBoundary();

    fireEvent.press(screen.getByRole("button", { name: "Send error report" }));
    expect(screen.getByText(/^Error: Kaboom/)).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole("button", { name: "Send report" }));
    await screen.findByText("Report sent. Thank you.");
    expect(submit).toHaveBeenCalledWith({
      category: "bug",
      message: expect.stringMatching(/^Error: Kaboom/),
      includeDeviceInfo: true,
      source: "crash_screen",
    });
  });

  it("reports an export failure without crashing", async () => {
    exportAllData.mockRejectedValue(new Error("disk full"));
    const screen = renderBoundary();
    fireEvent.press(screen.getByRole("button", { name: "Export my data" }));
    await screen.findByText("Couldn't export. Your data is still on this device.");
  });
});

describe("buildCrashReport", () => {
  it("keeps the error line and caps the component stack at 1,500 characters", () => {
    const report = buildCrashReport(new TypeError("x is undefined"), "  " + "a".repeat(2000));
    expect(report.startsWith("TypeError: x is undefined\n\n")).toBe(true);
    expect(report.length).toBe("TypeError: x is undefined\n\n".length + 1500);
  });
});
