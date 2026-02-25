# UX Plan: Airbnb-like Look & Feel

**Role:** Senior UX Designer (15+ years)  
**Scope:** Itinerary Enricher → Travel Planner with an inviting, trust-building, “want to use it” experience.  
**Reference:** In-browser audit of Home, Trips list, and Trip detail (Vietnam 2026).

---

## 1. Brand & Visual Identity

**Current state:** Monochrome (black/white/grey), Geist font, shadcn defaults. Reads as a utility tool, not a travel product.

**Opportunities & solutions:**

| Opportunity | Concrete solution |
|-------------|-------------------|
| **Warm, recognizable palette** | Introduce a primary accent (e.g. Airbnb-style coral `#FF5A5F` or a softer terracotta) for CTAs, links, and key highlights. Use warm neutrals for backgrounds (e.g. `oklch(0.98 0.01 70)` off-white) instead of pure grey. |
| **Distinct typography** | Keep Geist for UI; add a display or serif font for hero headings and trip titles (e.g. “Vietnam 2026”) to add personality and hierarchy. |
| **Softer, more “product” surfaces** | Increase card radius (e.g. `--radius: 0.875rem` or `1rem`), use subtle shadows (`shadow-sm` / `shadow-md`) and avoid harsh borders so cards feel like “listings” not forms. |
| **Consistent spacing scale** | Define an 8px-based spacing scale and use it everywhere (header, sections, cards) so the layout breathes like Airbnb’s grid. |

---

## 2. Home / Entry Experience

**Current state:** Single card with “New itinerary”, trip name input, raw text textarea, and “Enrich and save”. No imagery, no inspiration, no clear “why use this”.

**Opportunities & solutions:**

| Opportunity | Concrete solution |
|-------------|-------------------|
| **Hero that inspires** | Add a hero section: large, high-quality travel photo (or rotating gallery) with overlay text: e.g. “Turn your notes into a trip you can see” and a single primary CTA that scrolls to the form or opens it in a clear step. |
| **Progressive disclosure** | Replace one big form with steps: (1) “Name your trip” → (2) “Paste your itinerary” → (3) “Enrich and save”. Use a step indicator and back/next so it feels like a flow, not a dump. |
| **Trust and clarity** | Under the CTA, add one line: “We add places, photos, and map links so you can explore your trip at a glance.” Optional: “Your data stays in your account” with a lock icon. |
| **Secondary entry** | If user has trips: show “Recent trips” (e.g. 2 cards with thumbnails) above or beside the “New itinerary” card so returning users see value immediately. |

---

## 3. Trips List (“My trips”)

**Current state:** Plain list of cards (trip name + date). No imagery, no preview of the trip. One card’s link exposes raw itinerary text and long Google Maps URLs in the accessible name.

**Opportunities & solutions:**

| Opportunity | Concrete solution |
|-------------|-------------------|
| **Image-first cards** | Each trip card = one dominant image (e.g. first day’s first place image, or a trip cover). Aspect ratio 16:10 or 4:3, rounded corners, object-cover. Title and date overlay bottom or below. |
| **Clear card content** | Card should contain only: image, trip name, date (e.g. “Mar 13–20, 2026” or “Created Feb 22”), optional short subtitle (“5 days · 12 places”). Remove raw URLs and full itinerary text from card content and from link accessible names. |
| **Grid vs list** | Offer a responsive grid (e.g. 2 columns on tablet, 3 on desktop) so “My trips” feels like a gallery of trips, not a stack of forms. |
| **Empty state** | When no trips: illustration or photo + “No trips yet” + “Create your first trip” CTA (primary button) and one sentence on what they’ll get (places, photos, map). |
| **Quick actions** | On hover/focus: subtle “View” or arrow; avoid cluttering with many buttons until you add edit/duplicate/delete. |

---

## 4. Trip Detail (Day & Places)

**Current state:** Day card with date + city, theme, summary; places in sections (Afternoon/Evening) with small thumbnails, name, coordinates badge, and address. Functional but technical (coordinates visible), one place had no image (placeholder).

**Opportunities & solutions:**

