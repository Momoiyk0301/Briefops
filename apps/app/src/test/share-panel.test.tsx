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
        url: "https://briefing.events-ops.be/briefing/share/crew"
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

    expect(await screen.findByText(/Durée du lien/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Créer le lien équipe/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exporter le PDF/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("team-select")).not.toBeInTheDocument();
  });

  it("renders the team selector and QR behavior when teams are enabled", async () => {
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
      url: "https://briefing.events-ops.be/briefing/share/audio"
    });

    render(<SharePanel open briefingId="b1" teams={["Audio"]} selectedTeam="Audio" onClose={vi.fn()} onExportPdf={vi.fn()} />);

    expect(await screen.findByLabelText("team-select")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("team-select"), "Audio");
    await user.click(screen.getByRole("button", { name: /Créer le lien « Audio »/i }));
    await waitFor(() => expect(apiMocks.createBriefingShareLink).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /QR Code/i }));

    expect(screen.getByText("https://briefing.events-ops.be/briefing/share/audio")).toBeInTheDocument();
    expect(screen.getByTestId("share-qr-code")).toBeInTheDocument();
  });

  it("renders active link cards and supports WhatsApp sharing for a newly created link", async () => {
    const user = userEvent.setup();
    apiMocks.createBriefingShareLink.mockResolvedValueOnce({
      id: "crew-new",
      briefing_id: "b1",
      resource_type: "pdf",
      link_type: "staff",
      audience_tag: null,
      team: null,
      token: "crew-new",
      created_by: "u1",
      expires_at: null,
      revoked_at: null,
      created_at: "",
      status: "active",
      url: "https://briefing.events-ops.be/briefing/share/crew-new"
    });
    render(<SharePanel open briefingId="b1" onClose={vi.fn()} onExportPdf={vi.fn()} />);

    expect(await screen.findByText(/Liens actifs/i)).toBeInTheDocument();
    expect(screen.getByText("Équipe")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Créer le lien équipe/i }));
    await user.click(await screen.findByRole("button", { name: /WhatsApp/i }));

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text="),
      "_blank",
      "noopener,noreferrer"
    );
  });
});
