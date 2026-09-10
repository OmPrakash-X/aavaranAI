# Design System — Liquid Glass Monochrome UI
> Reference: Coders Management Dashboard (UI Image)
> Scope: Dashboard · Website · Browser Extension · Landing Page

---

## 1. Design Philosophy

This design system is built around a single visual language: **liquid glass monochrome**. The aesthetic is surgical and precise — near-white surfaces, near-black depth zones, and a glassomorphic shell wrapping everything together. There is no chromatic accent color. Contrast, weight, and surface material carry all the hierarchy.

**Core principles:**
- **Material first.** Every surface has a material identity — frosted glass, matte white, or matte black. Never flat color without material intention.
- **Monochrome discipline.** Zero chromatic accents. Depth is achieved through value (lightness/darkness) and surface transparency alone.
- **Negative space as structure.** Padding and whitespace are not fill — they are load-bearing. Cards breathe; content does not crowd.
- **One bold moment per view.** Every screen has exactly one element that commands attention. Everything else defers.
- **Motion only on action.** No ambient animation. Transitions respond to user events — open, close, submit, select.

---

## 2. Color Palette

All colors are grayscale. Surface depth is communicated through value and material (opacity + blur), not hue.

```
/* ─── SURFACE COLORS ─────────────────────────────── */
--color-glass-bg:       rgba(255, 255, 255, 0.18)    /* Liquid glass shell */
--color-glass-border:   rgba(255, 255, 255, 0.45)    /* Glass edge highlight */
--color-glass-blur:     20px                          /* backdrop-filter blur */

--color-surface-00:     #F0F0F0                       /* Page background */
--color-surface-01:     #FFFFFF                       /* Primary card background */
--color-surface-02:     #F7F7F7                       /* Secondary / inset panels */
--color-surface-03:     #EEEEEE                       /* Hover state, subtle divide */

--color-dark-00:        #0D0D0D                       /* Dark card background */
--color-dark-01:        #1A1A1A                       /* Dark secondary surface */
--color-dark-02:        #2A2A2A                       /* Dark hover / raised */
--color-dark-overlay:   rgba(13, 13, 13, 0.85)        /* Overlay / scrim */

/* ─── TEXT COLORS ────────────────────────────────── */
--color-text-primary:   #111111                       /* Headings, bold labels */
--color-text-secondary: #888888                       /* Sub-labels, captions */
--color-text-tertiary:  #BBBBBB                       /* Placeholder, disabled */
--color-text-inverse:   #FFFFFF                       /* Text on dark surfaces */
--color-text-inverse-2: rgba(255, 255, 255, 0.65)    /* Muted on dark surfaces */

/* ─── BORDER & DIVIDER ────────────────────────────── */
--color-border-light:   #EBEBEB                       /* Card borders */
--color-border-dark:    rgba(255, 255, 255, 0.12)     /* Borders on dark cards */
--color-divider:        #F0F0F0                       /* Row dividers */

/* ─── FUNCTIONAL ──────────────────────────────────── */
--color-pill-bg:        #111111                       /* Active/filled pill */
--color-pill-text:      #FFFFFF                       /* Text inside dark pill */
--color-tag-bg:         #F2F2F2                       /* Light tag background */
--color-tag-text:       #444444                       /* Light tag text */

/* ─── SHADOW SYSTEM ───────────────────────────────── */
--shadow-xs:    0 1px 3px rgba(0, 0, 0, 0.04);
--shadow-sm:    0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-md:    0 4px 20px rgba(0, 0, 0, 0.08);
--shadow-lg:    0 8px 40px rgba(0, 0, 0, 0.12);
--shadow-glass: 0 8px 32px rgba(31, 38, 135, 0.06),
                0 2px 0 rgba(255, 255, 255, 0.60) inset,
                0 -1px 0 rgba(0, 0, 0, 0.06) inset;
```

### Palette Quick Reference

| Token | Hex / Value | Role |
|---|---|---|
| `surface-00` | `#F0F0F0` | Page background |
| `surface-01` | `#FFFFFF` | Card / panel |
| `dark-00` | `#0D0D0D` | Dark card |
| `text-primary` | `#111111` | All headings |
| `text-secondary` | `#888888` | Labels, captions |
| `pill-bg` | `#111111` | Filled pill / active nav |
| `border-light` | `#EBEBEB` | Card edges |
| `glass-bg` | `rgba(255,255,255,0.18)` | Glass shell layer |

