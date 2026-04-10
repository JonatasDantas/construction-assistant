# React Native Foundation Design
**Date:** 2026-04-10  
**Project:** construction-assistant (Expo)  
**Source design:** figma-design/

---

## Overview

Migrate the Figma-generated React web design into a production-ready React Native (Expo) foundation. The goal is not a blind conversion — it is to establish a clean architecture, design system, and component base that allows screen-by-screen migration.

**App:** Diário de Obras Inteligente — a construction site diary app. Engineers and site managers record daily work via voice, add photos, and generate PDF reports.

**Language:** Portuguese (pt-BR)

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Styling | `StyleSheet` | No extra deps, standard RN pattern, design is adapted not copied |
| Navigation | Expo Router v6 with route groups | Already installed, clean group separation for onboarding vs app |
| Icons | `lucide-react-native` | 1:1 mapping with web design icon names |
| Animations | `react-native-reanimated` | Already installed, UI-thread safe |
| Data | Mock data matching API shape | API-connected app; mocks are typed to the same interfaces |
| Dark mode | Not implemented | Figma design is light-only; defer dark mode |
| Onboarding | One-time, persisted via `AsyncStorage` | Show Welcome once on first launch, skip on subsequent opens |

---

## Folder Structure

```
construction-assistant/
├── app/
│   ├── _layout.tsx                  ← root: checks onboarding flag, redirects
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   └── welcome.tsx
│   └── (app)/
│       ├── _layout.tsx              ← main stack
│       ├── (tabs)/
│       │   ├── _layout.tsx          ← 3 tabs
│       │   ├── index.tsx            ← Home
│       │   ├── report.tsx           ← ReportPreview
│       │   └── projects.tsx         ← ProjectSelection
│       ├── voice-input.tsx          ← stack screen
│       └── add-photos.tsx           ← stack screen
│
├── components/
│   ├── app-container.tsx
│   ├── screen-header.tsx
│   ├── card.tsx
│   ├── button.tsx
│   ├── app-text.tsx
│   ├── text-input.tsx
│   ├── bottom-nav-tab.tsx
│   └── stats-card.tsx
│
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── shadows.ts
│
├── hooks/
│   └── use-onboarding.ts
│
├── utils/
│   └── date.ts
│
├── data/
│   └── mock-data.ts
│
└── constants/
    └── theme.ts                     ← updated to re-export from /theme
```

Files to delete from boilerplate:
- `app/(tabs)/explore.tsx`
- `components/hello-wave.tsx`
- `components/parallax-scroll-view.tsx`
- `components/external-link.tsx`
- `components/themed-text.tsx`
- `components/themed-view.tsx`

---

## Design System

### Colors (`theme/colors.ts`)

```ts
export const colors = {
  // Brand
  primary: '#2563EB',        // blue-600 — buttons, active states, badges
  primaryDark: '#1D4ED8',    // blue-700 — pressed state
  primaryLight: '#EFF6FF',   // blue-50  — badge backgrounds

  // Backgrounds
  background: '#F9FAFB',     // gray-50  — screen background
  surface: '#FFFFFF',        // white    — cards, headers
  surfaceDark: '#111827',    // gray-900 — camera screen

  // Text
  textPrimary: '#111827',    // gray-900
  textSecondary: '#6B7280',  // gray-500
  textMuted: '#9CA3AF',      // gray-400
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',         // gray-200
  borderLight: '#F3F4F6',    // gray-100

  // Semantic
  destructive: '#EF4444',    // red-500
  destructiveDark: '#DC2626',// red-600
  success: '#22C55E',        // green-500
  warning: '#EAB308',        // yellow-400 — AI badge

  // Gradient (Welcome screen + StatsCard)
  gradientStart: '#2563EB',  // blue-600
  gradientEnd: '#1D4ED8',    // blue-700

  // Overlays
  overlay: 'rgba(0,0,0,0.5)',
  glassDark: 'rgba(0,0,0,0.5)',
  glassLight: 'rgba(255,255,255,0.1)',
} as const;
```

### Typography (`theme/typography.ts`)

```ts
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;
```

### Spacing & Radius (`theme/spacing.ts`)

```ts
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
```

### Shadows (`theme/shadows.ts`)

```ts
import { Platform } from 'react-native';

export const shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 1 },
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
    android: { elevation: 3 },
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
    android: { elevation: 6 },
  }),
} as const;
```

---

## Component System

All components live in `/components/`. They consume theme tokens directly — no inline magic numbers.

### `app-text.tsx`
Typed wrapper around RN `<Text>`. Enforces the typography scale.

Props:
- `size`: `xs | sm | base | lg | xl | 2xl | 3xl` (default: `base`)
- `weight`: `normal | medium | semibold | bold` (default: `normal`)
- `color`: `primary | secondary | muted | inverse | brand` (default: `primary`)
- All standard `TextProps`

### `button.tsx`
Covers all button patterns in the design.

Props:
- `variant`: `primary | secondary | ghost | destructive` (default: `primary`)
- `icon`: optional icon element rendered left of label
- `loading`: boolean — shows activity indicator
- `fullWidth`: boolean
- All standard `TouchableOpacityProps`

### `card.tsx`
White surface container with border and optional shadow.

Props:
- `shadow`: `sm | md | lg | none` (default: `sm`)
- `radius`: `sm | md | lg | xl` (default: `lg`)
- `style`: optional extra styles

### `screen-header.tsx`
Sticky top bar. Covers three patterns from the design:
- **Back pattern:** `title` + `subtitle` + `onBack` callback
- **Project selector pattern:** `projectName` + `onProjectPress`
- **Action pattern:** `title` + `subtitle` + `action` node (e.g. share icon)

