import { View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
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
        <ScreenHeader title="Meus Projetos" subtitle="Carregando..." />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Meus Projetos" subtitle="Erro ao carregar" />
        <View style={styles.centered}>
          <AppText size="base" color="secondary" style={styles.message}>
            {error}
          </AppText>
          <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.7}>
            <AppText size="base" weight="medium" color="primary">
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
        subtitle={projects.length === 0 ? 'Nenhuma obra cadastrada' : `${projects.length} obras ativas`}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {projects.length === 0 ? (
          <View style={styles.centered}>
            <AppText size="base" color="secondary" style={styles.message}>
              Você ainda não possui obras cadastradas.
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
                    {project.description ? (
                      <AppText size="sm" color="secondary" numberOfLines={1} style={styles.subtitleText}>
                        {project.description}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Nova Obra */}
        {/* TODO: open new project creation flow when implemented */}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
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
  subtitleText: {
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
