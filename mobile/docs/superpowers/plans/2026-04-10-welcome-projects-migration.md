# Welcome + ProjectSelection Screen Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Welcome and ProjectSelection screens from the Figma web design into pixel-faithful React Native implementations using mock data.

**Architecture:** Both screens already exist as wired Expo Router routes. Welcome lives at `/(onboarding)/welcome` (one-time, replaces to Home tab on completion); ProjectSelection at `/(app)/(tabs)/projects` (permanent tab screen). Each task replaces the existing file body with a full implementation that matches the web design, translated to RN primitives and the existing design system — no new components, no new theme tokens.

**Tech Stack:** React Native 0.81 / Expo 54, Expo Router v6, StyleSheet, `expo-linear-gradient`, `lucide-react-native`, mock data from `data/mock-data.ts`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/(onboarding)/welcome.tsx` | Modify | Add 4-card feature grid + "Saiba mais" link; wrap scroll for small screens |
| `app/(app)/(tabs)/projects.tsx` | Modify | Replace placeholder with scrollable project card list + "Nova Obra" dashed button |

These two tasks are independent and can be executed sequentially in either order.

---

## Key Design Decisions

**Welcome — feature card colors:** The web design uses Tailwind one-offs (`bg-blue-500`, `bg-purple-500`, `bg-green-500`, `bg-orange-500`). These are screen-specific decorative colors. Do NOT add them to `theme/colors.ts`. Use inline hex strings.

**Welcome — small-screen overflow:** The feature grid + all content exceeds iPhone SE height (~589pt). Wrap the inner content in a `ScrollView` with `contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}` so the content is centered on large screens and scrollable on small ones.

**ProjectSelection — Card padding:** The `Card` component applies `style` to the **outer shadow View**, not the inner bordered content View. Always put content padding on a child View **inside** `<Card>`, never on `<Card style={{padding: ...}}>`.

**ProjectSelection — "Nova Obra" dashed border:** `borderStyle: 'dashed'` renders correctly on iOS; Android rendering can vary slightly. Acceptable for this migration milestone.

**ProjectSelection — navigation on project tap:** There is no "selected project" state yet (comes with backend integration). On project tap, navigate to the Home tab with `router.navigate('/(app)/(tabs)/')`. The Home tab still shows its hardcoded project name — this is intentional for now.

---

### Task 1: Welcome — feature cards grid + scroll wrapper

**Files:**
- Modify: `construction-assistant/app/(onboarding)/welcome.tsx`

**Context:** The current file has: gradient + SafeAreaView → icon → title → subtitle → Button ("Começar Agora") → footnote. It is missing the 4-card feature grid (which in the web design appears between the subtitle and the CTA button) and the "Saiba mais" link (below the footnote). The file also uses a plain `View` for the inner layout — replace it with a `ScrollView` to handle small-screen overflow.

**Feature grid layout:** Two rows of two cards. Render as `[FEATURES.slice(0, 2), FEATURES.slice(2, 4)]` — each row is `flexDirection: 'row'` with `gap: spacing[3]`, each card is `flex: 1`. This avoids fractional percentage width calculations.

**Feature card internals:** 40×40 colored icon container (screen-specific hex, `borderRadius: radius.md`) → title (size sm, weight medium) → description (size xs, opacity 0.8). Card background: `colors.glassLight` (`rgba(255,255,255,0.1)`). Card border: `rgba(255,255,255,0.2)` (inline).

- [ ] **Step 1: Replace `app/(onboarding)/welcome.tsx`**

```tsx
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FileText, Mic, Sparkles, Camera, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { completeOnboarding } from '@/hooks/use-onboarding';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';

const FEATURES = [
  {
    icon: Mic,
    title: 'Fale o que fez',
    description: 'Grave sua voz e o sistema transcreve automaticamente',
    iconBg: '#3B82F6',
  },
  {
    icon: Sparkles,
    title: 'IA Estrutura',
    description: 'Inteligência artificial organiza e formata os dados',
    iconBg: '#A855F7',
  },
  {
    icon: Camera,
    title: 'Adicione Fotos',
    description: 'Documente visualmente cada etapa da obra',
    iconBg: '#22C55E',
  },
  {
    icon: FileText,
    title: 'Gere Relatórios',
    description: 'PDFs profissionais prontos em segundos',
    iconBg: '#F97316',
  },
] as const;

type Feature = (typeof FEATURES)[number];

const featureRows: readonly Feature[][] = [
  FEATURES.slice(0, 2),
  FEATURES.slice(2, 4),
];