---

## 3. Typography

**Typeface:** `Inter` (primary) — geometric humanist sans-serif, weights 300/400/500/600/700.
**Fallback stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

No secondary typeface. Weight, tracking, and size handle all typographic hierarchy.

```css
/* ─── TYPE SCALE ─────────────────────────────────── */
--text-3xl:   32px / 1.1  / weight 700     /* Page title (e.g. "Management") */
--text-2xl:   24px / 1.2  / weight 600     /* Section title, card heading */
--text-xl:    20px / 1.3  / weight 600     /* Sub-section, team name */
--text-lg:    18px / 1.4  / weight 500     /* Emphasized data, stat number */
--text-base:  15px / 1.5  / weight 400     /* Body, list items */
--text-sm:    13px / 1.4  / weight 400     /* Labels, meta */
--text-xs:    11px / 1.3  / weight 500     /* Tags, pill text, captions */

/* ─── LETTER SPACING ─────────────────────────────── */
--tracking-tight:  -0.02em   /* Large headings */
--tracking-normal:  0em      /* Body */
--tracking-wide:    0.04em   /* Pill labels, badges */
```

### Type Usage Rules
- **Page titles**: 32px, weight 700, tracking -0.02em, color `text-primary`
- **Card headings**: 16–18px, weight 600, color `text-primary`
- **Stat numbers**: 24px, weight 700, color `text-primary` on light; `text-inverse` on dark
- **Labels / captions**: 12–13px, weight 400–500, color `text-secondary`
- **Pill / tag text**: 11–12px, weight 500, tracking 0.02em
- **Navigation items**: 14px, weight 500, color `text-secondary` inactive; `text-inverse` active

---

## 4. Liquid Glass Effect (Core Visual Identity)

The glass effect is the signature material of this design system. It is used for:
- The outermost app shell / viewport wrapper
- Floating panels, modals, tooltips
- Extension popup container
- Hero section background on landing page

```css
/* ─── LIQUID GLASS BASE ──────────────────────────── */
.glass {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 28px;
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.06),
    0 2px 0 rgba(255, 255, 255, 0.70) inset,
    0 -1px 0 rgba(0, 0, 0, 0.05) inset;
}

/* ─── GLASS DARK VARIANT ─────────────────────────── */
.glass-dark {
  background: rgba(13, 13, 13, 0.72);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.28),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
}

/* ─── GLASS CARD ─────────────────────────────────── */
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.60);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
}
```

### Glass Hierarchy
```
Layer 0: Page background (#F0F0F0) — solid matte
Layer 1: .glass wrapper — translucent white shell, 20px blur
Layer 2: .glass-card — white cards, 85% opacity, 12px blur
Layer 3: .glass-dark — black panels, 72% opacity
```

---

## 5. Border Radius Scale

```css
--radius-xs:   6px    /* Small tags, tiny badges */
--radius-sm:   10px   /* Input fields, small buttons */
--radius-md:   14px   /* Standard buttons, list items */
--radius-lg:   20px   /* Cards, panels */
--radius-xl:   24px   /* Large cards, dark panels */
--radius-2xl:  28px   /* App shell / glass wrapper */
--radius-pill: 9999px /* Pills, toggle chips */
```

---

## 6. Spacing System

