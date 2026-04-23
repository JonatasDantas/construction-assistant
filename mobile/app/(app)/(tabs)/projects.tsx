import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Plus, RefreshCw } from 'lucide-react-native';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { useProject } from '@/context/project-context';

const PROJECT_COLORS = ['#2563EB', '#22C55E', '#A855F7', '#F59E0B', '#EF4444', '#14B8A6'];

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, loading, error, refetch, setActiveProject } = useProject();

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Meus Projetos" subtitle="" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Meus Projetos" subtitle="" />
        <View style={styles.center}>
          <AppText size="base" color="secondary" style={styles.messageText}>
            {error}
          </AppText>
          <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.8}>
            <RefreshCw size={16} color={colors.textInverse} />
            <AppText size="sm" weight="medium" color="inverse">
              Tentar novamente
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Meus Projetos"
        subtitle={projects.length > 0 ? `${projects.length} obras ativas` : ''}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {projects.length === 0 ? (
          <View style={styles.center}>
            <FileText size={48} color={colors.textMuted} />
            <AppText size="base" color="secondary" style={styles.messageText}>
              Nenhum projeto encontrado.{'\n'}Crie sua primeira obra abaixo.
            </AppText>
          </View>
        ) : (
          projects.map((project, index) => (
            <TouchableOpacity
              key={project.id}
              activeOpacity={0.8}
              onPress={() => {
                setActiveProject(project.id);
                router.navigate('/(app)/(tabs)');
              }}
            >
              <Card shadow="sm" radius="xl">
                <View style={styles.cardContent}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: PROJECT_COLORS[index % PROJECT_COLORS.length] },
                    ]}
                  />
                  <View style={styles.projectInfo}>
                    <AppText size="base" weight="medium" numberOfLines={2}>
                      {project.name}
                    </AppText>
                    <AppText size="sm" color="secondary" numberOfLines={2} style={styles.descriptionText}>
                      {project.description}
                    </AppText>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[4],
  },
  messageText: {
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
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
  descriptionText: {
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
