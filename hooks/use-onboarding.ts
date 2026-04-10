import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_complete';

/**
 * Reads the onboarding flag from AsyncStorage.
 * Returns { isReady, hasCompleted }.
 * isReady is false while the async read is in flight.
 */
export function useOnboarding() {
  const [isReady, setIsReady] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setHasCompleted(value === 'true');
      setIsReady(true);
    });
  }, []);

  return { isReady, hasCompleted };
}

/**
 * Marks onboarding as complete. Call this from the Welcome screen
 * before navigating to the main app.
 */
export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
