import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";

import { DeliveryForm } from "@/components/briefing/forms/DeliveryForm";
import i18n from "@/i18n";
import { deliveryFieldDefinitions, deliverySettingsDefinitions } from "@/lib/moduleRegistry";
import { DeliveryData, DeliverySettings } from "@/lib/types";

function DeliveryFormHarness() {
  const [value, setValue] = useState<DeliveryData>({
    deliveries: [{ time: "", place: "", contact: "", tag_mode: "", custom_tag: "", notes: "" }]
  });
  const [settings, setSettings] = useState<DeliverySettings>({
    enable_depot_tag: true,
    enable_retour_tag: true,
    allow_custom_tag: true
  });

  return (
    <DeliveryForm
      value={value}
      settings={settings}
      settingsSchema={deliverySettingsDefinitions}
      fieldSchema={deliveryFieldDefinitions}
      onChange={setValue}
      onSettingsChange={(next) => setSettings(next as DeliverySettings)}
    />
  );
}

describe("DeliveryForm runtime", () => {
  it("shows the custom tag field only when the custom tag option is selected", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("fr");
    render(
      <I18nextProvider i18n={i18n}>
        <DeliveryFormHarness />
      </I18nextProvider>
    );

    expect(screen.queryByPlaceholderText("Saisir un tag personnalisé")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Tag trajet"), "custom");

    expect(screen.getByPlaceholderText("Saisir un tag personnalisé")).toBeInTheDocument();
  });

  it("removes the depot option when the related setting is disabled", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("fr");
    render(
      <I18nextProvider i18n={i18n}>
        <DeliveryFormHarness />
      </I18nextProvider>
    );

    await user.click(screen.getAllByRole("checkbox")[0]);

    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).not.toContain("Dépôt");
    expect(options).toContain("Retour");
  });
});
