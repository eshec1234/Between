# Wireframes & UX Reference

**Owner:** UX/UI
**Design inspiration:** YikYak spatial feed + contemplative minimalism

---

## Design Principles

1. **Mobile-first.** Every screen designed for 375px width (iPhone SE) up.
2. **Atmosphere before information.** The mode (Sanctuary/Theophany) sets visual context before content loads.
3. **No chrome.** Minimal navigation. No bottom tabs. No hamburger menus.
4. **Typography-led.** Cinzel + Cormorant Garamond carry the weight. Didact Gothic for functional text only.
5. **Two color worlds.** Sanctuary (warm parchment) and Theophany (electric dark) are fully distinct environments.

---

## Screen Map

```
/ (Home)
├── Mode toggle (top bar)
├── Map (Mapbox, 224px)
├── Place cards (feed)
│   ├── Photo strip
│   ├── Place name + location
│   ├── Description preview (2 lines)
│   ├── [Theophany only] Disclaimer
│   └── [If traditions] Traditions preview
└── Submit FAB (+)

/place/:id (Place Detail)
├── Back link
├── Photo (if exists)
├── Mode badge + source badge
├── Name + address
├── Full description
├── [Theophany only] Disclaimer
├── Cultural context block (if any)
├── Category tags
├── Experience Reports section
│   ├── Submit form
│   │   ├── Textarea
│   │   ├── Reflection tag chips
│   │   └── Submit button
│   └── Report list (anonymous)
└── (no footer)

/submit (Submit Place)
├── Back link
├── Name field
├── Mode selector (3-way toggle)
├── Address + City + State
├── Lat/Lng fields
├── Description textarea
├── Cultural context accordion
│   ├── Traditions
│   ├── Sensitivities
│   └── Access protocols
└── Submit button
```

---

## Color System

### Sanctuary Mode
- Background: `#fffef8` (warm white)
- Surface: `#f8eedd` (parchment)
- Accent: `#c8a870` (aged gold)
- Text: `#3a2812` (dark brown)
- Muted: `#9a8060`

### Theophany Mode
- Background: `#010407` (near black)
- Surface: `#030a0e`
- Accent: `#7ababa` (electric teal)
- Text: `#c8e0e0` (cool white)
- Muted: `#2e5858`

---

## Typography

| Use | Font | Style |
|---|---|---|
| App name, headings | Cinzel | 400–600, tracked |
| Body, descriptions, quotes | Cormorant Garamond | 400/italic |
| Labels, UI elements | Didact Gothic | 400, uppercase + tracking |

---

## Figma

*(Link to be added when design file is created)*

---

## YikYak Inspiration

The feed is spatial, anonymous, and local — just like YikYak. Key parallels:
- No usernames, no avatars
- Content is anchored to a place, not a person
- Feed shows what's nearby
- Submission is lightweight (no account gate)

Key divergences:
- No voting or ranking
- No "hot" content
- No push notifications
- Aesthetic is contemplative, not social
