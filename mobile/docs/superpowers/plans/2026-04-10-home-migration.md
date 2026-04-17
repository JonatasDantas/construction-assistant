# Home Screen Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Home screen from the Figma web design into a pixel-faithful React Native implementation using mock data.

**Architecture:** The Home screen is the main tab screen at `/(app)/(tabs)/index`. It replaces the placeholder body (StatsCard + placeholder text) with a full implementation: quick-action shortcuts row, stats card, and a date-grouped entry timeline. The FAB is kept. The `AppContainer` wrapper is removed in favor of a plain `ScrollView`, matching the pattern established by the already-migrated ProjectSelection screen.

**Tech Stack:** React Native 0.81 / Expo 54, Expo Router v6, StyleSheet, `expo-linear-gradient` (via StatsCard), `lucide-react-native`, mock data from `data/mock-data.ts`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/(app)/(tabs)/index.tsx` | Modify | Replace placeholder with QuickActions row + StatsCard + date-grouped entry timeline |

---

## Key Design Decisions

**User flow context:** Welcome → ProjectSelection → Home. When the user taps a project in ProjectSelection, they navigate to Home (`router.navigate('/(app)/(tabs)/')`). Home shows the hardcoded project name in the header for now.

**QuickActions — inline, not a separate component:** Four tappable buttons in a single row. Screen-specific; follows YAGNI — no new component file.

**QuickActions — icon colors:** Same screen-specific hex pattern as Welcome feature cards. Do NOT add to `theme/colors.ts`. Inline hex strings: Gravar=#3B82F6, Foto=#22C55E, Relatório=#A855F7, Agenda=#F97316.

**QuickActions — Agenda no-op:** The Agenda action has no destination screen yet. `route: null` — tapping does nothing (no handler called). No placeholder `onPress={() => {}}` — just omit the call.

**QuickActions — "Gravar" badge:** A yellow-dot badge with a `Sparkles` icon sits top-right of the Gravar icon container. Uses `colors.warning` (#EAB308) background.

**QuickActions button style:** White surface background (`colors.surface`) with border (`colors.border`), not `Card` component — `Card` adds an extra inner border/shadow layer that's too heavy for small action buttons.

**StatsCard — hardcoded mock stats:** Stats (records=12, hours="48h", people=32) match the web design's hardcoded values. These are not derived from `entries` — backend integration will replace this later.

**Entry cards — Card component:** Use `<Card shadow="sm" radius="xl">` with content directly inside (no `padding` on Card; padding goes in the child `View`). Card's `inner` View has `overflow: 'hidden'`, which correctly clips the image.

**Entry cards — image aspect ratio:** `aspectRatio: 4/3` with `width: '100%'` on the Image style. `resizeMode="cover"`.

**Entry cards — pills:** Service pill uses `colors.primaryLight` background + `colors.primary` text. Category pill uses `colors.borderLight` background + `colors.textSecondary` text. Both use `radius.full` border radius.

**Date grouping — dynamic today/yesterday:** Computed from `new Date()` using `en-CA` locale (which returns YYYY-MM-DD) to respect the device's local timezone. Dates older than yesterday are formatted as "8 de abril" using `pt-BR` locale with `{ day: 'numeric', month: 'long' }` options.

**ScrollView paddingBottom — FAB clearance:** FAB is positioned at `bottom: TAB_BAR_HEIGHT + spacing[4]` (= 76pt from screen bottom). FAB height is 56pt. Content must have `paddingBottom` >= 76 + 56 + spacing[4] = 148pt so the last entry is never hidden behind the FAB. Use `paddingBottom: TAB_BAR_HEIGHT + spacing[4] + 56 + spacing[4]`.

**Removing AppContainer:** The existing screen used `AppContainer` (SafeAreaView + ScrollView). This is replaced by a plain `View` root + direct `ScrollView` — matching the ProjectSelection pattern. `AppContainer` was imported but is no longer needed.

---

### Task 1: Home — QuickActions + StatsCard + entry timeline

**Files:**
- Modify: `construction-assistant/app/(app)/(tabs)/index.tsx`

**Context:** Current file has `ScreenHeader` (project selector) + `AppContainer` wrapping `StatsCard` + placeholder text + a FAB. Replace the entire body with the full implementation below. Keep the `ScreenHeader` usage identical (same `projectName` prop, same `onProjectPress`). Keep the FAB identical.

- [ ] **Step 1: Replace `app/(app)/(tabs)/index.tsx`**

```tsx
import { View, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Camera, FileText, Calendar, Sparkles, Users, Clock, Plus } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { StatsCard } from '@/components/stats-card';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { entries } from '@/data/mock-data';

