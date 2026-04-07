import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { DeliveryForm } from "@/components/briefing/forms/DeliveryForm";
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
    render(<DeliveryFormHarness />);

    expect(screen.queryByPlaceholderText("Type a custom tag")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Tag"), "custom");

    expect(screen.getByPlaceholderText("Type a custom tag")).toBeInTheDocument();
  });

  it("removes the depot option when the related setting is disabled", async () => {
    const user = userEvent.setup();
    render(<DeliveryFormHarness />);

    await user.click(screen.getAllByRole("checkbox")[0]);

    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).not.toContain("Depot");
    expect(options).toContain("Retour");
  });
});
