import { View, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Camera, FileText, Calendar, Sparkles, Users, Clock, Plus, RefreshCw } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { StatsCard } from '@/components/stats-card';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { Entry } from '@/data/mock-data';
import { useProject } from '@/context/project-context';
import { useEntries } from '@/hooks/use-entries';

const FAB_SIZE = 56;

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
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

type GroupedEntries = { label: string; items: Entry[] }[];

function groupEntriesByDate(entriesList: Entry[]): GroupedEntries {
  const map: Record<string, Entry[]> = {};
  for (const entry of entriesList) {
    if (!map[entry.date]) map[entry.date] = [];
    map[entry.date].push(entry);
  }
  return Object.entries(map).map(([date, items]) => ({
    label: formatDateLabel(date),
    items,
  }));
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProject } = useProject();
  const { entries, loading, error, refetch } = useEntries(activeProject?.id ?? null);
  const tabBarHeight = 60 + insets.bottom;
  const fabBottom = tabBarHeight + spacing[4];
  const grouped = groupEntriesByDate(entries);

  const totalPeople = entries.reduce((sum, e) => sum + e.teamSize, 0);

  return (
    <View style={styles.root}>
      <ScreenHeader
        projectName={activeProject?.name}
        onProjectPress={() => router.push('/(app)/(tabs)/projects')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: fabBottom + FAB_SIZE + spacing[4] }]}
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
                disabled={!action.route}
                onPress={action.route ? () => router.push(action.route as Href) : undefined}
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
        <StatsCard records={entries.length} hours="—" people={totalPeople} />

        {/* Loading */}
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.centered}>
            <AppText size="sm" color="secondary" style={styles.messageText}>
              {error}
            </AppText>
            <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.7}>
              <RefreshCw size={16} color={colors.primary} />
              <AppText size="sm" weight="medium" style={styles.retryText}>
                Tentar novamente
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && entries.length === 0 && (
          <View style={styles.centered}>
            <AppText size="sm" color="secondary" style={styles.messageText}>
              Nenhum registro encontrado para este projeto.
            </AppText>
            <AppText size="xs" color="secondary" style={styles.messageText}>
              Use o botão de microfone para adicionar o primeiro registro.
            </AppText>
          </View>
        )}

        {/* Timeline */}
        {!loading && !error && grouped.map(({ label, items }) => (
          <View key={label} style={styles.dateGroup}>
            <AppText size="sm" weight="medium" color="secondary">
              {label}
            </AppText>
            <View style={styles.entryList}>
              {items.map((entry) => (
                <Card key={entry.id} shadow="sm" radius="xl">
                  {!!entry.photo && (
                    <Image
                      source={{ uri: entry.photo }}
                      style={styles.entryImage}
                      resizeMode="cover"
                      alt={entry.description}
                    />
                  )}
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
                      {!!entry.duration && (
                        <View style={styles.metaItem}>
                          <Clock size={14} color={colors.textMuted} />
                          <AppText size="xs" color="secondary">{entry.duration}</AppText>
                        </View>
                      )}
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
        style={[styles.fab, { bottom: fabBottom }]}
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
  // Feedback states
  centered: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  messageText: {
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: {
    color: colors.primary,
  },
  // Date groups
  dateGroup: {
    marginBottom: spacing[8],
    gap: spacing[3],
  },
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