export default function WelcomeScreen() {
  const router = useRouter();

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(app)/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.inner}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <View style={styles.iconContainer}>
            <FileText size={40} color={colors.textInverse} />
          </View>

          <AppText size="3xl" weight="bold" color="inverse" style={styles.title}>
            {'Diário de Obras\nInteligente'}
          </AppText>
          <AppText size="base" color="inverse" style={styles.subtitle}>
            Registre obras usando sua voz e IA
          </AppText>

          {/* Feature Cards Grid */}
          <View style={styles.grid}>
            {featureRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <View key={feature.title} style={styles.featureCard}>
                      <View style={[styles.featureIconBg, { backgroundColor: feature.iconBg }]}>
                        <Icon size={20} color={colors.textInverse} />
                      </View>
                      <AppText size="sm" weight="medium" color="inverse" style={styles.featureTitle}>
                        {feature.title}
                      </AppText>
                      <AppText size="xs" color="inverse" style={styles.featureDesc}>
                        {feature.description}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

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

          {/* Saiba mais */}
          <TouchableOpacity style={styles.infoButton} onPress={() => {}}>
            <Info size={16} color={colors.textInverse} />
            <AppText size="sm" color="inverse">Saiba mais</AppText>
          </TouchableOpacity>
        </ScrollView>
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
  scroll: {
    flex: 1,
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
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
    marginBottom: spacing[6],
  },
  grid: {
    width: '100%',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.glassLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: spacing[3],
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  featureTitle: {
    marginBottom: spacing[1],
  },
  featureDesc: {
    opacity: 0.8,
    lineHeight: 16,
  },
  button: {
    marginBottom: spacing[4],
  },
  footnote: {
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 280,
    marginBottom: spacing[2],
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    opacity: 0.8,
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd construction-assistant && npx tsc --noEmit
```

Expected: zero errors. If TS complains about `featureRows` type, change the declaration to:

```tsx
const featureRows = [FEATURES.slice(0, 2), FEATURES.slice(2, 4)];
```

- [ ] **Step 3: Commit**

```bash
cd construction-assistant && git add "app/(onboarding)/welcome.tsx" && git commit -m "feat: welcome screen — feature cards grid and saiba mais link"
```

---

### Task 2: ProjectSelection — full screen migration

**Files:**
- Modify: `construction-assistant/app/(app)/(tabs)/projects.tsx`

**Context:** Current file is a placeholder with `AppContainer` + a single grey text line. Replace it entirely with the full implementation. This is a **tab screen** (not a stack screen), so `ScreenHeader` uses the `title + subtitle` pattern (no `onBack`).

**Layout stack:**
1. `<View style={{ flex: 1, backgroundColor: colors.background }}>` (root)
2. `<ScreenHeader title="Meus Projetos" subtitle={`${projects.length} obras ativas`} />`
3. `<ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}>` — only 3 items, FlatList unnecessary
4. For each project: `<TouchableOpacity activeOpacity={0.8} onPress={...}>` wrapping `<Card shadow="sm" radius="xl">` wrapping `<View style={{ padding: spacing[4] }}>` (required — see Key Design Decisions above)
5. After the list: `<TouchableOpacity>` styled as a dashed button ("Nova Obra")

**Project card inner row:**
- 48×48 colored swatch: `<View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: project.color, flexShrink: 0 }} />`
- `project.color` is already a hex string in `data/mock-data.ts` (e.g. `'#2563EB'`)
- Right column: project name (size base, weight medium) + MapPin row (size sm, color secondary)
- The column has `flex: 1` to prevent name overflow. Name uses `numberOfLines={2}`. Location uses `numberOfLines={1}` with `flex: 1` on the text.

**Navigation on project tap:** `router.navigate('/(app)/(tabs)/')` — switches to Home tab. Placeholder behavior until backend state management is added.

- [ ] **Step 1: Replace `app/(app)/(tabs)/projects.tsx`**

```tsx
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Plus } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { projects } from '@/data/mock-data';

export default function ProjectsScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Meus Projetos"
        subtitle={`${projects.length} obras ativas`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            activeOpacity={0.8}
            onPress={() => router.navigate('/(app)/(tabs)/')}
          >
            <Card shadow="sm" radius="xl">
              <View style={styles.cardContent}>
                <View style={[styles.colorSwatch, { backgroundColor: project.color }]} />
                <View style={styles.projectInfo}>
                  <AppText size="base" weight="medium" numberOfLines={2}>
                    {project.name}
                  </AppText>
                  <View style={styles.locationRow}>
                    <MapPin size={14} color={colors.textSecondary} />
                    <AppText size="sm" color="secondary" numberOfLines={1} style={styles.locationText}>
                      {project.location}
                    </AppText>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Nova Obra */}
        <TouchableOpacity style={styles.newProjectButton} activeOpacity={0.7} onPress={() => {}}>
          <Plus size={20} color={colors.textSecondary} />
          <AppText size="base" weight="medium" color="secondary">
            Nova Obra
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    gap: spacing[3],
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  projectInfo: {
    flex: 1,
    gap: spacing[1],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  locationText: {
    flex: 1,
  },
  newProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing[4],
    backgroundColor: colors.surface,
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd construction-assistant && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd construction-assistant && git add "app/(app)/(tabs)/projects.tsx" && git commit -m "feat: project selection screen — project cards list and nova obra button"
```
