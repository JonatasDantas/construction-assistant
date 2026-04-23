import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Share2, FileText, Download, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const todayLabel = getTodayLabel();

  const [status, setStatus] = useState<Status>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  async function handleGeneratePdf() {
    if (!activeProject) {
      Alert.alert('Nenhum projeto ativo', 'Selecione um projeto antes de gerar o relatório.');
      return;
    }
    setStatus('generating');
    try {
      const result = await generateReport(activeProject.id);
      setPdfUrl(result.pdfUrl);
      setStatus('preview');
    } catch (err) {
      setStatus('idle');
      Alert.alert(
        'Erro ao gerar relatório',
        err instanceof Error ? err.message : 'Tente novamente.',
      );
    }
  }

  async function handleOpenPdf() {
    if (pdfUrl) {
      await WebBrowser.openBrowserAsync(pdfUrl);
    }
  }

  async function handleShare() {
    if (!pdfUrl) return;
    try {
      await Share.share({ url: pdfUrl, title: 'Relatório de Obras' });
    } catch {
      // user dismissed share sheet — no-op
    }
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Relatório Diário"
        subtitle={todayLabel}
        action={
          <TouchableOpacity hitSlop={8} onPress={handleShare} disabled={!pdfUrl}>
            <Share2 size={20} color={pdfUrl ? colors.textSecondary : colors.textMuted} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Document Card */}
        <View style={styles.documentCard}>
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

          <View style={styles.docContent}>
            {status === 'generating' ? (
              <View style={styles.statusBox}>
                <ActivityIndicator color={colors.primary} size="large" />
                <AppText size="sm" color="secondary" style={styles.statusText}>
                  Gerando relatório...
                </AppText>
              </View>
            ) : status === 'preview' ? (
              <View style={styles.statusBox}>
                <AppText size="base" weight="semibold" style={styles.successText}>
                  Relatório gerado com sucesso!
                </AppText>
                <AppText size="sm" color="secondary" style={styles.statusText}>
                  Use os botões abaixo para abrir ou compartilhar o PDF.
                </AppText>
              </View>
            ) : (
              <View style={styles.statusBox}>
                <AppText size="sm" color="secondary" style={styles.statusText}>
                  {activeProject
                    ? 'Toque em "Gerar PDF" para criar o relatório do projeto.'
                    : 'Selecione um projeto na aba Projetos para gerar o relatório.'}
                </AppText>
              </View>
            )}

            <View style={styles.docFooter}>
              <AppText size="sm" color="secondary" style={styles.footerText}>
                Relatório gerado automaticamente pelo Diário de Obras Inteligente
              </AppText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonOutline,
              !pdfUrl && styles.actionButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleShare}
            disabled={!pdfUrl}
          >
            <Share2 size={16} color={pdfUrl ? colors.textPrimary : colors.textMuted} />
            <AppText size="base" weight="medium" color={pdfUrl ? 'primary' : 'muted'}>
              Compartilhar
            </AppText>
          </TouchableOpacity>

          {status === 'preview' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              activeOpacity={0.8}
              onPress={handleOpenPdf}
            >
              <ExternalLink size={16} color={colors.textInverse} />
              <AppText size="base" weight="medium" color="inverse">
                Abrir PDF
              </AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonPrimary,
                (status === 'generating' || !activeProject) && styles.actionButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleGeneratePdf}
              disabled={status === 'generating' || !activeProject}
            >
              {status === 'generating' ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Download size={16} color={colors.textInverse} />
              )}
              <AppText size="base" weight="medium" color="inverse">
                Gerar PDF
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
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
  statusBox: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  statusText: {
    textAlign: 'center',
    maxWidth: 280,
  },
  successText: {
    color: colors.success,
    textAlign: 'center',
  },
  docFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[4],
    marginTop: spacing[2],
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
    opacity: 0.4,
  },
});