| Opportunity | Concrete solution |
|-------------|-------------------|
| **Trip hero** | Top of trip: large cover image (first day’s first place or a day collage), trip title, and dates in a clear strip. Optional: “X days · Y places” pill. |
| **Hide technical data** | Remove lat/lng from the main place card; keep in data model and show only in “Copy coordinates” or a “Map” view. Replace with user-friendly copy, e.g. “Ho Chi Minh City” or “District 1”. |
| **Place cards = listing style** | Each place: image leading (larger thumb, e.g. 120×90 or 160×120), then title (link), then one line of location/context. No coordinates in the default view. Optional: “View on map” link. |
| **Consistent place imagery** | If no image: use a branded placeholder (e.g. illustration or “No photo” icon + place name) instead of a grey box so it doesn’t look broken. |
| **Day as sections** | Keep Morning/Afternoon/Evening as clear section headings; consider collapsible sections for long days so the page is scannable. |
| **Sticky CTA** | On scroll: sticky bar or FAB “View on map” (when you add a map) or “Share trip” to give a clear next action. |
| **Breadcrumb** | “Trips → Vietnam 2026” above the hero so back-navigation is obvious. |

---

## 5. Navigation & Global UI

**Current state:** Minimal header (title + “My trips” or “Trips” / “New itinerary”), small footer with OSM/Wikipedia. No logo, no global nav, no user menu.

**Opportunities & solutions:**

| Opportunity | Concrete solution |
|-------------|-------------------|
| **Persistent header** | Sticky header with: (1) logo/wordmark left, (2) primary nav: “Trips” (or “My trips”), “New trip”, (3) right: user avatar/initial (link to profile/settings if you add them). Same on all pages. |
| **Logo** | Add a simple logo or wordmark (“Travel Planner” or product name) that links to home. |
| **Footer** | Keep credits (OSM, Wikipedia) in a compact footer; optionally add “About”, “Privacy”, “Help” if you have those pages. |
| **Page titles** | Ensure `<title>` and main heading match the page (e.g. “Vietnam 2026 – Travel Planner”). |

---

## 6. Micro-interactions & Polish

**Current state:** Buttons and links have hover states from shadcn; no loading skeletons, no transition between list → detail.

**Opportunities & solutions:**

| Opportunity | Concrete solution |
|-------------|-------------------|
| **Card hover** | Trip cards and place cards: slight scale or shadow increase on hover, and clear cursor pointer. Optional: short transition (150–200ms). |
| **Loading states** | “Enrich and save”: show a clear loading state (spinner + “Adding places & photos…”). Trips list: skeleton cards (image strip + 2 lines) while data loads. Trip detail: skeleton for day cards. |
| **Success feedback** | After save: toast is good; optionally add a short confirmation on the trip detail (“Trip saved” banner that auto-dismisses). |
| **Focus and accessibility** | Keep visible focus rings; ensure “Skip to main content” and heading order (h1 → h2 → h3) so the flow is clear for keyboard and screen readers. |

---

## 7. Content & Copy

**Current state:** Straightforward labels (“Trip name”, “Raw itinerary text”, “Enrich and save”). No tone of voice or reassurance.

**Opportunities & solutions:**

| Opportunity | Concrete solution |
|-------------|-------------------|
| **Friendly, human tone** | Use copy that feels personal: e.g. “Where to?” for trip name placeholder, “Paste your plan—dates, places, links—we’ll add the rest” for the textarea. |
| **One-line value prop** | On home: “One paste. Places, photos, and map links. Ready to explore.” |
| **Empty states** | “No trips yet” → “Your next adventure starts here. Create a trip from your notes and we’ll add places and photos.” |
| **Errors** | Keep errors clear and actionable; add a short recovery hint (e.g. “Check your itinerary format or try again in a moment.”). |

---

## 8. Prioritized Roadmap (suggested order)

1. **Quick wins (1–2 days)**  
   - Warm palette + primary accent; increase card radius and soft shadows.  
   - Fix trips list: image on each card (first place image), remove raw URLs from link text.  
   - Trip detail: hide coordinates from main card; show location name only; improve placeholder when image missing.  
   - Sticky header with logo + “Trips” / “New trip” + avatar.

2. **High impact (≈1 week)**  
   - Home: hero section + short value prop; optional step-by-step form.  
   - Trips list: grid layout, proper empty state with CTA.  
   - Trip detail: trip hero (cover image + title + dates), breadcrumb, place cards in “listing” style.

3. **Next (ongoing)**  
   - Loading skeletons everywhere.  
   - Micro-interactions (hover, transitions).  
   - Map view and “View on map” CTA.  
   - Share trip, duplicate trip, edit/delete.

---

## Summary

The app is functionally solid but reads as a utility. To feel “Airbnb-like”: **lead with imagery**, **warm, consistent visual system**, **clear hierarchy and cards**, **hide technical details**, and **friendly, goal-oriented copy**. The table entries above are concrete solution ideas you can implement directly; start with the quick wins, then the high-impact list and content pass.
