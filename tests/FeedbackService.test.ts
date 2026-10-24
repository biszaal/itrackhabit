import AsyncStorage from "@react-native-async-storage/async-storage";
import { FEEDBACK_API } from "../src/config/feedback";
import { feedbackService, FeedbackInput } from "../src/services/feedback/FeedbackService";

jest.mock("expo-application", () => ({ nativeBuildVersion: "31" }));
jest.mock("expo-device", () => ({ modelName: "Galaxy S26 Ultra" }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.1.0" } },
}));

const DAY = 24 * 60 * 60 * 1000;
const store: Record<string, string> = {};
const fetchMock = jest.fn();

const reply = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});
const outbox = () => JSON.parse(store.feedback_outbox ?? "[]");
const bodyOf = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body);

const input: FeedbackInput = {
  category: "idea",
  message: "  More colours please  ",
  includeDeviceInfo: true,
  source: "profile",
};

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => store[k] ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => {
    store[k] = v;
  });
  fetchMock.mockReset();
  (global as any).fetch = fetchMock;
});

afterEach(() => jest.useRealTimers());

describe("FeedbackService.submit", () => {
  it("posts the trimmed message with device info to the feedback function", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));

    expect(await feedbackService.submit(input)).toEqual({ status: "sent" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(FEEDBACK_API.url);
    expect(init.method).toBe("POST");
    expect(init.headers.apikey).toBe(FEEDBACK_API.publishableKey);
    expect(bodyOf(0)).toEqual({
      p_category: "idea",
      p_message: "More colours please",
      p_install_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      p_source: "profile",
      p_contact_email: null,
      p_app_version: "1.1.0 (31)",
      p_platform: "ios",
      p_os_version: expect.any(String),
      p_device_model: "Galaxy S26 Ultra",
    });
  });

  it("reuses one install id across messages", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));
    await feedbackService.submit(input);
    await feedbackService.submit(input);
    expect(bodyOf(0).p_install_id).toBe(bodyOf(1).p_install_id);
  });

  it("leaves device info out when switched off, and sends a trimmed email", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));
    await feedbackService.submit({ ...input, includeDeviceInfo: false, contactEmail: " me@example.com " });
    expect(bodyOf(0)).toMatchObject({
      p_contact_email: "me@example.com",
      p_app_version: null,
      p_platform: null,
      p_os_version: null,
      p_device_model: null,
    });
  });

  it("truncates on whole characters, not UTF-16 halves", async () => {
    fetchMock.mockResolvedValue(reply(200, "id"));
    await feedbackService.submit({ ...input, message: "😀".repeat(4001) });
    const sent: string = bodyOf(0).p_message;
    expect(Array.from(sent)).toHaveLength(4000);
    expect(/[\ud800-\udbff](?![\udc00-\udfff])/.test(sent)).toBe(false);
  });

  it.each([
    ["a network error", () => fetchMock.mockRejectedValue(new TypeError("Network request failed"))],
    ["a server error", () => fetchMock.mockResolvedValue(reply(503, {}))],
    ["the global rate limit", () => fetchMock.mockResolvedValue(reply(400, { message: "rate_limited_global" }))],
  ])("queues the message after %s", async (_label, arrange) => {
    arrange();
    expect(await feedbackService.submit(input)).toEqual({ status: "queued" });
    expect(outbox()).toHaveLength(1);
    expect(outbox()[0].notBefore).toBe(0);
  });

  it("queues for tomorrow when this install hit its daily limit", async () => {
    const now = Date.UTC(2026, 9, 24);
    jest.spyOn(Date, "now").mockReturnValue(now);
    fetchMock.mockResolvedValue(reply(400, { message: "rate_limited_install" }));

    expect(await feedbackService.submit(input)).toEqual({ status: "rate_limited" });
    expect(outbox()[0].notBefore).toBe(now + DAY);
    jest.restoreAllMocks();
  });

  it("reports a validation error and does not queue it", async () => {
    fetchMock.mockResolvedValue(reply(400, { message: "invalid email" }));
    expect(await feedbackService.submit(input)).toEqual({ status: "invalid", message: "invalid email" });
    expect(outbox()).toHaveLength(0);
  });

  it("gives up waiting after the timeout and queues", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );

    const pending = feedbackService.submit(input);
    await jest.advanceTimersByTimeAsync(FEEDBACK_API.timeoutMs);

    expect(await pending).toEqual({ status: "queued" });
  });

  it("keeps at most 20 queued messages, dropping the oldest", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    for (let i = 0; i < 25; i++) {
      await feedbackService.submit({ ...input, message: `msg ${i}` });
    }
    expect(outbox()).toHaveLength(20);
    expect(outbox()[0].payload.p_message).toBe("msg 5");
  });
});

describe("FeedbackService.flushOutbox", () => {
  it("sends feedback left in the outbox by an earlier run", async () => {
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: 0, payload: { p_category: "bug", p_message: "from yesterday" } },
    ]);
    fetchMock.mockResolvedValue(reply(200, "id"));

    await feedbackService.flushOutbox();

    expect(bodyOf(0).p_message).toBe("from yesterday");
    expect(outbox()).toHaveLength(0);
  });

  it("keeps what still fails and drops what the server rejects", async () => {
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: 0, payload: { p_message: "offline still" } },
      { id: "b", notBefore: 0, payload: { p_message: "bad one" } },
    ]);
    fetchMock
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce(reply(400, { message: "invalid category" }));

    await feedbackService.flushOutbox();

    expect(outbox().map((i: { id: string }) => i.id)).toEqual(["a"]);
  });

  it("leaves messages alone until their wait is over", async () => {
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: Date.now() + DAY, payload: { p_message: "tomorrow" } },
    ]);
    await feedbackService.flushOutbox();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(outbox()).toHaveLength(1);
  });

  it("keeps a message queued while a flush is running", async () => {
    let release!: (value: unknown) => void;
    store.feedback_outbox = JSON.stringify([
      { id: "a", notBefore: 0, payload: { p_message: "first" } },
    ]);
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));

    const flushing = feedbackService.flushOutbox();
    // Let the flush reach its network call before the new message is sent,
    // so the two requests take the mocked responses in a known order.
    while (fetchMock.mock.calls.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    await feedbackService.submit({ ...input, message: "during flush" });
    release(reply(200, "id"));
    await flushing;

    expect(outbox().map((i: { payload: { p_message: string } }) => i.payload.p_message)).toEqual(["during flush"]);
  });
});
