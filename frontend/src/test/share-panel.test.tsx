import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { SharePanel } from "@/components/briefing/SharePanel";

const apiMocks = vi.hoisted(() => ({
  listBriefingShareLinks: vi.fn(),
  createBriefingShareLink: vi.fn(),
  revokeBriefingShareLink: vi.fn(),
  toApiMessage: vi.fn((error: unknown) => String(error))
}));

vi.mock("@/lib/api", () => apiMocks);

describe("SharePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.listBriefingShareLinks.mockResolvedValue([
      {
        id: "crew-1",
        briefing_id: "b1",
        resource_type: "pdf",
        link_type: "staff",
        audience_tag: null,
        team: null,
        token: "crew",
        created_by: "u1",
        expires_at: null,
        revoked_at: null,
        created_at: "",
        status: "active",
        url: "https://briefops.app/s/crew"
      }
    ]);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    window.open = vi.fn();
  });

  it("renders the 3 share sections and hides team view when no teams exist", async () => {
    render(<SharePanel open briefingId="b1" onClose={vi.fn()} onExportPdf={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Crew view" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PDF export" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Team view" })).not.toBeInTheDocument();
  });

  it("renders the team section and QR behavior when teams are enabled", async () => {
    const user = userEvent.setup();
    apiMocks.createBriefingShareLink.mockResolvedValueOnce({
      id: "team-1",
      briefing_id: "b1",
      resource_type: "pdf",
      link_type: "audience",
      audience_tag: "Audio",
      team: "Audio",
      token: "audio",
      created_by: "u1",
      expires_at: null,
      revoked_at: null,
      created_at: "",
      status: "active",
      url: "https://briefops.app/s/audio"
    });

    render(<SharePanel open briefingId="b1" teams={["Audio"]} selectedTeam="Audio" onClose={vi.fn()} onExportPdf={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Team view" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Generate team link/i }));
    await waitFor(() => expect(apiMocks.createBriefingShareLink).toHaveBeenCalled());
    await user.click(screen.getAllByRole("button", { name: /Show QR/i })[1]);

    expect(screen.getByTestId("team-qr-code")).toBeInTheDocument();
  });

  it("renders active links cards and supports WhatsApp sharing", async () => {
    const user = userEvent.setup();
    render(<SharePanel open briefingId="b1" onClose={vi.fn()} onExportPdf={vi.fn()} />);

    expect(await screen.findByText(/Active links/i)).toBeInTheDocument();
    expect(screen.getAllByText("https://briefops.app/s/crew").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: /WhatsApp/i })[0]);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text="),
      "_blank",
      "noopener,noreferrer"
    );
  });
});
