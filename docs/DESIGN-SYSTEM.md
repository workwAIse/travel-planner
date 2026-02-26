# Travel Planner — Premium Lifestyle Travel Design System (v1)

Positioning: **Inspirational lifestyle travel**
Tone: warm, human, editorial, calm confidence (Airbnb-grade polish, less "SaaS-y").

---

## 1) Foundations

### 1.1 Color Principles
- **Neutrals dominate** (premium travel = restraint).
- **One emotional accent** (sunset/terracotta) + **one travel counter-accent** (deep teal).
- **Soft surfaces + subtle elevation** instead of hard borders.
- **Semantic tokens only** (never use raw hex in components).

---

## 2) Color System

### 2.1 Brand Palette (Light)
**Neutrals**
- Canvas (app bg): `#F7F3EE`
- Surface 1 (cards): `#FBF8F4`
- Surface 2 (popovers/modals): `#FFFFFF`
- Border (subtle): `#E7DED5`

**Text**
- Text / Primary: `#2C1F18` (espresso)
- Text / Secondary: `#7A6F66` (weathered taupe)
- Text / Tertiary: `#A89C92` (soft taupe)

**Accents**
- Primary / Terracotta: `#C65D3B`
- Primary / Hover: `#B14E2F`
- Secondary / Deep Teal: `#1F5F61`
- Secondary / Hover: `#184C4E`

**Support**
- Highlight / Dusty Blush: `#F2E4DF`
- Success: `#2FB171`
- Warning: `#D9A441`
- Destructive: `#D64545`
- Info: `#2D6CDF`

### 2.2 Brand Palette (Dark)
Dark mode should feel like **candlelight / espresso bar**, not neon UI.

**Neutrals**
- Canvas: `#120B07`
- Surface 1: `#1A120E`
- Surface 2: `#221812`
- Border: `rgba(255,255,255,0.10)`

**Text**
- Text / Primary: `#FAF6F1`
- Text / Secondary: `rgba(250,246,241,0.72)`
- Text / Tertiary: `rgba(250,246,241,0.50)`

**Accents**
- Primary / Terracotta: `#E07A57`
- Primary / Hover: `#D56C49`
- Secondary / Deep Teal: `#5AA6A8`
- Secondary / Hover: `#4C9496`

**Support**
- Highlight: `rgba(224,122,87,0.14)`
- Success: `#36C07B`
- Warning: `#E3B24A`
- Destructive: `#FF5A5A`
- Info: `#6CA8FF`

---

## 3) Design Tokens

See `app/globals.css` for the implemented CSS variables.

## 4) Typography

- Display / Editorial: DM Serif Display
- UI / Body: Geist
- Optional monospace: Geist Mono

## 5) Layout & Spacing

- 8px spacing base: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80
- App max width: 1200px
- Form content max: 640px

## 6) Elevation

- Cards: shadow-sm by default, shadow-md on hover with translateY(-2px)
- Modals: shadow-lg

## 7) Motion

- Micro transitions: 160-240ms, ease-out
- Card hover: translateY(-2px)
- Button press: scale(0.98)

## 8) Accessibility

- WCAG AA contrast minimum
- 44x44px touch targets
- Visible focus rings always
- Respect prefers-reduced-motion
