import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/marketing/LandingPage";

describe("LandingPage", () => {
  it("renders french marketing content and app redirects", () => {
    render(<LandingPage locale="fr" />);

    expect(screen.getByText(/Briefings événementiels opérationnels/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Accéder à BriefOPS|Ouvrir l’app/i })[0]).toHaveAttribute(
      "href",
      "http://localhost:3000/login?mode=register"
    );
  });

  it("renders dutch marketing content", () => {
    render(<LandingPage locale="nl" />);

    expect(screen.getByText(/Operationele eventbriefings/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Inloggen/i })[0]).toHaveAttribute("href", "http://localhost:3000/login");
  });
});
