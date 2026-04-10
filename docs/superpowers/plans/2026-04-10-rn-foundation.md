# React Native Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the design system, base components, and navigation structure that enables screen-by-screen migration from the Figma web design into the existing Expo app.

**Architecture:** Expo Router v6 with route groups — `(onboarding)` for the one-time Welcome screen and `(app)` for the main tab + stack flow. A root `app/index.tsx` checks `AsyncStorage` and redirects on first render. All styling via `StyleSheet` consuming tokens from `/theme`.

**Tech Stack:** React Native 0.81, Expo SDK 54, Expo Router v6, `lucide-react-native`, `expo-linear-gradient`, `@react-native-async-storage/async-storage`, `react-native-reanimated` (already installed).

---

> **Note on TDD:** This project has no test framework configured. The compile-time check for every task is `npx tsc --noEmit`. Each task ends with that check passing and a commit.

---

## File Map

### Created
| File | Responsibility |
|---|---|
| `theme/colors.ts` | All color tokens |
| `theme/typography.ts` | Font sizes, weights, line heights |
| `theme/spacing.ts` | Spacing scale + border radius |
| `theme/shadows.ts` | Platform-specific shadow tokens |
| `theme/index.ts` | Barrel export for all theme tokens |
| `data/mock-data.ts` | `Entry` and `Project` types + mock data |
| `utils/date.ts` | `formatEntryDate()` for pt-BR date labels |
| `hooks/use-onboarding.ts` | `useOnboarding()` hook + `completeOnboarding()` util |
| `components/app-text.tsx` | Typed `<Text>` wrapper |
| `components/button.tsx` | Primary/secondary/ghost/destructive buttons |
| `components/card.tsx` | White surface container |
| `components/app-container.tsx` | Screen wrapper with `SafeAreaView` + scroll |
| `components/screen-header.tsx` | Sticky top bar (back / project selector / action variants) |
| `components/text-input.tsx` | Styled input field |
| `components/stats-card.tsx` | Blue gradient summary card |
| `components/bottom-nav-tab.tsx` | Custom tab bar button |
| `app/index.tsx` | Onboarding redirect entry point |
| `app/_layout.tsx` | Root stack (replaces boilerplate) |
| `app/(onboarding)/_layout.tsx` | Onboarding stack |
| `app/(onboarding)/welcome.tsx` | Welcome screen placeholder |
| `app/(app)/_layout.tsx` | Main app stack |
| `app/(app)/(tabs)/_layout.tsx` | 3-tab bar |
| `app/(app)/(tabs)/index.tsx` | Home placeholder |
| `app/(app)/(tabs)/report.tsx` | ReportPreview placeholder |
| `app/(app)/(tabs)/projects.tsx` | ProjectSelection placeholder |
| `app/(app)/voice-input.tsx` | VoiceInput placeholder |
| `app/(app)/add-photos.tsx` | AddPhotos placeholder |

### Modified
| File | Change |
|---|---|
| `constants/theme.ts` | Replace entirely — re-exports from `@/theme` |

### Deleted
| File | Reason |
|---|---|
| `app/(tabs)/` (entire dir) | Replaced by `app/(app)/(tabs)/` |
| `app/modal.tsx` | Unused boilerplate |
| `components/hello-wave.tsx` | Boilerplate |
| `components/parallax-scroll-view.tsx` | Boilerplate |
| `components/external-link.tsx` | Boilerplate |
| `components/themed-text.tsx` | Replaced by `app-text.tsx` |
| `components/themed-view.tsx` | Replaced by `app-container.tsx` |
| `components/haptic-tab.tsx` | Replaced by `bottom-nav-tab.tsx` |
| `components/ui/icon-symbol.tsx` | Boilerplate (lucide-react-native used instead) |
| `components/ui/icon-symbol.ios.tsx` | Boilerplate |
| `components/ui/collapsible.tsx` | Boilerplate |

---

## Task 1: Install dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Install new packages**

