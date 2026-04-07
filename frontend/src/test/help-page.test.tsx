import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import HelpPage from "@/views/HelpPage";

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn()
}));

vi.mock("@/lib/api", () => apiMocks);

function renderPage(initialPath = "/help") {
  const client = new QueryClient();
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("HelpPage", () => {
  it("validates required fields and shows fake success after submit", async () => {
    apiMocks.getMe.mockResolvedValue({
      user: { id: "u1", email: "ops@briefops.app" },
      workspace: { id: "w1", name: "Peak Events" }
    });
    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));
    expect(screen.getByText(/Le message est requis/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText("help-message"), "Besoin d’aide sur le plan Enterprise.");
    await user.click(screen.getByRole("button", { name: /Envoyer/i }));
    expect(await screen.findByText(/Message prepare/i)).toBeInTheDocument();
  });

  it("preselects enterprise subject from query string", async () => {
    apiMocks.getMe.mockResolvedValue({
      user: { id: "u1", email: "ops@briefops.app" },
      workspace: { id: "w1", name: "Peak Events" }
    });
    renderPage("/help?subject=enterprise");

    expect((await screen.findByLabelText("help-subject"))).toHaveValue("Demande Enterprise");
  });
});