const TAB_BAR_HEIGHT = 60;
const FAB_SIZE = 56;
const FAB_BOTTOM = TAB_BAR_HEIGHT + spacing[4];

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Mic;
  iconBg: string;
  badge: boolean;
  route: string | null;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'voice', label: 'Gravar', icon: Mic, iconBg: '#3B82F6', badge: true, route: '/(app)/voice-input' },
  { id: 'camera', label: 'Foto', icon: Camera, iconBg: '#22C55E', badge: false, route: '/(app)/add-photos' },
  { id: 'report', label: 'Relatório', icon: FileText, iconBg: '#A855F7', badge: false, route: '/(app)/(tabs)/report' },
  { id: 'schedule', label: 'Agenda', icon: Calendar, iconBg: '#F97316', badge: false, route: null },
];

function getLocalDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
}

function formatDateLabel(dateStr: string): string {
  const today = getLocalDateStr();
  const yesterday = getLocalDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Hoje';
  if (dateStr === yesterday) return 'Ontem';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
}

type GroupedEntries = { label: string; items: typeof entries }[];

function groupEntriesByDate(entriesList: typeof entries): GroupedEntries {
  const map: Record<string, typeof entries> = {};
  for (const entry of entriesList) {
    const label = formatDateLabel(entry.date);
    if (!map[label]) map[label] = [];
    map[label].push(entry);
  }
  return Object.entries(map).map(([label, items]) => ({ label, items }));
}

export default function HomeScreen() {
  const router = useRouter();
  const grouped = groupEntriesByDate(entries);

  return (
    <View style={styles.root}>
      <ScreenHeader
        projectName="Edifício Residencial Parque das Flores"
        onProjectPress={() => router.push('/(app)/(tabs)/projects')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                activeOpacity={0.7}
                onPress={action.route ? () => router.push(action.route as string) : undefined}
              >
                <View style={styles.quickActionIconWrap}>
                  <View style={[styles.quickActionIconBg, { backgroundColor: action.iconBg }]}>
                    <Icon size={24} color={colors.textInverse} />
                  </View>
                  {action.badge && (
                    <View style={styles.quickActionBadge}>
                      <Sparkles size={10} color={colors.textInverse} />
                    </View>
                  )}
                </View>
                <AppText size="xs" weight="medium">
                  {action.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats */}
        <StatsCard records={12} hours="48h" people={32} />

        {/* Timeline */}
        {grouped.map(({ label, items }) => (
          <View key={label} style={styles.dateGroup}>
            <AppText size="sm" weight="medium" color="secondary" style={styles.dateLabel}>
              {label}
            </AppText>
            <View style={styles.entryList}>
              {items.map((entry) => (
                <Card key={entry.id} shadow="sm" radius="xl">
                  <Image
                    source={{ uri: entry.photo }}
                    style={styles.entryImage}
                    resizeMode="cover"
                  />
                  <View style={styles.entryContent}>
                    <View style={styles.pillRow}>
                      <View style={styles.servicePill}>
                        <AppText size="sm" weight="medium" style={styles.servicePillText}>
                          {entry.service}
                        </AppText>
                      </View>
                      <View style={styles.categoryPill}>
                        <AppText size="xs" color="secondary">
                          {entry.category}
                        </AppText>
                      </View>
                    </View>
                    <AppText size="sm" style={styles.entryDesc}>
                      {entry.description}
                    </AppText>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Users size={14} color={colors.textMuted} />
                        <AppText size="xs" color="secondary">{entry.teamSize} pessoas</AppText>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={14} color={colors.textMuted} />
                        <AppText size="xs" color="secondary">{entry.duration}</AppText>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

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
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: FAB_BOTTOM + FAB_SIZE + spacing[4],
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIconWrap: {
    position: 'relative',
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Date groups
  dateGroup: {
    marginBottom: spacing[8],
    gap: spacing[3],
  },
  dateLabel: {},
  entryList: {
    gap: spacing[4],
  },
  // Entry card
  entryImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  entryContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  servicePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
  },
  servicePillText: {
    color: colors.primary,
  },
  categoryPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
  },
  entryDesc: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: FAB_BOTTOM,
    right: spacing[6],
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd construction-assistant && npx tsc --noEmit
```

Expected: zero errors. Common gotchas:
- If TS complains about `action.route as string` cast, change it to a non-null assertion: `action.route!`.
- If TS complains about `typeof Mic` as the icon interface type, replace `icon: typeof Mic` in `QuickAction` with `icon: React.ComponentType<{ size: number; color: string }>`.

- [ ] **Step 3: Commit**

```bash
cd construction-assistant && git add "app/(app)/(tabs)/index.tsx" && git commit -m "feat: home screen — quick actions, stats, and date-grouped entry timeline"
```
