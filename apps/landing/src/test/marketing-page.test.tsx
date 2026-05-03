import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/marketing/LandingPage";

describe("LandingPage", () => {
  it("renders french marketing content with disabled app CTAs", () => {
    render(<LandingPage locale="fr" />);

    expect(screen.getByText(/Toutes les informations terrain/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Essai gratuit/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Bientôt disponible/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Event briefing template/i })).toHaveAttribute(
      "href",
      "/fr/event-briefing-template"
    );
  });

  it("renders dutch marketing content", () => {
    render(<LandingPage locale="nl" />);

    expect(screen.getByText(/Alle terreininfo gebundeld/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Inloggen/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Bientôt disponible/i).length).toBeGreaterThan(0);
  });
});
