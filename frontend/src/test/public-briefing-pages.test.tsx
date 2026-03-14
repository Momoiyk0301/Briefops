import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const sentryMocks = vi.hoisted(() => ({ captureException: vi.fn() }));
const publicLinkMocks = vi.hoisted(() => ({
  resolveStaffBriefingByToken: vi.fn(),
  resolveAudienceBriefingByToken: vi.fn()
}));

vi.mock("@sentry/nextjs", () => sentryMocks);
vi.mock("@/supabase/server", () => ({ createServiceRoleClient: vi.fn(() => ({ })) }));
vi.mock("@/supabase/queries/publicLinks", () => ({
  PUBLIC_LINK_INVALID_MESSAGE: "This link has expired. Please ask the owner for a new link.",
  resolveStaffBriefingByToken: publicLinkMocks.resolveStaffBriefingByToken,
  resolveAudienceBriefingByToken: publicLinkMocks.resolveAudienceBriefingByToken
}));

describe("public briefing pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to the invalid link UI when the staff public page throws", async () => {
    publicLinkMocks.resolveStaffBriefingByToken.mockRejectedValueOnce(new Error("db failed"));
    const mod = await import("../../app/briefings/s/[token]/page");
    const element = await mod.default({ params: Promise.resolve({ token: "abc" }) });

    render(element);

    expect(screen.getByText(/Lien invalide/i)).toBeInTheDocument();
    expect(sentryMocks.captureException).toHaveBeenCalled();
  });

  it("falls back to the invalid link UI when the audience public page throws", async () => {
    publicLinkMocks.resolveAudienceBriefingByToken.mockRejectedValueOnce(new Error("db failed"));
    const mod = await import("../../app/briefings/[id]/[tag]/[token]/page");
    const element = await mod.default({ params: Promise.resolve({ id: "b1", tag: "audio", token: "abc" }) });

    render(element);

    expect(screen.getByText(/Lien invalide/i)).toBeInTheDocument();
    expect(sentryMocks.captureException).toHaveBeenCalled();
  });
});
