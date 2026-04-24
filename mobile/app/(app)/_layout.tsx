import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="voice-input" />
      <Stack.Screen name="review-entry" />
      <Stack.Screen name="add-photos" />
    </Stack>
  );
}