```bash
cd construction-assistant
npx expo install lucide-react-native react-native-svg expo-linear-gradient @react-native-async-storage/async-storage
```

`react-native-svg` is a peer dependency of `lucide-react-native`. `expo install` pins versions compatible with the current Expo SDK.

- [ ] **Step 2: Verify install succeeded**

```bash
node -e "require('./node_modules/lucide-react-native'); console.log('ok')"
node -e "require('./node_modules/expo-linear-gradient'); console.log('ok')"
node -e "require('./node_modules/@react-native-async-storage/async-storage'); console.log('ok')"
```

Expected: three lines of `ok`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install lucide-react-native, expo-linear-gradient, async-storage"
```

---

## Task 2: Delete boilerplate, create directories

**Files:** all listed in the Deleted section above

- [ ] **Step 1: Delete boilerplate files**

```bash
rm -rf app/\(tabs\)
rm -f app/modal.tsx
rm -f components/hello-wave.tsx
rm -f components/parallax-scroll-view.tsx
rm -f components/external-link.tsx
rm -f components/themed-text.tsx
rm -f components/themed-view.tsx
rm -f components/haptic-tab.tsx
rm -f "components/ui/icon-symbol.tsx"
rm -f "components/ui/icon-symbol.ios.tsx"
rm -f "components/ui/collapsible.tsx"
```

- [ ] **Step 2: Create new directories**

```bash
mkdir -p theme data utils hooks
mkdir -p "app/(onboarding)"
mkdir -p "app/(app)/(tabs)"
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove boilerplate, scaffold directory structure"
```

---

## Task 3: Theme — colors, typography, spacing, shadows

**Files:**
- Create: `theme/colors.ts`
- Create: `theme/typography.ts`
- Create: `theme/spacing.ts`
- Create: `theme/shadows.ts`
- Create: `theme/index.ts`

- [ ] **Step 1: Create `theme/colors.ts`**

```ts
export const colors = {
  // Brand
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',

  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceDark: '#111827',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Semantic
  destructive: '#EF4444',
  destructiveDark: '#DC2626',
  success: '#22C55E',
  warning: '#EAB308',

  // Gradient
  gradientStart: '#2563EB',
  gradientEnd: '#1D4ED8',

  // Overlays
  overlay: 'rgba(0,0,0,0.5)',
  glassDark: 'rgba(0,0,0,0.5)',
  glassLight: 'rgba(255,255,255,0.1)',
} as const;
```

- [ ] **Step 2: Create `theme/typography.ts`**

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

- [ ] **Step 3: Create `theme/spacing.ts`**

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

- [ ] **Step 4: Create `theme/shadows.ts`**

```ts
import { Platform } from 'react-native';

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: { elevation: 3 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
  }),
} as const;
```

- [ ] **Step 5: Create `theme/index.ts`**

```ts
export { colors } from './colors';
export { fontSize, fontWeight, lineHeight } from './typography';
export { spacing, radius } from './spacing';
export { shadows } from './shadows';
```

- [ ] **Step 6: Update `constants/theme.ts`** (replace entire file)

```ts
// Re-exports from /theme — import from '@/theme' in new code
export { colors as Colors } from '@/theme/colors';
export { fontSize, fontWeight, lineHeight } from '@/theme/typography';
export { spacing, radius } from '@/theme/spacing';
export { shadows } from '@/theme/shadows';
```

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add theme/ constants/theme.ts
git commit -m "feat: add design system tokens (colors, typography, spacing, shadows)"
```

---

## Task 4: Mock data

**Files:**
- Create: `data/mock-data.ts`

- [ ] **Step 1: Create `data/mock-data.ts`**

