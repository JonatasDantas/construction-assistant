import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ProjectProvider } from '@/context/project-context';

export default function RootLayout() {
  return (
    <ProjectProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="auto" />
    </ProjectProvider>
  );
}
