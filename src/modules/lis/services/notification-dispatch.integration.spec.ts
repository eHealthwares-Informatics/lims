import axios from "axios";
import { ConversationDispatchService } from "./notification-dispatch.service";

describe("ConversationDispatchService (notification-dispatch payload)", () => {
  const config = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === "CONVERSATION_API_URL") return "http://conversation.test/api";
      if (key === "INTEROP_API_KEY") return "lis-key";
      return defaultValue;
    }),
  };

  let post: jest.SpyInstance;
  let service: ConversationDispatchService;

  beforeEach(() => {
    post = jest
      .spyOn(axios, "post")
      .mockResolvedValue({ data: { sent: 1, deliveries: ["delivery-1"] } });
    service = new ConversationDispatchService(config as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("posts an SMS payload to /notification-dispatch/payload", async () => {
    const result = await service.send({
      organizationId: "org-1",
      channelType: "SMS",
      phone: "+2348000000001",
      title: "Sample received",
      message: "Your sample was received",
      contextId: "ledger-1",
      sourceApp: "lis",
      eventType: "SAMPLE_RECEIVED",
      relatedEntityType: "sample",
      relatedEntityId: "sample-1",
    });

    expect(result).toEqual({
      ok: true,
      exchangeId: "delivery-1",
      error: undefined,
    });
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, options] = post.mock.calls[0];
    expect(url).toBe(
      "http://conversation.test/api/notification-dispatch/payload",
    );
    expect(options.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-api-key": "lis-key",
    });
    expect(body).toMatchObject({
      organizationId: "org-1",
      eventKey: "SAMPLE_RECEIVED",
      channels: ["sms"],
      recipients: { phone: "+2348000000001" },
      subject: "Sample received",
      message: "Your sample was received",
    });
    expect(body.context).toMatchObject({
      source: "lis-notification",
      sourceApp: "lis",
      eventType: "SAMPLE_RECEIVED",
      contextId: "ledger-1",
    });
  });

  it("maps EMAIL to the email channel and recipient", async () => {
    await service.send({
      channelType: "EMAIL",
      email: "patient@example.com",
      title: "Result ready",
      message: "Your result is ready",
      contextId: "ledger-2",
      sourceApp: "lis",
      eventType: "RESULT_READY",
    });

    const body = post.mock.calls[0][1];
    expect(body.channels).toEqual(["email"]);
    expect(body.recipients).toEqual({ email: "patient@example.com" });
  });

  it("maps WHATSAPP to the whatsapp channel", async () => {
    await service.send({
      channelType: "WHATSAPP",
      phone: "+2348000000001",
      title: "T",
      message: "M",
      contextId: "ledger-3",
      sourceApp: "lis",
      eventType: "RESULT_READY",
    });

    expect(post.mock.calls[0][1].channels).toEqual(["whatsapp"]);
  });

  it("returns not-ok when the recipient is missing", async () => {
    const result = await service.send({
      channelType: "EMAIL",
      title: "T",
      message: "M",
      contextId: "ledger-4",
      sourceApp: "lis",
      eventType: "RESULT_READY",
    });

    expect(result.ok).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it("returns not-ok when conversation reports no sent delivery", async () => {
    post.mockResolvedValue({ data: { sent: 0, failed: 1, deliveries: [] } });

    const result = await service.send({
      channelType: "SMS",
      phone: "+2348000000001",
      title: "T",
      message: "M",
      contextId: "ledger-5",
      sourceApp: "lis",
      eventType: "RESULT_READY",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("failed");
  });

  it("returns not-ok (never throws) when conversation is unavailable", async () => {
    post.mockRejectedValue(new Error("gateway down"));

    const result = await service.send({
      channelType: "SMS",
      phone: "+2348000000001",
      title: "T",
      message: "M",
      contextId: "ledger-6",
      sourceApp: "lis",
      eventType: "RESULT_READY",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("gateway down");
  });
});
