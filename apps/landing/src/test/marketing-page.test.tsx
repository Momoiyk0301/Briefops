import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/marketing/LandingPage";

describe("LandingPage", () => {
  it("renders french marketing content and app redirects", () => {
    render(<LandingPage locale="fr" />);

    expect(screen.getByText(/Toutes les informations terrain/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Essai gratuit/i })[0]).toHaveAttribute(
      "href",
      "http://localhost:3000/login?mode=register"
    );
    expect(screen.getByRole("link", { name: /Event briefing template/i })).toHaveAttribute(
      "href",
      "/fr/event-briefing-template"
    );
  });

  it("renders dutch marketing content", () => {
    render(<LandingPage locale="nl" />);

    expect(screen.getByText(/Alle terreininfo gebundeld/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Inloggen/i })[0]).toHaveAttribute("href", "http://localhost:3000/login");
  });
});
