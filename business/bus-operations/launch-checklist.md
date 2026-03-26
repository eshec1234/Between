# Launch Checklist

**Owner:** Business Operations

---

## Pre-Launch: Technical

- [ ] Supabase project "between-app" created
- [ ] PostGIS extension enabled on Supabase project
- [ ] `001_initial_schema.sql` migration executed successfully
- [ ] RLS policies verified (test anonymous select, test community insert)
- [ ] Mapbox token added to Vercel env vars
- [ ] Supabase URL + anon key added to Vercel env vars
- [ ] Vercel deployment succeeds (no build errors)
- [ ] All routes work on deployed URL (/, /place/:id, /submit)
- [ ] Service worker registers successfully
- [ ] PWA manifest valid (Chrome DevTools > Application > Manifest)
- [ ] Lighthouse PWA score ≥ 80
- [ ] App installable on iOS Safari and Android Chrome
- [ ] Onboarding appears on first visit; does not appear on return
- [ ] Anonymous session persists across page reloads
- [ ] Place submission works end-to-end
- [ ] Experience report submission works end-to-end
- [ ] Map renders correctly in both Sanctuary and Theophany modes

---

## Pre-Launch: Content

- [ ] 5–10 seed places entered (PA, NJ, or NY)
- [ ] All seed places have: name, address, city, state, mode, description, coordinates
- [ ] All Theophany seed places show disclaimer
- [ ] No forbidden words in any place description (see forbidden-words.md)
- [ ] No AI-generated descriptions (see ai-behind-curtain-policy.md)
- [ ] Indigenous land policy applied to all seed places

---

## Pre-Launch: Legal / Ethics

- [ ] Privacy policy accessible in app or via link
- [ ] Terms of service accessible in app or via link
- [ ] What This App Is Not FAQ accessible
- [ ] Metaphysical Drift Check logged for Week 5

---

## Launch Day

- [ ] Vercel deployment is production (not preview)
- [ ] Custom domain configured (if applicable)
- [ ] First 5 word-of-mouth messages sent (see discovery-framing.md)
