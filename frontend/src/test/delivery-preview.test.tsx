import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";

import { DeliveryPreview } from "@/components/briefing/preview/DeliveryPreview";
import i18n from "@/i18n";

describe("DeliveryPreview", () => {
  it("renders destination points with a dedicated destination block", async () => {
    await i18n.changeLanguage("fr");

    render(
      <I18nextProvider i18n={i18n}>
        <DeliveryPreview
          value={{
            deliveries: [
              {
                time: "08:30",
                place: "Hall principal",
                contact: "Nina",
                tag_mode: "depot",
                custom_tag: "",
                notes: "Passer par l'entree technique"
              }
            ]
          }}
        />
      </I18nextProvider>
    );

    expect(screen.getByText("Planning des livraisons")).toBeInTheDocument();
    expect(screen.getByText("Point de destination")).toBeInTheDocument();
    expect(screen.getByText("Hall principal")).toBeInTheDocument();
    expect(screen.getByText("Dépôt")).toBeInTheDocument();
  });

  it("renders an empty state when no destination points are available", async () => {
    await i18n.changeLanguage("fr");

    render(
      <I18nextProvider i18n={i18n}>
        <DeliveryPreview value={{ deliveries: [] }} />
      </I18nextProvider>
    );

    expect(screen.getByText("Aucun point de destination renseigné")).toBeInTheDocument();
  });
});