```ts
export interface Entry {
  id: string;
  date: string;
  service: string;
  photo: string;
  teamSize: number;
  duration: string;
  description: string;
  category: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  color: string;
}

export const projects: Project[] = [
  {
    id: '1',
    name: 'Edifício Residencial Parque das Flores',
    location: 'São Paulo, SP',
    color: '#2563EB',
  },
  {
    id: '2',
    name: 'Centro Comercial Boa Vista',
    location: 'Rio de Janeiro, RJ',
    color: '#22C55E',
  },
  {
    id: '3',
    name: 'Galpão Industrial Zona Sul',
    location: 'Curitiba, PR',
    color: '#A855F7',
  },
];

export const entries: Entry[] = [
  {
    id: '1',
    date: '2026-04-10',
    service: 'Concretagem',
    photo: 'https://images.unsplash.com/photo-1773432114391-f85c1674b233?w=800',
    teamSize: 8,
    duration: '4h',
    description:
      'Concretagem da laje do 3º pavimento finalizada conforme cronograma. Equipe de 8 funcionários trabalhou durante 4 horas.',
    category: 'Estrutura',
  },
  {
    id: '2',
    date: '2026-04-10',
    service: 'Alvenaria',
    photo: 'https://images.unsplash.com/photo-1628847115161-d6793dc59c7f?w=800',
    teamSize: 5,
    duration: '6h',
    description:
      'Execução de alvenaria interna no 2º pavimento. Avanço de aproximadamente 40m² de parede.',
    category: 'Vedação',
  },
  {
    id: '3',
    date: '2026-04-09',
    service: 'Estrutura Metálica',
    photo: 'https://images.unsplash.com/photo-1655936072893-921e69ae9038?w=800',
    teamSize: 6,
    duration: '5h',
    description:
      'Montagem de estrutura metálica do mezanino. Instalação de vigas e pilares conforme projeto estrutural.',
    category: 'Estrutura',
  },
  {
    id: '4',
    date: '2026-04-09',
    service: 'Fundação',
    photo: 'https://images.unsplash.com/photo-1603080296081-81f47189df91?w=800',
    teamSize: 4,
    duration: '3h',
    description: 'Escavação para fundação dos blocos B1 a B4. Profundidade atingida conforme projeto.',
    category: 'Fundação',
  },
  {
    id: '5',
    date: '2026-04-08',
    service: 'Instalações Elétricas',
    photo: 'https://images.unsplash.com/photo-1650630718105-497674381f3c?w=800',
    teamSize: 3,
    duration: '7h',
    description: 'Instalação de eletrodutos e caixas no 1º pavimento. Passagem de cabos iniciada.',
    category: 'Instalações',
  },
];
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add data/
git commit -m "feat: add typed mock data (Entry, Project)"
```

---

## Task 5: Utilities

**Files:**
- Create: `utils/date.ts`

- [ ] **Step 1: Create `utils/date.ts`**

```ts
/**
 * Returns a human-readable date label in pt-BR.
 * "Hoje" / "Ontem" / "8 de abril"
 */
export function formatEntryDate(dateString: string, today: string, yesterday: string): string {
  if (dateString === today) return 'Hoje';
  if (dateString === yesterday) return 'Ontem';
  return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Returns today and yesterday as YYYY-MM-DD strings.
 */
export function getTodayAndYesterday(): { today: string; yesterday: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return { today: fmt(now), yesterday: fmt(yesterday) };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add utils/
git commit -m "feat: add date formatting utilities (pt-BR)"
```

---

## Task 6: Onboarding hook

**Files:**
- Create: `hooks/use-onboarding.ts`

- [ ] **Step 1: Create `hooks/use-onboarding.ts`**

```ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_complete';

/**
 * Reads the onboarding flag from AsyncStorage.
 * Returns `{ isReady, hasCompleted }`.
 * `isReady` is false while the async read is in flight.
 */
export function useOnboarding() {
  const [isReady, setIsReady] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setHasCompleted(value === 'true');
      setIsReady(true);
    });
  }, []);

  return { isReady, hasCompleted };
}

/**
 * Marks onboarding as complete. Call this from the Welcome screen
 * before navigating to the main app.
 */
export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-onboarding.ts
git commit -m "feat: add useOnboarding hook and completeOnboarding utility"
```