### `app-container.tsx`
Wraps every screen. Provides `SafeAreaView` + correct background + optional scroll.

Props:
- `scrollable`: boolean (default: `true`)
- `bg`: `background | surface | dark` (default: `background`)
- `contentPadding`: boolean — applies horizontal padding (default: `true`)

### `text-input.tsx`
Styled input. Gray-50 background, rounded-xl, no visible border at rest.

Props:
- `label`: string
- `multiline`: boolean
- All standard `TextInputProps`

### `stats-card.tsx`
Blue gradient summary card from Home screen.

Props:
- `records`: number
- `hours`: string (e.g. `"48h"`)
- `people`: number

### `bottom-nav-tab.tsx`
Custom tab bar button component. Blue-50 pill indicator on active tab, label in Portuguese.

---

## Navigation

### Route map

```
/(onboarding)/welcome          ← replaces to /(app)/(tabs)/ on complete
/(app)/(tabs)/index            ← Home (default tab)
/(app)/(tabs)/report           ← ReportPreview
/(app)/(tabs)/projects         ← ProjectSelection
/(app)/voice-input             ← pushed from Home FAB
/(app)/add-photos              ← pushed from VoiceInput confirm
```

### Onboarding redirect logic (`app/_layout.tsx`)

```
App opens
  ↓
AsyncStorage.getItem('onboarding_complete')
  ├── null  → <Redirect href="/(onboarding)/welcome" />
  └── 'true' → <Redirect href="/(app)/(tabs)/" />
```

No visible UI at root level — redirect fires during splash screen.

### Navigation flow

```
Welcome ──(replace)──→ Home
Home ──(push)──→ VoiceInput ──(push)──→ AddPhotos ──(popToTop)──→ Home
Home ──(tab)──→ ReportPreview
Home ──(tab)──→ ProjectSelection ──(tab back)──→ Home
```

### Tab bar

Three tabs, custom tab button component:

| Tab | Route | Icon | Label |
|---|---|---|---|
| Home | `/(app)/(tabs)/` | `Home` (lucide) | Início |
| Report | `/(app)/(tabs)/report` | `FileText` (lucide) | Relatório |
| Projects | `/(app)/(tabs)/projects` | `FolderOpen` (lucide) | Projetos |

Stack screens (`voice-input`, `add-photos`) have `headerShown: false` and manage their own top bar via `ScreenHeader`.

---

## Dependencies to Add

```bash
npx expo install lucide-react-native expo-linear-gradient @react-native-async-storage/async-storage
```

- `lucide-react-native` — icons (same names as web design)
- `expo-linear-gradient` — Welcome screen + StatsCard gradient backgrounds
- `@react-native-async-storage/async-storage` — onboarding flag persistence

`expo-camera` is NOT added at this stage — AddPhotos screen will be a placeholder until camera migration.

---

## Migration Strategy

### Translation rules (web → RN)

| Web | React Native |
|---|---|
| `div` | `View` |
| `p`, `span`, `h1`–`h4` | `<AppText size=... weight=...>` |
| `className="..."` | `StyleSheet.create({})` using theme tokens |
| `motion.div` / `motion.button` | `Animated.View` via `react-native-reanimated` |
| `img` | `expo-image` `<Image>` |
| `onClick` | `onPress` |
| `useNavigate` | `useRouter` from `expo-router` |
| `fixed bottom-0` | `position: 'absolute', bottom: 0` + `useSafeAreaInsets` |
| CSS gradient | `expo-linear-gradient` |
| scroll container | `<ScrollView>` or `<FlatList>` |

### Screen migration order

1. **Welcome** — mostly static, gradient background, no data
2. **ProjectSelection** — list of cards, simple navigation
3. **Home** — FAB, grouped timeline, FlatList optimisation
4. **ReportPreview** — read-only document view
5. **VoiceInput** — multi-stage state machine, pulse animation with Reanimated
6. **AddPhotos** — camera integration (requires `expo-camera`)

### What to reuse vs rewrite

**Reuse (logic is identical):**
- TypeScript types (`Entry`, `Project`)
- Mock data content
- `useState` / stage machine logic (e.g. VoiceInput `listening | processing | result`)
- Navigation structure and flow
- Date grouping and formatting logic

**Rewrite (web-specific):**
- All JSX → RN primitives
- Tailwind classes → `StyleSheet`
- `motion.*` animations → Reanimated
- `useNavigate` → `useRouter`
- `img` → `expo-image`

### Common pitfalls

- **`flex` defaults differ:** RN defaults to `flexDirection: 'column'`, web defaults to `row`. Always be explicit.
- **`position: fixed` doesn't exist:** Use `position: 'absolute'` inside a full-screen wrapper `View`.
- **Keyboard handling:** Wrap forms in `KeyboardAvoidingView`. Not needed on web.
- **SafeAreaView is required:** `AppContainer` handles this — do not bypass it on custom screens.
- **Reanimated runs on UI thread:** Use `useSharedValue` + `withSpring`/`withTiming`. Do not drive animations from `useState`.
- **`gap` works in RN 0.71+:** This project is on 0.81 so `gap` is safe. Prefer `rowGap`/`columnGap` for grid layouts for clarity.

---

## Out of Scope (this foundation)

- Backend API integration — mock data only
- Dark mode
- Push notifications
- PDF generation
- Camera screen (`expo-camera`) — AddPhotos gets a placeholder
- Authentication
