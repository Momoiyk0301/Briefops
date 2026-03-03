import { moduleRegistry } from "@/lib/moduleRegistry";

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
});
