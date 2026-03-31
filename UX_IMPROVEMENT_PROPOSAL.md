# UX improvement proposal (IP)

**Product:** Between (Sanctuary / Theophany)  
**Review date:** 2026-03-31  
**Scope:** Full build walkthrough from researcher perspective — home, place detail, submit, onboarding, shell routing, and build output.

---

## Summary

Theophany home buried legally relevant context (disclaimer-adjacent copy and the omen / intensity legend) below the activity feed, engagement hub, filters, map, and optional “dark horse” rail — forcing a long scroll before users saw framing that affects trust and interpretation. **That layout issue is fixed:** the disclaimer, today’s omen, and intensity scale now sit directly under the hero copy when Theophany mode is active, before heavier modules.

Remaining work below is **prioritized** so product and engineering can sequence without re-auditing the whole app.

---

## Implemented in this pass

| Item | Change |
|------|--------|
| Theophany home — disclaimer visibility | Moved **Disclaimer** (reuse of `TheophanyDisclaimer`), **Today’s omen**, and **Intensity scale** to the top of the scroll stack (after tagline/intro, before PWA prompt and feed). |
| Parity with place pages | `TheophanyDisclaimer` now accepts optional `className` for embedding in a card without double borders. Home uses a labeled `<section aria-label="Theophany disclaimer">` for clarity. |
| Duplicate content removed | Former lower placement of omen + intensity (after map / dark horse) removed so content is not repeated. |

---

## P0 — Trust, safety, and legal alignment

1. **Submit flow — Theophany disclaimer**  
   `SubmitPlace` does not surface the same supernatural / user-report disclaimer when `mode` is `theophany` or `both`. Contributors should see it **before** submit (checkbox acknowledgment optional) to align with “every Theophany touchpoint” intent in operations docs.

2. **AI narration disclosure**  
   Place detail and walkthrough use immersive AI; ensure a **short, plain-language** notice appears wherever narration starts (not only in FAQ), especially for liminal / haunted framing where emotional bandwidth is higher.

3. **Location consent copy**  
   Onboarding pairs geolocation with `Notification.requestPermission()` immediately after “agree.” Consider **decoupling** or explaining why notifications matter, to avoid consent fatigue and mistrust.

---

## P1 — Information architecture and cognitive load

4. **Home page length (both modes)**  
   Single long column: feed → engagement → filters → surprise → map → list. **Mitigations:** sticky section tabs (“Feed · Explore · Map · Places”), collapsible `<details>` for advanced filters, or a two-step layout on large screens.

5. **Developer-oriented status line**  
   The `feedKind` line (“Within ~350 km…”, “Catalog order…”) reads like **ops/debug** copy. Replace with user-facing language or tuck behind a “Having issues?” disclosure.

6. **Routing shell consistency**  
   `/about` and `/faq` sit **outside** `AppFrame` / `MainApp` in `App.jsx`, so chrome and safe-area behavior may differ from `/`. Unify shell for predictable back navigation and visual continuity.

7. **Floating “+” FAB vs. thumb reach**  
   Bottom-right FAB can conflict with OS gestures on iOS. Consider **bottom-center** with safe-area padding or an inline header action.

---

## P2 — Accessibility (WCAG-minded)

8. **Focus order and route announcements**  
   SPA route changes should move focus to an **`h1` or `main` landmark** with `tabIndex={-1}` where appropriate, so screen-reader users hear context after navigation.

9. **Map component**  
   Ensure **keyboard** operability, visible focus for place pins where possible, and **text alternative** summarizing “map shows places near you” for non-visual users.

10. **Touch targets**  
    Many labels use `text-[9px]` / `text-[8px]` with `min-h-[44px]` on some controls — audit **adjacent tappables** (e.g., feed chevrons, filter chips) for 44×44px effective targets.

11. **Motion**  
    Starfield, particle onboarding, and hover lifts: respect **`prefers-reduced-motion`** (reduce or replace with static gradients).

12. **Contrast**  
    Theophany **muted violet** text on dark purple backgrounds — spot-check **WCAG AA** for body-size copy (especially `opacity-*` utilities).

---

## P3 — Performance and resilience

13. **Bundle size**  
    Vite warns **~2.18 MB** JS (gzip ~609 KB). Introduce **route-based code splitting** (`React.lazy` for `Map`, place detail, submit) and consider lighter Map loading (defer until section visible).

14. **Env warning banner**  
    The amber “missing env” block is correct for dev; in production **avoid flashing** partially configured builds — fail build or use runtime fallback messaging that does not expose variable names to end users.

---

## P4 — Content and microcopy

15. **Intensity legend on home vs. filters**  
    Intensity is now visible early; ensure **filter copy** (“min intensity”) still makes sense for first-time readers (tooltip or link “what this means”).

16. **Mock ad slots**  
    Clearly label as **placeholder / demo** if shown to external testers to avoid confusion with real ads.

17. **Error messages on submit**  
    RLS / schema errors are helpful for builders but **harsh for contributors** — add a short friendly line plus “try again later” when `42501` or `PGRST205`.

---

## Research recommendations (validate with users)

- **5-second test** on Theophany home: do users understand “notice / liminal” + disclaimer **without** reading the FAQ?  
- **Think-aloud** first session: location consent + notification prompt — note drop-off.  
- **Card sort** for home sections: ideal order for “new visitor” vs. “returning local browser.”

---

## Suggested tracking

Convert P0/P1 items into GitHub issues with labels `trust`, `a11y`, `IA`, `performance`; link this document as context. Revisit this IP after major navigation or mode changes.