---

## Task 7: Component — AppText

**Files:**
- Create: `components/app-text.tsx`

- [ ] **Step 1: Create `components/app-text.tsx`**

```tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors } from '@/theme/colors';
import { fontSize, fontWeight } from '@/theme/typography';

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand';

const colorMap: Record<TextColor, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  inverse: colors.textInverse,
  brand: colors.primary,
};

interface AppTextProps extends TextProps {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
}

export function AppText({
  size = 'base',
  weight = 'normal',
  color = 'primary',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: fontSize[size],
          fontWeight: fontWeight[weight],
          color: colorMap[color],
        },
        style,
      ]}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/app-text.tsx
git commit -m "feat: add AppText component"
```

---

## Task 8: Component — Button

**Files:**
- Create: `components/button.tsx`

- [ ] **Step 1: Create `components/button.tsx`**

```tsx
import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children: string;
}

const variantStyles: Record<
  ButtonVariant,
  { bg: string; textColor: 'inverse' | 'primary' | 'brand' }
> = {
  primary: { bg: colors.primary, textColor: 'inverse' },
  secondary: { bg: '#F3F4F6', textColor: 'primary' },
  ghost: { bg: colors.glassLight, textColor: 'inverse' },
  destructive: { bg: colors.destructive, textColor: 'inverse' },
};

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const { bg, textColor } = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bg },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor === 'inverse' ? colors.textInverse : colors.textPrimary} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <AppText size="base" weight="medium" color={textColor}>
            {children}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/button.tsx
git commit -m "feat: add Button component (primary/secondary/ghost/destructive)"
```

---

## Task 9: Component — Card

**Files:**
- Create: `components/card.tsx`

- [ ] **Step 1: Create `components/card.tsx`**

```tsx
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius as radiusTokens } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

type ShadowSize = 'none' | 'sm' | 'md' | 'lg';
type RadiusSize = 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends ViewProps {
  shadow?: ShadowSize;
  radius?: RadiusSize;
}

export function Card({ shadow = 'sm', radius = 'lg', style, children, ...props }: CardProps) {
  const shadowStyle = shadow !== 'none' ? shadows[shadow] : undefined;

  return (
    <View
      style={[
        styles.base,
        { borderRadius: radiusTokens[radius] },
        shadowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/card.tsx
git commit -m "feat: add Card component"
```

---

## Task 10: Component — AppContainer

**Files:**
- Create: `components/app-container.tsx`

- [ ] **Step 1: Create `components/app-container.tsx`**

```tsx
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type BgType = 'background' | 'surface' | 'dark';

interface AppContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  bg?: BgType;
  contentPadding?: boolean;
}

const bgColorMap: Record<BgType, string> = {
  background: colors.background,
  surface: colors.surface,
  dark: colors.surfaceDark,
};

export function AppContainer({
  children,
  scrollable = true,
  bg = 'background',
  contentPadding = true,
}: AppContainerProps) {
  const bgColor = bgColorMap[bg];

  const inner = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        contentPadding && styles.padding,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentPadding && styles.padding]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padding: {
    paddingHorizontal: spacing[4],
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/app-container.tsx
git commit -m "feat: add AppContainer component (SafeAreaView + scroll + keyboard)"
```

---

## Task 11: Component — ScreenHeader

**Files:**
- Create: `components/screen-header.tsx`

- [ ] **Step 1: Create `components/screen-header.tsx`**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ArrowLeft } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { AppText } from './app-text';

interface ScreenHeaderProps {
  /** Back button pattern */
  onBack?: () => void;
  /** Title shown in back + title patterns */
  title?: string;
  /** Subtitle shown below title */
  subtitle?: string;
  /** Action node rendered on the right (e.g. share icon) */
  action?: React.ReactNode;
  /** Project selector pattern — renders project name + chevron */
  projectName?: string;
  onProjectPress?: () => void;
}