8px grid. All spacing values are multiples of 4px.

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
```

---

## 7. Component Library

### 7.1 Navigation Sidebar

```
Width: 200px (desktop) / 64px (collapsed)
Background: white (#FFFFFF) or glass-card
Border-right: 1px solid var(--color-border-light)
Border-radius (outer): 20px (when inside glass shell)
Padding: 24px 16px
```

**Anatomy:**
```
┌──────────────────────┐
│  [Logo]  BrandName   │  ← 24px padding, logo 32×32
│                      │
│  [icon]  Home        │  ← inactive: icon #888, text #888
│  [icon]  Schedule    │
│ ████████████████████ │  ← active pill: bg #111, icon+text white
│ [icon]  Projects     │    border-radius: pill, padding: 10px 16px
│  [icon]  Projects    │
│  [icon]  Projects    │
│  [icon]  Projects    │
│  [icon]  Settings    │
│                      │
│  [avatar] Name       │  ← bottom section, font-size 13px
│          ⚙           │
└──────────────────────┘
```

**CSS Tokens:**
```css
.nav-item           { padding: 10px 16px; border-radius: var(--radius-pill); }
.nav-item--active   { background: #111111; color: #FFFFFF; }
.nav-item--inactive { color: #888888; }
.nav-item:hover     { background: var(--color-surface-03); }
```

---

### 7.2 Top Navigation Bar

```
Height: 60px
Background: transparent (glass shell shows through)
Items: Video call pill | Time + Weather pill | Search bar | Notifications | Messages
```

**Pill Items (Video call, Time/Weather):**
```css
.topnav-pill {
  background: var(--color-surface-01);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  box-shadow: var(--shadow-xs);
}
```

**Search Bar:**
```css
.search-bar {
  background: var(--color-surface-01);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  padding: 10px 18px;
  width: 240px;
  font-size: 14px;
  color: var(--color-text-tertiary);
  box-shadow: var(--shadow-xs);
}
```

**Icon Buttons (Notification, Messages):**
```css
.icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-dark-00);
  color: var(--color-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn .badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: white;
  color: #111;
  border-radius: pill;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border: 1px solid #EBEBEB;
}
```

---

### 7.3 Cards (Light Variant)

Primary content containers.

```css
.card {
  background: var(--color-surface-01);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);       /* 20px */
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}
```

---

### 7.4 Cards (Dark Variant)

Used for media preview, team overview, high-emphasis data zones.

```css
.card-dark {
  background: var(--color-dark-00);       /* #0D0D0D */
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--radius-xl);        /* 24px */
  padding: 24px;
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-lg);
}

.card-dark h3 {
  color: var(--color-text-inverse);
  font-size: 20px;
  font-weight: 600;
}

.card-dark p, .card-dark span {
  color: rgba(255,255,255,0.65);
  font-size: 13px;
}
```

---

### 7.5 Gantt / Timeline Bar

```
Row height: 48px
Bar height: 32px
Bar background: #111111 (filled, dark pill)
Bar border-radius: var(--radius-pill)
Avatar cluster: overlapping circles, 24px each, -8px overlap
+ Button: 28px circle, border 1.5px solid #DDDDD, bg white
Grid lines: 1px solid #F0F0F0, vertical
Row labels: 14px, weight 400, color #888888
Time labels: 12px, weight 400, color #BBBBBB
```

```css
.timeline-bar {
  height: 32px;
  background: var(--color-pill-bg);
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.avatar-cluster {
  display: flex;
  align-items: center;
}

.avatar-cluster .avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -8px;
  object-fit: cover;
}

.avatar-cluster .avatar:first-child {
  margin-left: 0;
}
```

---

### 7.6 Stat Card

```
Heading: 14px, weight 500, color text-secondary
Stat number: 28–32px, weight 700, color text-primary (or inverse on dark)
Delta chip: 12px pill, e.g. "+124" — pill bg #F2F2F2 on light, rgba white 0.12 on dark
Sparkline: 40–60px tall SVG line, stroke #111 on light, stroke white on dark
```

```css
.stat-card {
  padding: 20px 24px;
  border-radius: var(--radius-lg);
  background: var(--color-surface-01);
  border: 1px solid var(--color-border-light);
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: var(--tracking-tight);
  line-height: 1.1;
}

.stat-delta {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-tag-bg);
  color: var(--color-text-secondary);
}
```

---

### 7.7 Progress Bar

```css
.progress-track {
  height: 3px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

/* Light context */
.progress-fill {
  height: 100%;
  background: var(--color-text-primary);    /* #111111 */
  border-radius: var(--radius-pill);
  transition: width 0.4s ease;
}

/* Dark context */
.card-dark .progress-track {
  background: rgba(255, 255, 255, 0.12);
}

.card-dark .progress-fill {
  background: rgba(255, 255, 255, 0.85);
}
```

---

### 7.8 Pill / Chip

```css
/* Primary filled (active nav, labels) */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.pill--dark {
  background: var(--color-pill-bg);   /* #111111 */
  color: var(--color-pill-text);      /* #FFFFFF */
}

.pill--light {
  background: var(--color-tag-bg);    /* #F2F2F2 */
  color: var(--color-tag-text);       /* #444444 */
  border: 1px solid var(--color-border-light);
}

/* Toggle pill (Day / Week / Month / Year) */
.pill-group {
  display: flex;
  background: var(--color-surface-01);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-pill);
  padding: 3px;
  gap: 2px;
}

