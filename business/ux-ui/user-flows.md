# User Flows

**Owner:** UX/UI

---

## Flow 1: First-Time Visitor

```
Land on app
  → Onboarding interstitial (full screen)
      "You don't need to believe in anything..."
      [Enter] button
  → Home screen (Sanctuary mode default)
  → Map + feed loads
  → Browse places
```

**State managed by:** `localStorage.between_onboarding_seen`

---

## Flow 2: Browse & Discover

```
Home screen
  → [Optional] Toggle to Theophany mode
  → Scroll feed
  → Tap a place card
  → Place detail page
      → Read description
      → [Theophany] Read disclaimer
      → Read experience reports
  → Back to feed
```

---

## Flow 3: Submit Experience Report

```
Place detail page
  → Scroll to Experience Reports
  → Type in textarea (max 1000 chars)
  → [Optional] Select reflection tag chip
  → Tap "Submit Experience Report"
  → Success state ("Your experience report has been submitted.")
  → New report appears in list
```

**Anonymous:** Uses `localStorage.between_session_id` — no login required.

---

## Flow 4: Submit a Place

```
Home screen
  → Tap + FAB
  → Submit Place form
  → Fill: Name, Mode, Address, City, State
  → Fill: Lat/Lng (from Google Maps)
  → Fill: Description (human experience only)
  → [Optional] Fill Cultural Context
  → Tap "Submit Place"
  → Redirect to Home
```

**Note:** Community submissions are `source: community`. Moderation review occurs asynchronously.

---

## Flow 5: Return Visitor

```
Land on app
  → No onboarding (localStorage flag set)
  → Home screen directly
  → Anonymous session restored from localStorage
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No places near user | Empty state: "No places here yet. Be the first to add one." |
| Place not found (/place/:id with bad ID) | 404 state with back link |
| Supabase unavailable | Graceful empty state — no crash |
| No Mapbox token | Map fails to render; feed still works |
| User clears localStorage | New session ID generated; onboarding shown again |
