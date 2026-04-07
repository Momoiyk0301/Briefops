import { deliveryFieldDefinitions, deliverySettingsDefinitions, moduleRegistry } from "@/lib/moduleRegistry";

describe("moduleRegistry", () => {
  it("contains mandatory metadata module", () => {
    expect(moduleRegistry.metadata.isMandatory).toBe(true);
    expect(moduleRegistry.metadata.defaultEnabled).toBe(true);
  });

  it("keeps default enabled values", () => {
    expect(moduleRegistry.access.defaultEnabled).toBe(true);
    expect(moduleRegistry.notes.defaultEnabled).toBe(true);
    expect(moduleRegistry.delivery.defaultEnabled).toBe(false);
  });

  it("exposes delivery runtime schemas", () => {
    expect(moduleRegistry.delivery.defaultSettings).toMatchObject({
      enable_depot_tag: true,
      enable_retour_tag: true,
      allow_custom_tag: true
    });
    expect(deliverySettingsDefinitions.length).toBeGreaterThan(0);
    expect(deliveryFieldDefinitions.some((field) => field.key === "tag_mode")).toBe(true);
  });
});
