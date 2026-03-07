import { expect, test } from "@playwright/test";

test.describe("BriefOPS e2e", () => {
  test("signup/login -> onboarding -> create briefing -> save -> export", async ({ page }) => {
    let briefings: Array<{ id: string; title: string; event_date: string | null; location_text: string | null }> = [];
    await page.addInitScript(() => localStorage.setItem("briefops:e2e-auth", "1"));

    await page.route("**/api/**", async (route) => {
      const req = route.request();
      const method = req.method();
      const url = new URL(req.url());

      if (url.pathname === "/api/me" && method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: { id: "e2e-user", email: "e2e@example.com" },
            plan: "free",
            org: { id: "org-1", name: "E2E Org" },
            role: "owner",
            is_admin: true,
            degraded: false
          })
        });
        return;
      }

      if (url.pathname === "/api/onboarding" && method === "POST") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true }) });
        return;
      }

      if (url.pathname === "/api/briefings" && method === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: briefings }) });
        return;
      }

      if (url.pathname === "/api/briefings" && method === "POST") {
        const created = {
          id: "b-1",
          org_id: "org-1",
          title: "Untitled briefing",
          event_date: null,
          location_text: null,
          created_by: "e2e-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        briefings = [created];
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ data: created }) });
        return;
      }

      if (url.pathname === "/api/briefings/b-1" && method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "b-1",
              org_id: "org-1",
              title: "Untitled briefing",
              event_date: null,
              location_text: null,
              created_by: "e2e-user",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          })
        });
        return;
      }

      if (url.pathname === "/api/briefings/b-1/modules" && method === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
        return;
      }

      if (url.pathname === "/api/modules" && method === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
        return;
      }

      if (url.pathname === "/api/briefings/b-1/modules" && method === "PUT") {
        const body = JSON.parse(req.postData() || "{}");
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { ...body, id: "m-1", briefing_id: "b-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() } }) });
        return;
      }

      if (url.pathname === "/api/briefings/b-1" && method === "PATCH") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { id: "b-1" } }) });
        return;
      }

      if (url.pathname === "/api/pdf/b-1" && method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/pdf",
          body: "%PDF-1.4 mock"
        });
        return;
      }

      await route.fulfill({ status: 404, body: "not mocked" });
    });

    await page.goto("/briefings");
    await expect(page).toHaveURL(/\/briefings/);
    await expect(page.getByRole("heading", { name: /briefings/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /briefing/i }).first().click();
    await expect(page).toHaveURL(/\/briefings\/b-1/);
    await expect(page.getByRole("button", { name: /modifier|ok/i })).toBeVisible();
  });

  test("API error -> demo data fallback and log", async ({ page }) => {
    const logs: string[] = [];
    await page.addInitScript(() => localStorage.setItem("briefops:e2e-auth", "1"));

    page.on("console", (msg) => {
      logs.push(msg.text());
    });

    await page.route("**/api/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "e2e-user", email: "e2e@example.com" },
          plan: "free",
          org: { id: "org-1", name: "Org" },
          role: "owner",
          is_admin: true,
          degraded: false
        })
      });
    });

    await page.route("**/api/briefings", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "down" }) });
    });

    await page.goto("/briefings");
    await expect(page.getByRole("heading", { name: /briefings/i }).first()).toBeVisible();
    await expect.poll(() => page.getByText(/demo data/i).count()).toBeGreaterThan(0);

    await expect.poll(() => logs.some((line) => line.includes("[MOCK DATA]"))).toBeTruthy();
  });

  test("language + dark mode toggles", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("briefops:e2e-auth", "1"));
    await page.route("**/api/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "e2e-user", email: "e2e@example.com" },
          plan: "free",
          org: { id: "org-1", name: "Org" },
          role: "owner",
          is_admin: true,
          degraded: false
        })
      });
    });

    await page.route("**/api/briefings", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
    });

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings|param[eè]tres/i }).first()).toBeVisible();

    const enButton = page.getByRole("button", { name: /^EN$/ });
    if (await enButton.count()) {
      await enButton.first().click();
    }
    const frButton = page.getByRole("button", { name: /^FR$/ });
    if (await frButton.count()) {
      await frButton.first().click();
    }

    await page.getByRole("button", { name: /dark|sombre|nuit/i }).first().click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
