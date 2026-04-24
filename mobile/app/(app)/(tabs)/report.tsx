import { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Share2, FileText, Download, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { AppText } from '@/components/app-text';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';
import { useProject } from '@/context/project-context';
import { generateReport } from '@/utils/reports-api';

const TAB_BAR_HEIGHT = 60;

type Status = 'idle' | 'generating' | 'preview';

function getTodayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ReportScreen() {
  const { activeProject } = useProject();
  const [status, setStatus] = useState<Status>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const todayLabel = getTodayLabel();

  async function handleGeneratePdf() {
    if (!activeProject) {
      Alert.alert('Nenhum projeto ativo', 'Selecione um projeto antes de gerar o relatório.');
      return;
    }
    setStatus('generating');
    setPdfUrl(null);
    try {
      const result = await generateReport(activeProject.id);
      setPdfUrl(result.pdfUrl);
      setStatus('preview');
    } catch (err) {
      setStatus('idle');
      Alert.alert('Erro ao gerar relatório', err instanceof Error ? err.message : String(err));
    }
  }

  async function handleOpenPdf() {
    if (!pdfUrl) return;
    await WebBrowser.openBrowserAsync(pdfUrl);
  }

  async function handleShare() {
    if (!pdfUrl) return;
    try {
      await Share.share({ url: pdfUrl, title: 'Relatório de Obras' });
    } catch {
      // user dismissed share sheet — no action needed
    }
  }

  const isGenerating = status === 'generating';
  const hasPreview = status === 'preview';

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Relatório Diário"
        subtitle={todayLabel}
        action={
          <TouchableOpacity hitSlop={8} onPress={handleShare} disabled={!hasPreview}>
            <Share2 size={20} color={hasPreview ? colors.textSecondary : colors.border} />
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
                  {activeProject?.name ?? '—'}
                </AppText>
              </View>
            </View>
            <AppText size="sm" color="inverse" style={styles.docDate}>
              Data: {todayLabel}
            </AppText>
          </LinearGradient>

          {/* Document Content */}
          <View style={styles.docContent}>
            {status === 'idle' && (
              <AppText size="sm" color="secondary" style={styles.statusText}>
                Clique em &quot;Gerar PDF&quot; para criar o relatório do projeto ativo.
              </AppText>
            )}
            {status === 'generating' && (
              <View style={styles.generatingWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText size="sm" color="secondary" style={styles.statusText}>
                  Gerando relatório...
                </AppText>
              </View>
            )}
            {status === 'preview' && (
              <View style={styles.previewWrap}>
                <AppText size="sm" color="secondary" style={styles.statusText}>
                  Relatório gerado com sucesso. Use os botões abaixo para abrir ou compartilhar.
                </AppText>
              </View>
            )}

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
          {!hasPreview ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary, isGenerating && styles.actionButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleGeneratePdf}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Download size={16} color={colors.textInverse} />
              )}
              <AppText size="base" weight="medium" color="inverse">
                {isGenerating ? 'Gerando...' : 'Gerar PDF'}
              </AppText>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonOutline]}
                activeOpacity={0.8}
                onPress={handleShare}
              >
                <Share2 size={16} color={colors.textPrimary} />
                <AppText size="base" weight="medium">Compartilhar</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                activeOpacity={0.8}
                onPress={handleOpenPdf}
              >
                <ExternalLink size={16} color={colors.textInverse} />
                <AppText size="base" weight="medium" color="inverse">Abrir PDF</AppText>
              </TouchableOpacity>
            </>
          )}
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
  documentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...(shadows.sm as object),
  },
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
  docContent: {
    padding: spacing[6],
    gap: spacing[4],
  },
  statusText: {
    textAlign: 'center',
    paddingVertical: spacing[4],
  },
  generatingWrap: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
  },
  previewWrap: {
    alignItems: 'center',
  },
  docFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[6],
    marginTop: spacing[4],
  },
  footerText: {
    textAlign: 'center',
  },
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
  actionButtonDisabled: {
    opacity: 0.6,
  },
});
