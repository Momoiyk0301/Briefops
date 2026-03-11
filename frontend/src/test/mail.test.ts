import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/env", () => ({
  env: { APP_URL: "https://events-ops.be" }
}));

vi.mock("@/stripe/stripe", () => ({
  isDev: false
}));

describe("mail service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test";
    process.env.MAIL_FROM = "noreply@events-ops.be";
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
    expect(fetchMock.mock.calls[1][1].body).toContain("Compte BriefOPS activ");
  });

  it("does not send app emails for free plan", async () => {
    const { sendCheckoutConfirmationEmails } = await import("@/lib/mail");

    await sendCheckoutConfirmationEmails("client@example.com", "free", {
      id: "cs_123"
    } as never);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