.pill-group .pill-option {
  padding: 5px 14px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-group .pill-option--active {
  background: var(--color-pill-bg);
  color: white;
}

.pill-group .pill-option--inactive {
  color: var(--color-text-secondary);
}
```

---

### 7.9 File List Item

```css
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--color-surface-02);
  border: 1px solid var(--color-border-light);
  margin-bottom: 8px;
  transition: background 0.15s;
  cursor: pointer;
}

.file-item:hover {
  background: var(--color-surface-03);
}

.file-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

/* Icon backgrounds by file type */
.file-icon--pdf   { background: #FFEAEA; color: #CC2200; }
.file-icon--fig   { background: #F0EEFF; color: #7B61FF; }
.file-icon--word  { background: #EAF1FF; color: #1155CC; }

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

> **Note:** File icon bg colors are the only chromatic accents in the entire system and are used sparingly, only for file-type identification.

---

### 7.10 Avatar

```css
.avatar {
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

/* Sizes */
.avatar--xs { width: 20px; height: 20px; }
.avatar--sm { width: 28px; height: 28px; }
.avatar--md { width: 36px; height: 36px; }
.avatar--lg { width: 48px; height: 48px; }
.avatar--xl { width: 64px; height: 64px; }
```

---

### 7.11 Sparkline / Mini Chart

Rendered as an inline SVG. Always uses:
- **On light surface:** stroke `#111111`, no fill
- **On dark surface:** stroke `rgba(255,255,255,0.70)`, no fill
- Stroke width: 1.5px
- No axes, no labels — raw signal only
- ViewBox proportions: approximately 80×30

---

### 7.12 Dot Legend

```css
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-text-primary);  /* #111 */
  flex-shrink: 0;
}

.legend-value {
  margin-left: auto;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
```

---

## 8. Layout System

### 8.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  GLASS SHELL (border-radius: 28px, padding: 0)              │
│  ┌────────┬────────────────────────────────────────────────┐ │
│  │        │ TOP NAV BAR (h: 60px)                          │ │
│  │ SIDE   ├──────────┬───────────────────┬─────────────────┤ │
│  │ BAR    │ TIMELINE │ STATS CARD        │ DARK PREVIEW    │ │
│  │ 200px  │ (60%)    │ (20%)             │ CARD (20%)      │ │
│  │        ├──────────┴───────────────────┴─────────────────┤ │
│  │        │ FILE LIST (25%)  │  TEAM DARK CARD (75%)       │ │
│  └────────┴──────────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

```css
.app-shell {
  /* Glass container */
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 28px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 60px 1fr;
  min-height: 100vh;
}

.sidebar {
  grid-row: 1 / -1;
  background: white;
  border-right: 1px solid var(--color-border-light);
}

.topnav {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(8px);
}

.content-grid {
  grid-column: 2;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 280px 240px;
  grid-template-rows: auto auto;
  gap: 16px;
}
```

---

### 8.2 Responsive Breakpoints

```css
--bp-mobile:     375px   /* Extension popup, mobile web */
--bp-tablet:     768px   /* Collapsed sidebar, touch */
--bp-desktop:    1280px  /* Full dashboard */
--bp-wide:       1440px  /* Expanded layout */
```

---

## 9. Surface Map by Product

### 9.1 Dashboard
| Zone | Surface | Material |
|---|---|---|
| Page background | `#F0F0F0` | Solid matte |
| App shell wrapper | `rgba(255,255,255,0.18)` | Liquid glass |
| Sidebar | `#FFFFFF` | Matte white |
| Light cards | `#FFFFFF` + `shadow-sm` | Elevated white |
| Dark cards | `#0D0D0D` | Matte black |
| Dark panels | `rgba(13,13,13,0.85)` | Glass dark |
| Timeline bars | `#111111` | Filled pill |

---

### 9.2 Landing Page

```
Section layout:
┌─────────────────────────────────────────────────┐
│ HERO (full viewport)                             │
│  Background: #F0F0F0 matte                       │
│  Floating glass card showing dashboard preview  │
│  Headline: 56px / 700 / tracking -0.03em        │
│  CTA: Dark pill button (bg #111, text white)     │
├─────────────────────────────────────────────────┤
│ FEATURES (3 columns)                            │
│  Cards on white, icon + heading + body          │
│  No header text all-caps — use sentence case    │
├─────────────────────────────────────────────────┤
│ STAT BAR (dark bg #0D0D0D)                      │
│  3 large stat numbers, white text, sparklines   │
├─────────────────────────────────────────────────┤
│ TESTIMONIALS / SOCIAL PROOF                     │
│  Avatar + quote + name, light card              │
├─────────────────────────────────────────────────┤
│ CTA SECTION                                     │
│  Dark glass card, centered, pill button         │
├─────────────────────────────────────────────────┤
│ FOOTER                                          │
│  White, logo left, nav links right              │
└─────────────────────────────────────────────────┘
```

**Landing Hero Rules:**
- Glass card floating at slight angle (3–5deg rotate) over background
- Single page title: 56px, weight 700, letter-spacing -0.03em
- No gradient washes, no image overlays — background is the material itself
- Single CTA pill: `background: #111111`, `color: white`, `border-radius: pill`, `padding: 14px 32px`
- Secondary CTA: outlined — `border: 1.5px solid #111111`, `background: transparent`, same sizing

---

### 9.3 Browser Extension Popup

```
Popup dimensions: 380px × 560px
Background: rgba(255,255,255,0.92) with backdrop-filter: blur(16px)
Border: 1px solid rgba(255,255,255,0.50)
Border-radius: 20px (the popup chrome itself)
Shadow: var(--shadow-lg)
```

```
┌─────────────────────────────────┐  ← radius: 20px, glass effect
│ [Logo]  Product Name      [×]   │  ← 52px header
│─────────────────────────────────│
│                                 │
│  MAIN CONTENT AREA              │  ← adaptive per state
│  (compact versions of cards)    │
│                                 │
│─────────────────────────────────│
│ [action]        [primary btn]   │  ← 52px footer, border-top
└─────────────────────────────────┘
```

**Extension-specific rules:**
- Reduce all spacing by ~25% vs dashboard (space-5 becomes space-4, etc.)
- Font sizes remain the same — readability matters in small contexts
- Dark cards use same tokens but with `border-radius: 14px` instead of 24px
- Only show 3–4 critical stat metrics — no gantt, no file list
- Primary action button: full-width, dark pill (`width: 100%`)

---

### 9.4 Website (Marketing Site)

Shares all tokens with dashboard. Additional website-only rules:

```css
/* Max content width */
.container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }

/* Section vertical rhythm */
.section { padding: 96px 0; }
.section--compact { padding: 64px 0; }

/* Hero */
.hero { padding: 120px 0 80px; }
.hero-headline {
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--color-text-primary);
  max-width: 680px;
}
```

---

## 10. Motion & Transitions

**Rule:** Transitions fire on user interaction only. No ambient, looping, or scroll-triggered animation unless the animation directly reveals data (e.g. a progress bar filling on load).

```css
/* ─── DURATION SCALE ─────────────────────────────── */
--duration-instant:  80ms    /* Toggle state, checkbox */
--duration-fast:    150ms    /* Button press, hover */
--duration-base:    200ms    /* Card expand, tab switch */
--duration-slow:    350ms    /* Page transition, modal open */
--duration-enter:   400ms    /* First-load content reveal (one time only) */

/* ─── EASING ─────────────────────────────────────── */
--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1)    /* Elements entering */
--ease-in:     cubic-bezier(0.4, 0.0, 1, 1)      /* Elements leaving */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) /* Pill selection, toggle */

/* ─── STANDARD TRANSITIONS ───────────────────────── */
.interactive {
  transition:
    background-color var(--duration-fast) var(--ease-out),
    box-shadow       var(--duration-fast) var(--ease-out),
    transform        var(--duration-fast) var(--ease-out);
}
```

**Allowed motion patterns:**
- Nav item activation: background slides in over `200ms ease-spring` (layout-shift-free)
- Card hover: `transform: translateY(-2px)` + `shadow-md` over `150ms ease-out`
- Modal open: `opacity 0→1` + `scale 0.97→1.0` over `200ms ease-out`
- Progress bar fill: `width` transition over `600ms ease-out` (data entry only)
- Pill group selection: background repositions with `translate` over `200ms ease-spring`

**Prohibited:**
- Fade-and-slide-up on scroll (every section)
- Looping shimmer / skeleton pulsing (use static state with spinner)
- Parallax scrolling
- Hover scale > 1.02 on content cards

---

## 11. Iconography

- **Library:** Lucide Icons (stroke-based, 1.5px stroke width)
- **Size:** 18px default, 16px in compact / 20px in nav
- **Color:** Inherits from parent text color
- **No filled icons** — stroke only, consistent with the light, precise aesthetic
- **Navigation icons:** 20px, `color: currentColor`

---

## 12. Implementation Notes by Agent

### CSS Custom Properties Setup
All tokens must be declared in `:root` with the exact variable names from Section 2. Never hardcode hex values inline — always reference a token.

### Glass Effect Browser Support
Always include both `-webkit-backdrop-filter` and `backdrop-filter`. Provide a solid fallback:
```css
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: rgba(255, 255, 255, 0.95); }
  .glass-dark { background: rgba(13, 13, 13, 0.97); }
}
```

### Dark Card Inner Content
When placing content inside `.card-dark`, every child text element needs explicit color tokens (`--color-text-inverse` or `--color-text-inverse-2`). Never rely on cascade from parent.

### Pill Group (Toggle)
Implement the Day/Week/Month/Year switcher as a single `<div role="tablist">`. Active state should move a background element with `position: absolute` + `transform: translateX(...)` driven by JS for smooth slide — avoid re-rendering all pills.

### File Type Icons
Only file-type icons carry chromatic color. Everything else in the system is grayscale. Do not add additional color categories.

### Scrollbars
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #DDDDDD; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #BBBBBB; }
```

### Focus States
```css
:focus-visible {
  outline: 2px solid #111111;
  outline-offset: 3px;
  border-radius: inherit;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. Tailwind Config (If Using Tailwind CSS)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          '00': '#F0F0F0',
          '01': '#FFFFFF',
          '02': '#F7F7F7',
          '03': '#EEEEEE',
        },
        dark: {
          '00': '#0D0D0D',
          '01': '#1A1A1A',
          '02': '#2A2A2A',
        },
        text: {
          primary:   '#111111',
          secondary: '#888888',
          tertiary:  '#BBBBBB',
        },
        border: {
          light: '#EBEBEB',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '3xl': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        '2xl': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'xl':  ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'lg':  ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'base':['15px', { lineHeight: '1.5' }],
        'sm':  ['13px', { lineHeight: '1.4' }],
        'xs':  ['11px', { lineHeight: '1.3', fontWeight: '500' }],
      },
      borderRadius: {
        'xs':   '6px',
        'sm':   '10px',
        'md':   '14px',
        'lg':   '20px',
        'xl':   '24px',
        '2xl':  '28px',
        'pill': '9999px',
      },
      boxShadow: {
        'xs':    '0 1px 3px rgba(0,0,0,0.04)',
        'sm':    '0 2px 8px rgba(0,0,0,0.06)',
        'md':    '0 4px 20px rgba(0,0,0,0.08)',
        'lg':    '0 8px 40px rgba(0,0,0,0.12)',
        'glass': '0 8px 32px rgba(31,38,135,0.06), 0 2px 0 rgba(255,255,255,0.60) inset, 0 -1px 0 rgba(0,0,0,0.06) inset',
      },
      backdropBlur: {
        'glass': '20px',
        'card':  '12px',
        'sm':    '8px',
      },
    }
  }
}
```

---

## 14. Quick Reference Cheat Sheet

```
SURFACES          RADIUS      SHADOW
──────────────    ─────────   ──────────────
#F0F0F0  page     pill 9999   xs  0 1px  3px rgba 4%
#FFFFFF  card     2xl  28px   sm  0 2px  8px rgba 6%
#F7F7F7  inset    xl   24px   md  0 4px 20px rgba 8%
#EEEEEE  hover    lg   20px   lg  0 8px 40px rgba12%
#0D0D0D  dark     md   14px
#1A1A1A  d-hover  sm   10px   GLASS
                  xs    6px   bg rgba(255,255,255,0.18)
TEXT                           blur 20px  saturate 180%
────────────────               border rgba(255,255,255,0.45)
#111111  primary
#888888  secondary MOTION
#BBBBBB  tertiary  ───────────────────────────
#FFFFFF  inverse   fast  150ms  ease-out
                   base  200ms  ease-out
PILLS              spring 200ms cubic(0.34,1.56,0.64,1)
────────────────   slow  350ms  ease-out
bg #111 → white
bg #F2F2F2 → #444  FONT: Inter 300/400/500/600/700
border #EBEBEB
```

---

*End of design.md — version 1.0*
*Scope: Dashboard · Website · Browser Extension · Landing Page*
*System: Liquid Glass Monochrome*