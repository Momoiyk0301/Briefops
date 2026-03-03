import { expect, test } from "@playwright/test";

test.describe("BriefOPS e2e", () => {
  test("signup/login -> onboarding -> create briefing -> save -> export", async ({ page }) => {
    let onboarded = false;
    let briefings: Array<{ id: string; title: string; event_date: string | null; location_text: string | null }> = [];

    await page.route("**://localhost:3000/api/**", async (route) => {
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
            org: onboarded ? { id: "org-1", name: "E2E Org" } : null
          })
        });
        return;
      }

      if (url.pathname === "/api/onboarding" && method === "POST") {
        onboarded = true;
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

    await page.goto("/login");
    await page.getByPlaceholder("Email").fill("e2e@example.com");
    await page.getByPlaceholder("Password").fill("secret12");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByPlaceholder("Organization name").fill("E2E Org");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page).toHaveURL(/\/briefings/);
    await page.getByRole("button", { name: "New briefing" }).click();
    await expect(page).toHaveURL(/\/briefings\/b-1/);

    await page.getByPlaceholder("Title").fill("E2E briefing");
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: "Download PDF" }).click();
  });

  test("API error -> demo data fallback and log", async ({ page }) => {
    const logs: string[] = [];
    await page.addInitScript(() => localStorage.setItem("briefops:e2e-auth", "1"));

    page.on("console", (msg) => {
      logs.push(msg.text());
    });

    await page.route("**://localhost:3000/api/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { id: "e2e-user", email: "e2e@example.com" }, plan: "free", org: { id: "org-1", name: "Org" } })
      });
    });

    await page.route("**://localhost:3000/api/briefings", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "down" }) });
    });

    await page.goto("/briefings");
    await expect(page.getByText("Demo data")).toBeVisible();

    await expect.poll(() => logs.some((line) => line.includes("[MOCK DATA]"))).toBeTruthy();
  });

  test("language + dark mode toggles", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("briefops:e2e-auth", "1"));
    await page.route("**://localhost:3000/api/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { id: "e2e-user", email: "e2e@example.com" }, plan: "free", org: { id: "org-1", name: "Org" } })
      });
    });

    await page.route("**://localhost:3000/api/briefings", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
    });

    await page.goto("/briefings");

    await page.getByRole("button", { name: "FR" }).click();
    await expect(page.getByText("Briefings")).toBeVisible();

    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