export function ScreenHeader({
  onBack,
  title,
  subtitle,
  action,
  projectName,
  onProjectPress,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Left: back button or project selector */}
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        {projectName !== undefined ? (
          <TouchableOpacity onPress={onProjectPress} style={styles.projectSelector}>
            <AppText size="xs" color="secondary">
              Projeto Atual
            </AppText>
            <View style={styles.projectNameRow}>
              <AppText size="base" weight="medium" numberOfLines={1} style={styles.projectName}>
                {projectName}
              </AppText>
              <ChevronDown size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ) : (
          <View>
            {title && (
              <AppText size="base" weight="semibold">
                {title}
              </AppText>
            )}
            {subtitle && (
              <AppText size="sm" color="secondary">
                {subtitle}
              </AppText>
            )}
          </View>
        )}
      </View>

      {/* Right: optional action */}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    ...shadows.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  backButton: {
    padding: spacing[1],
  },
  projectSelector: {
    flex: 1,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  projectName: {
    flex: 1,
  },
  action: {
    marginLeft: spacing[3],
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/screen-header.tsx
git commit -m "feat: add ScreenHeader component"
```

---

## Task 12: Components — TextInput, StatsCard, BottomNavTab

**Files:**
- Create: `components/text-input.tsx`
- Create: `components/stats-card.tsx`
- Create: `components/bottom-nav-tab.tsx`

- [ ] **Step 1: Create `components/text-input.tsx`**

```tsx
import React from 'react';
import { View, TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { AppText } from './app-text';

interface AppInputProps extends TextInputProps {
  label?: string;
}

export function AppInput({ label, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <AppText size="sm" weight="medium" style={styles.label}>
          {label}
        </AppText>
      )}
      <RNTextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
  },
  label: {
    marginBottom: spacing[1],
  },
  input: {
    backgroundColor: '#F3F3F5',
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
  },
});
```

- [ ] **Step 2: Create `components/stats-card.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { AppText } from './app-text';

interface StatsCardProps {
  records: number;
  hours: string;
  people: number;
}

export function StatsCard({ records, hours, people }: StatsCardProps) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TrendingUp size={20} color={colors.textInverse} />
        <AppText size="base" weight="semibold" color="inverse">
          Resumo desta semana
        </AppText>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <AppText size="2xl" weight="bold" color="inverse">
            {records}
          </AppText>
          <AppText size="xs" color="inverse" style={styles.statLabel}>
            Registros
          </AppText>
        </View>
        <View style={styles.statItem}>
          <AppText size="2xl" weight="bold" color="inverse">
            {hours}
          </AppText>
          <AppText size="xs" color="inverse" style={styles.statLabel}>
            Trabalhadas
          </AppText>
        </View>
        <View style={styles.statItem}>
          <AppText size="2xl" weight="bold" color="inverse">
            {people}
          </AppText>
          <AppText size="xs" color="inverse" style={styles.statLabel}>
            Pessoas
          </AppText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  stats: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    opacity: 0.8,
    marginTop: spacing[1],
  },
});
```

- [ ] **Step 3: Create `components/bottom-nav-tab.tsx`**

```tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BottomNavTab({
  children,
  style,
  onPress,
  onLongPress,
  accessibilityState,
}: BottomTabBarButtonProps) {
  const isActive = accessibilityState?.selected ?? false;

  return (
    <TouchableOpacity
      style={[styles.tab, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {isActive && <View style={styles.indicator} />}
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    zIndex: -1,
  },
});
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/text-input.tsx components/stats-card.tsx components/bottom-nav-tab.tsx
git commit -m "feat: add AppInput, StatsCard, and BottomNavTab components"
```

---

## Task 13: Root navigation layout + entry point

**Files:**
- Modify: `app/_layout.tsx`
- Create: `app/index.tsx`

- [ ] **Step 1: Replace `app/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
```

- [ ] **Step 2: Create `app/index.tsx`**

```tsx
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useOnboarding } from '@/hooks/use-onboarding';
import { colors } from '@/theme/colors';

