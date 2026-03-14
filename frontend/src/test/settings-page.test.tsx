import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";

import i18n from "@/i18n";
import SettingsPage from "@/views/SettingsPage";

describe("SettingsPage", () => {
  it("keeps only MVP-relevant settings sections", () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <SettingsPage />
        </I18nextProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Workspace/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Interface/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.queryByText(/Security/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Session/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mot de passe/i)).not.toBeInTheDocument();
  });
});
