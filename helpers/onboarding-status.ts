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

    if (userId) {
      const defaultKeyValue = await AsyncStorage.getItem(ONBOARDING_STATUS_KEY);
      if (defaultKeyValue !== null) {
        await AsyncStorage.setItem(storageKey, defaultKeyValue);
        await AsyncStorage.removeItem(ONBOARDING_STATUS_KEY);
        return defaultKeyValue === 'true';
      }
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
    const storageKey = getStorageKey(userId);
    const serialized = value ? 'true' : 'false';

    await AsyncStorage.setItem(storageKey, serialized);

    if (userId) {
      await AsyncStorage.setItem(ONBOARDING_STATUS_KEY, serialized);
    }
  } catch (error) {
    console.warn('Unable to persist onboarding status flag', error);
  }
}

export async function clearOnboardingStatus(userId?: string | null): Promise<void> {
  try {
    const storageKey = getStorageKey(userId);

    await AsyncStorage.removeItem(storageKey);

    if (userId) {
      await AsyncStorage.removeItem(ONBOARDING_STATUS_KEY);
    }
  } catch (error) {
    console.warn('Unable to clear onboarding status flag', error);
  }
}