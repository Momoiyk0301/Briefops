import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/stripe/stripe", () => ({
  isDev: false
}));

describe("mail service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "noreply@events-ops.be");
    vi.stubEnv("APP_URL", "https://briefing.events-ops.be");
    vi.stubEnv("MARKETING_SITE_URL", "https://events-ops.be");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends checkout confirmation emails through the central mail service", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: async () => "" });
    const { sendCheckoutConfirmationEmails } = await import("@/lib/mail");

    await sendCheckoutConfirmationEmails("client@example.com", "starter", {
      id: "cs_123",
      amount_total: 4900,
      currency: "eur"
    } as never);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/emails");
    expect(fetchMock.mock.calls[0][1].body).toContain("Commande BriefOPS confirm");
    expect(fetchMock.mock.calls[0][1].body).toContain("https://briefing.events-ops.be/briefings");
    expect(fetchMock.mock.calls[1][1].body).toContain("Compte BriefOPS activ");
    expect(fetchMock.mock.calls[1][1].body).toContain("https://briefing.events-ops.be/login");
    expect(fetchMock.mock.calls[1][1].body).toContain("BriefOPS · events-ops.be");
  });

  it("does not send app emails when mail config is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("MAIL_FROM", "");
    const { sendCheckoutConfirmationEmails } = await import("@/lib/mail");

    await sendCheckoutConfirmationEmails("client@example.com", "starter", {
      id: "cs_123"
    } as never);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
