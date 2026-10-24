import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FeedbackScreen } from "../src/screens/settings/FeedbackScreen";

const mockSubmit = jest.fn();

jest.mock("expo-application", () => ({ nativeBuildVersion: "31" }));
jest.mock("expo-device", () => ({ modelName: "iPhone 17" }));

jest.mock("../src/services/feedback/FeedbackService", () => {
  const actual = jest.requireActual("../src/services/feedback/FeedbackService");
  return {
    ...actual,
    feedbackService: {
      submit: (...args: unknown[]) => mockSubmit(...args),
      flushOutbox: jest.fn().mockResolvedValue(undefined),
      getDeviceInfo: () => ({ appVersion: "1.1.0 (31)", platform: "ios", osVersion: "26.0", deviceModel: "iPhone 17" }),
    },
  };
});

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <FeedbackScreen navigation={{ goBack: jest.fn() } as any} route={{ key: "Feedback", name: "Feedback" } as any} />
    </SafeAreaProvider>
  );

const fillIn = (screen: ReturnType<typeof renderScreen>, message = "More colours") => {
  fireEvent.press(screen.getByRole("button", { name: "I have an idea" }));
  fireEvent.changeText(screen.getByPlaceholderText("What's on your mind?"), message);
};

const sendButton = (screen: ReturnType<typeof renderScreen>) =>
  screen.getByRole("button", { name: "Send feedback" });

beforeEach(() => mockSubmit.mockReset());

describe("FeedbackScreen", () => {
  it("keeps Send disabled until a category and a message are given", () => {
    const screen = renderScreen();
    expect(sendButton(screen)).toBeDisabled();
    fireEvent.press(screen.getByRole("button", { name: "I have an idea" }));
    expect(sendButton(screen)).toBeDisabled();
    fireEvent.changeText(screen.getByPlaceholderText("What's on your mind?"), "More colours");
    expect(sendButton(screen)).not.toBeDisabled();
  });

  it("sends the feedback and thanks the user", async () => {
    mockSubmit.mockResolvedValue({ status: "sent" });
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.press(sendButton(screen));

    await screen.findByText("Thank you — we read every message.");
    expect(mockSubmit).toHaveBeenCalledWith({
      category: "idea",
      message: "More colours",
      contactEmail: undefined,
      includeDeviceInfo: true,
      source: "profile",
    });
    expect(screen.getByPlaceholderText("What's on your mind?").props.value).toBe("");
  });

  it("shows the device details it will send, and leaves them out when switched off", async () => {
    mockSubmit.mockResolvedValue({ status: "sent" });
    const screen = renderScreen();
    expect(screen.getByText("1.1.0 (31) · ios 26.0 · iPhone 17")).toBeTruthy();

    fireEvent(screen.getByLabelText("Include device info"), "valueChange", false);
    fillIn(screen);
    fireEvent.press(sendButton(screen));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    expect(mockSubmit.mock.calls[0][0].includeDeviceInfo).toBe(false);
  });

  it("blocks a malformed email", () => {
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.changeText(screen.getByPlaceholderText("Only if you'd like a reply"), "abc");
    expect(screen.getByText("That email doesn't look right.")).toBeTruthy();
    expect(sendButton(screen)).toBeDisabled();
  });

  it("sends once when Send is tapped twice", async () => {
    mockSubmit.mockReturnValue(new Promise(() => {}));
    const screen = renderScreen();
    fillIn(screen);
    const button = sendButton(screen);
    fireEvent.press(button);
    fireEvent.press(button);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("tells the user an offline message will send later", async () => {
    mockSubmit.mockResolvedValue({ status: "queued" });
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.press(sendButton(screen));
    await screen.findByText("Saved. It'll send automatically when you're back online.");
  });

  it("tells the user when today's limit is reached", async () => {
    mockSubmit.mockResolvedValue({ status: "rate_limited" });
    const screen = renderScreen();
    fillIn(screen);
    fireEvent.press(sendButton(screen));
    await screen.findByText("Thanks for all the feedback today! This one will send tomorrow.");
  });

  it("shows the server's reason when the message is rejected, and keeps the text", async () => {
    mockSubmit.mockResolvedValue({ status: "invalid", message: "invalid email" });
    const screen = renderScreen();
    fillIn(screen, "Keep me");
    fireEvent.press(sendButton(screen));
    await screen.findByText("Couldn't send: invalid email");
    expect(screen.getByPlaceholderText("What's on your mind?").props.value).toBe("Keep me");
  });
});
