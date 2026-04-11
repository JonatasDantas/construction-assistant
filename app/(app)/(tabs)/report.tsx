import { View, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Share2, FileText, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/app-text';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { entries } from '@/data/mock-data';

const TAB_BAR_HEIGHT = 60;

function getLocalDateStr(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ReportScreen() {
  const todayStr = getLocalDateStr();
  const todayLabel = getTodayLabel();
  const todayEntries = entries.filter((e) => e.date === todayStr);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Relatório Diário"
        subtitle={todayLabel}
        action={
          // TODO: wire up share sheet when implemented
          <TouchableOpacity hitSlop={8} onPress={() => {}}>
            <Share2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Card */}
        <View style={styles.documentCard}>
          {/* Gradient Header */}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.docHeader}
          >
            <View style={styles.docHeaderTop}>
              <View style={styles.docIconWrap}>
                <FileText size={24} color={colors.textInverse} />
              </View>
              <View style={styles.docTitleWrap}>
                <AppText size="xl" weight="semibold" color="inverse" style={styles.docTitle}>
                  Diário de Obras
                </AppText>
                <AppText size="sm" color="inverse" style={styles.docProject}>
                  Edifício Residencial Parque das Flores
                </AppText>
              </View>
            </View>
            <AppText size="sm" color="inverse" style={styles.docDate}>
              Data: {todayLabel}
            </AppText>
          </LinearGradient>

          {/* Document Content */}
          <View style={styles.docContent}>
            {todayEntries.map((entry, index) => (
              <View key={entry.id}>
                {index > 0 && <View style={styles.entrySeparator} />}

                {/* Entry Header: numbered circle + service + category */}
                <View style={styles.entryHeader}>
                  <View style={styles.entryNumber}>
                    <AppText size="sm" weight="medium" style={styles.entryNumberText}>
                      {index + 1}
                    </AppText>
                  </View>
                  <View style={styles.entryMeta}>
                    <AppText size="base" weight="semibold">{entry.service}</AppText>
                    <AppText size="sm" color="secondary">{entry.category}</AppText>
                  </View>
                </View>

                {/* Photo */}
                <Image
                  source={{ uri: entry.photo }}
                  style={styles.entryPhoto}
                  resizeMode="cover"
                  alt={entry.service}
                />

                {/* Description */}
                <View style={styles.descSection}>
                  <AppText size="sm" weight="medium" style={styles.descLabel}>
                    Descrição:
                  </AppText>
                  <AppText size="sm" style={styles.descText}>
                    {entry.description}
                  </AppText>
                </View>

                {/* Details: 2-column grid */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <AppText size="xs" color="secondary">Equipe</AppText>
                    <AppText size="base" weight="medium">{entry.teamSize} pessoas</AppText>
                  </View>
                  <View style={styles.detailBox}>
                    <AppText size="xs" color="secondary">Duração</AppText>
                    <AppText size="base" weight="medium">{entry.duration}</AppText>
                  </View>
                </View>
              </View>
            ))}

            {/* Footer */}
            <View style={styles.docFooter}>
              <AppText size="sm" color="secondary" style={styles.footerText}>
                Relatório gerado automaticamente pelo Diário de Obras Inteligente
              </AppText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {/* TODO: wire up share sheet when implemented */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonOutline]}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Share2 size={16} color={colors.textPrimary} />
            <AppText size="base" weight="medium">Compartilhar</AppText>
          </TouchableOpacity>
          {/* TODO: wire up PDF generation when implemented */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Download size={16} color={colors.textInverse} />
            <AppText size="base" weight="medium" color="inverse">Gerar PDF</AppText>
          </TouchableOpacity>
        </View>
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
    paddingBottom: TAB_BAR_HEIGHT + spacing[4],
    gap: spacing[6],
  },
  // Document card — plain View (not Card component) to allow overflow:hidden with gradient
  documentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...(shadows.sm as object),
  },
  // Gradient header
  docHeader: {
    padding: spacing[6],
  },
  docHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  docIconWrap: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitleWrap: {
    flex: 1,
  },
  docTitle: {
    marginBottom: spacing[1],
  },
  docProject: {
    opacity: 0.8,
  },
  docDate: {
    opacity: 0.8,
  },
  // Document content
  docContent: {
    padding: spacing[6],
  },
  // Separator between entries (shown before every entry except the first)
  entrySeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[8],
  },
  // Entry header row
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  entryNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryNumberText: {
    color: colors.primary,
  },
  entryMeta: {
    flex: 1,
  },
  // Entry photo — fixed height (matches web h-48 = 192px)
  entryPhoto: {
    width: '100%',
    height: 192,
    borderRadius: radius.md,
    marginBottom: spacing[4],
  },
  // Description section
  descSection: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  descLabel: {
    color: colors.textPrimary,
  },
  descText: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Details 2-column grid
  detailsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  detailBox: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing[3],
    gap: spacing[1],
  },
  // Document footer
  docFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[6],
    marginTop: spacing[8],
  },
  footerText: {
    textAlign: 'center',
  },
  // Action buttons row
  actionsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
  },
  actionButtonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
});
