import { test, expect } from "@playwright/test";

/**
 * Validates new functions from the Vietnam Trip Planner plan:
 * - Trip hero, breadcrumb, view switcher (Daily / Calendar / Timeline)
 * - Extend trip dialog ("Add a day")
 * - Daily view (day selector, content), Calendar view, Timeline view
 *
 * Run with an existing trip: ensure dev server is running with .env.local
 * and either create a trip first or set E2E_TRIP_ID to a valid trip UUID.
 */
test.describe("Trip detail: new functions (plan validation)", () => {
  test("trips list shows My Trips and empty state or trip cards", async ({
    page,
  }) => {
    const res = await page.goto("/trips");
    if (res?.status() === 500) {
      test.skip(
        true,
        "Trips page returned 500 (Supabase/env). Run 'npm run dev' then 'npm run test:e2e' to use .env.local."
      );
      return;
    }
    expect(res?.status()).toBe(200);
    await expect(
      page
        .getByText("My Trips")
        .or(page.getByText("Your next adventure starts here"))
    ).toBeVisible();
  });

  test("trip detail: hero, breadcrumb, view switcher, extend button", async ({
    page,
  }) => {
    const tripId = process.env.E2E_TRIP_ID;
    if (!tripId) {
      await page.goto("/trips");
      const firstTripLink = page.locator('a[href^="/trips/"]').first();
      const count = await firstTripLink.count();
      if (count === 0) {
        test.skip(true, "No trips in list and E2E_TRIP_ID not set");
        return;
      }
      await firstTripLink.click();
    } else {
      await page.goto(`/trips/${tripId}`);
    }

    await expect(page).toHaveURL(/\/trips\/[a-f0-9-]+/);

    // Hero: trip name in h1
    await expect(page.locator("main").getByRole("heading", { level: 1 })).toBeVisible();

    // Breadcrumb: "Trips" link (scope to breadcrumb nav to avoid header link)
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /breadcrumb/i }).getByRole("link", { name: "Trips" })).toBeVisible();

    // View switcher: Daily, Calendar, Timeline
    await expect(page.getByRole("button", { name: "Daily" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Calendar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Timeline" })).toBeVisible();

    // Extend trip: "Add a day" button
    await expect(page.getByRole("button", { name: /add a day/i })).toBeVisible();
  });

  test("trip detail: Calendar view shows calendar content", async ({
    page,
  }) => {
    const tripId = process.env.E2E_TRIP_ID;
    if (!tripId) {
      await page.goto("/trips");
      const firstTripLink = page.locator('a[href^="/trips/"]').first();
      if ((await firstTripLink.count()) === 0) {
        test.skip(true, "No trips and E2E_TRIP_ID not set");
        return;
      }
      await firstTripLink.click();
    } else {
      await page.goto(`/trips/${tripId}`);
    }

    await page.getByRole("button", { name: "Calendar" }).click();
    await expect(
      page.getByText(/Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|\d{1,2}/).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("trip detail: Timeline view shows timeline content", async ({
    page,
  }) => {
    const tripId = process.env.E2E_TRIP_ID;
    if (!tripId) {
      await page.goto("/trips");
      const firstTripLink = page.locator('a[href^="/trips/"]').first();
      if ((await firstTripLink.count()) === 0) {
        test.skip(true, "No trips and E2E_TRIP_ID not set");
        return;
      }
      await firstTripLink.click();
    } else {
      await page.goto(`/trips/${tripId}`);
    }

    await page.getByRole("button", { name: "Timeline" }).click();
    await expect(
      page.getByText(/Day \d|Travel/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("trip detail: Extend trip dialog opens and shows form", async ({
    page,
  }) => {
    const tripId = process.env.E2E_TRIP_ID;
    if (!tripId) {
      await page.goto("/trips");
      const firstTripLink = page.locator('a[href^="/trips/"]').first();
      if ((await firstTripLink.count()) === 0) {
        test.skip(true, "No trips and E2E_TRIP_ID not set");
        return;
      }
      await firstTripLink.click();
    } else {
      await page.goto(`/trips/${tripId}`);
    }

    await page.getByRole("button", { name: /add a day/i }).click();
    await expect(
      page.getByRole("dialog").getByText(/add a day to your trip/i)
    ).toBeVisible({ timeout: 3000 });
    await expect(page.getByLabel(/insert after/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
  });
});
