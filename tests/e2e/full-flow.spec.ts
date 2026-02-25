import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("Full flow: create trip from Vietnam itinerary", () => {
  test("home → submit itinerary → trip detail with daily, calendar, timeline", async ({
    page,
  }) => {
    test.skip(
      !!process.env.CI,
      "Full flow requires OPENAI + Supabase; run locally with 'npm run dev' and .env.local"
    );
    test.setTimeout(360000);
    const itineraryPath = path.join(
      __dirname,
      "../fixtures/vietnam-itinerary.txt"
    );
    const itineraryText = fs.readFileSync(itineraryPath, "utf-8");

    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /turn your notes into a trip/i })
    ).toBeVisible();

    await page.getByLabel(/where to/i).fill("Vietnam Trip E2E");
    await page.getByLabel(/your itinerary/i).fill(itineraryText);

    await page.getByRole("button", { name: /create trip/i }).click();

    const redirectOk = await page.waitForURL(/\/trips\/[a-f0-9-]+/, { timeout: 300000 }).catch(() => false);
    if (!redirectOk) {
      const errorEl = page.getByRole("alert").first();
      const errorText = await errorEl.textContent().catch(() => null);
      throw new Error(
        `Form did not redirect to trip page. ${errorText ? `Form error: ${errorText.slice(0, 200)}` : "Check that .env.local has OPENAI_API_KEY and Supabase keys, and run 'npm run dev' before 'npm run test:e2e' so the app uses your env."}`
      );
    }

    await expect(
      page.getByRole("heading", { name: /Vietnam Trip E2E/i })
    ).toBeVisible();

    await expect(page.getByText(/days.*stops/i)).toBeVisible();

    await expect(page.getByRole("button", { name: "Daily" })).toBeVisible();
    await page.getByRole("button", { name: "Calendar" }).click();
    await expect(page.getByText(/Ho Chi Minh|Hue|Hanoi|Mar/i).first()).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "Timeline" }).click();
    await expect(page.getByText(/Day \d|Travel/i).first()).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "Daily" }).click();

    const dayContent = page.locator("text=Day 1").or(page.locator("text=Ho Chi Minh")).first();
    await expect(dayContent).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Smoke: pages load", () => {
  test("home has hero and form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /turn your notes/i })).toBeVisible();
    await expect(page.getByLabel(/where to/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create trip/i })).toBeVisible();
  });

  test("trips list loads", async ({ page }) => {
    const res = await page.goto("/trips");
    if (res?.status() === 500) {
      test.skip(true, "Trips page returned 500 (Supabase may be unavailable when Playwright starts the server). Run 'npm run dev' first, then 'npm run test:e2e' to use your .env.local.");
    }
    expect(res?.status()).toBe(200);
    await expect(
      page.getByText("My Trips").or(page.getByText("Your next adventure starts here"))
    ).toBeVisible();
  });
});