export default function Index() {
  const { isReady, hasCompleted } = useOnboarding();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Redirect href={hasCompleted ? '/(app)/(tabs)/' : '/(onboarding)/welcome'} />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/index.tsx
git commit -m "feat: add root layout and onboarding redirect entry point"
```

---

## Task 14: Onboarding group

**Files:**
- Create: `app/(onboarding)/_layout.tsx`
- Create: `app/(onboarding)/welcome.tsx`

- [ ] **Step 1: Create `app/(onboarding)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create `app/(onboarding)/welcome.tsx`**

```tsx
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { completeOnboarding } from '@/hooks/use-onboarding';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(app)/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.gradientStart, '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.inner}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <FileText size={40} color={colors.textInverse} />
          </View>

          {/* Title */}
          <AppText size="3xl" weight="bold" color="inverse" style={styles.title}>
            {'Diário de Obras\nInteligente'}
          </AppText>
          <AppText size="base" color="inverse" style={styles.subtitle}>
            Registre obras usando sua voz e IA
          </AppText>

          {/* CTA */}
          <Button
            variant="secondary"
            fullWidth
            onPress={handleStart}
            style={styles.button}
          >
            Começar Agora
          </Button>

          <AppText size="xs" color="inverse" style={styles.footnote}>
            Ideal para engenheiros, mestres de obra e gestores de construção
          </AppText>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },
  gradient: {
    flex: 1,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.glassLight,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: spacing[8],
  },
  button: {
    marginBottom: spacing[4],
  },
  footnote: {
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 280,
  },
});
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(onboarding)/"
git commit -m "feat: add onboarding group layout and Welcome placeholder screen"
```

---

## Task 15: App group layout + tabs layout

**Files:**
- Create: `app/(app)/_layout.tsx`
- Create: `app/(app)/(tabs)/_layout.tsx`

- [ ] **Step 1: Create `app/(app)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="voice-input" />
      <Stack.Screen name="add-photos" />
    </Stack>
  );
}
```

- [ ] **Step 2: Create `app/(app)/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { Home, FileText, FolderOpen } from 'lucide-react-native';
import { BottomNavTab } from '@/components/bottom-nav-tab';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
        },
        tabBarButton: BottomNavTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
          tabBarLabel: ({ color }) => (
            <AppText size="xs" weight="medium" style={{ color }}>
              Início
            </AppText>
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Relatório',
          tabBarIcon: ({ color }) => <FileText size={20} color={color} />,
          tabBarLabel: ({ color }) => (
            <AppText size="xs" weight="medium" style={{ color }}>
              Relatório
            </AppText>
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projetos',
          tabBarIcon: ({ color }) => <FolderOpen size={20} color={color} />,
          tabBarLabel: ({ color }) => (
            <AppText size="xs" weight="medium" style={{ color }}>
              Projetos
            </AppText>
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/_layout.tsx" "app/(app)/(tabs)/_layout.tsx"
git commit -m "feat: add app group layout and 3-tab bar (Início/Relatório/Projetos)"
```

---

## Task 16: Screen placeholders

**Files:**
- Create: `app/(app)/(tabs)/index.tsx`
- Create: `app/(app)/(tabs)/report.tsx`
- Create: `app/(app)/(tabs)/projects.tsx`
- Create: `app/(app)/voice-input.tsx`
- Create: `app/(app)/add-photos.tsx`

- [ ] **Step 1: Create `app/(app)/(tabs)/index.tsx`** (Home placeholder)

```tsx
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { StatsCard } from '@/components/stats-card';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader
        projectName="Edifício Residencial Parque das Flores"
        onProjectPress={() => router.push('/(app)/(tabs)/projects')}
      />
      <AppContainer contentPadding>
        <StatsCard records={12} hours="48h" people={32} />
        <AppText size="sm" color="secondary" style={styles.placeholder}>
          Registros aparecerão aqui — tela em migração.
        </AppText>
      </AppContainer>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(app)/voice-input')}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: spacing[8],
  },
  fab: {
    position: 'absolute',
    bottom: 88,
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
```

- [ ] **Step 2: Create `app/(app)/(tabs)/report.tsx`** (ReportPreview placeholder)

```tsx
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ReportScreen() {
  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Relatório Diário"
        subtitle="10 de abril de 2026"
        action={
          <TouchableOpacity hitSlop={8}>
            <Share2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />
      <AppContainer contentPadding>
        <AppText size="sm" color="secondary" style={styles.placeholder}>
          Relatório aparecerá aqui — tela em migração.
        </AppText>
      </AppContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: spacing[8],
  },
});
```

- [ ] **Step 3: Create `app/(app)/(tabs)/projects.tsx`** (ProjectSelection placeholder)

```tsx
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProjectsScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Meus Projetos"
        subtitle="3 obras ativas"
      />
      <AppContainer contentPadding>
        <AppText size="sm" color="secondary" style={styles.placeholder}>
          Lista de projetos aparecerá aqui — tela em migração.
        </AppText>
      </AppContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  placeholder: {
    textAlign: 'center',
    marginTop: spacing[8],
  },
});
```

- [ ] **Step 4: Create `app/(app)/voice-input.tsx`** (VoiceInput placeholder)

```tsx
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic } from 'lucide-react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function VoiceInputScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader onBack={() => router.back()} title="Novo Registro" />
      <AppContainer scrollable={false} contentPadding>
        <View style={styles.center}>
          <View style={styles.micButton}>
            <Mic size={40} color={colors.textInverse} />
          </View>
          <AppText size="xl" weight="semibold" style={styles.title}>
            O que você fez hoje?
          </AppText>
          <AppText size="sm" color="secondary" style={styles.subtitle}>
            Tela em migração — gravação de voz será implementada aqui.
          </AppText>
        </View>
      </AppContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
```

- [ ] **Step 5: Create `app/(app)/add-photos.tsx`** (AddPhotos placeholder)

```tsx
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { AppContainer } from '@/components/app-container';
import { ScreenHeader } from '@/components/screen-header';
import { AppText } from '@/components/app-text';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

export default function AddPhotosScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader onBack={() => router.back()} title="Adicionar Fotos" />
      <AppContainer scrollable={false} contentPadding>
        <View style={styles.center}>
          <View style={styles.cameraIcon}>
            <Camera size={48} color={colors.textMuted} />
          </View>
          <AppText size="xl" weight="semibold" style={styles.title}>
            Câmera
          </AppText>
          <AppText size="sm" color="secondary" style={styles.subtitle}>
            Tela em migração — integração com expo-camera será implementada aqui.
          </AppText>
        </View>
      </AppContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  cameraIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "app/(app)/"
git commit -m "feat: add placeholder screens for all 6 routes"
```

---

## Task 17: Final verification — run the app

**Files:** none

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Start the app**

```bash
npx expo start --ios
# or
npx expo start --android
```

- [ ] **Step 3: Manual verification checklist**

- [ ] App launches — loading spinner appears briefly, then redirects to Welcome screen (first launch)
- [ ] Tap "Começar Agora" — navigates to Home screen with StatsCard visible
- [ ] Restart app — goes directly to Home (onboarding skipped)
- [ ] Tab bar shows Início / Relatório / Projetos with correct icons
- [ ] Active tab shows blue-50 indicator
- [ ] Tap Relatório tab — navigates to Report placeholder
- [ ] Tap Projetos tab — navigates to Projects placeholder
- [ ] On Home, tap FAB (+) — navigates to VoiceInput placeholder with back button
- [ ] Tap back — returns to Home
- [ ] All screens show correct header and background color

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete RN foundation — design system, components, navigation scaffold"
```
