import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STATUS_KEY = 'quitnicotine:onboardingStatus';
const LEGACY_ONBOARDING_KEY = 'hasCompletedOnboarding';

const getStorageKey = (userId?: string | null) =>
  userId ? `${ONBOARDING_STATUS_KEY}:${userId}` : ONBOARDING_STATUS_KEY;

export async function getOnboardingStatus(userId?: string | null): Promise<boolean> {
  try {
    const storageKey = getStorageKey(userId);
    const storedValue = await AsyncStorage.getItem(storageKey);

    if (storedValue !== null) {
      return storedValue === 'true';
    }

    const legacyValue = await AsyncStorage.getItem(LEGACY_ONBOARDING_KEY);
    if (legacyValue !== null) {
      await AsyncStorage.setItem(storageKey, legacyValue);
      await AsyncStorage.removeItem(LEGACY_ONBOARDING_KEY);
      return legacyValue === 'true';
    }

    return false;
  } catch (error) {
    console.warn('Unable to read onboarding status flag', error);
    return false;
  }
}

export async function setOnboardingStatus(
  value: boolean,
  userId?: string | null,
): Promise<void> {
  try {
    await AsyncStorage.setItem(getStorageKey(userId), value ? 'true' : 'false');
  } catch (error) {
    console.warn('Unable to persist onboarding status flag', error);
  }
}

export async function clearOnboardingStatus(userId?: string | null): Promise<void> {
  try {
    await AsyncStorage.removeItem(getStorageKey(userId));
  } catch (error) {
    console.warn('Unable to clear onboarding status flag', error);
  }
}