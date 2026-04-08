import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import ModulesPage from "@/views/ModulesPage";

const apiMocks = vi.hoisted(() => ({
  getRegistryModules: vi.fn().mockResolvedValue([
    {
      id: "delivery-module",
      name: "Livraisons",
      type: "delivery",
      version: 1,
      icon: "truck",
      category: "logistics",
      enabled: true,
      settings_schema: [
        { key: "enable_depot_tag", label: "Activer le tag depot" },
        { key: "enable_retour_tag", label: "Activer le tag retour" }
      ],
      field_schema: [],
      default_settings: {},
      default_layout: {},
      default_data: {},
      created_at: "",
      updated_at: ""
    },
    {
      id: "notes-module",
      name: "Notes",
      type: "notes",
      version: 1,
      icon: "sticky-note",
      category: "general",
      enabled: true,
      settings_schema: [],
      field_schema: [],
      default_settings: {},
      default_layout: {},
      default_data: {},
      created_at: "",
      updated_at: ""
    }
  ]),
  updateWorkspaceModuleEnabled: vi.fn(),
  toApiMessage: vi.fn((error: unknown) => String(error))
}));

vi.mock("@/lib/api", () => ({
  getRegistryModules: apiMocks.getRegistryModules,
  updateWorkspaceModuleEnabled: apiMocks.updateWorkspaceModuleEnabled,
  toApiMessage: apiMocks.toApiMessage
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}));

describe("ModulesPage", () => {
  function renderPage() {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <ModulesPage />
      </QueryClientProvider>
    );
  }

  it("shows a disclosure with settings labels only for configurable modules", async () => {
    const user = userEvent.setup();
    renderPage();

    const disclosure = await screen.findByText(/2 settings|2 paramètres/i);
    expect(disclosure).toBeInTheDocument();
    expect(screen.queryByText(/0 settings|0 paramètres/i)).not.toBeInTheDocument();

    await user.click(disclosure);

    expect(screen.getByText(/Activer le tag depot/i)).toBeInTheDocument();
    expect(screen.getByText(/Activer le tag retour/i)).toBeInTheDocument();
  });
});
