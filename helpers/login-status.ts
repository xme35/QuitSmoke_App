import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGIN_STATUS_KEY = 'quitnicotine:userHasLoggedIn';

export async function getLoginStatus(): Promise<boolean> {
  try {
    const storedValue = await AsyncStorage.getItem(LOGIN_STATUS_KEY);
    return storedValue === 'true';
  } catch (error) {
    console.warn('Unable to read login status flag', error);
    return false;
  }
}

export async function setLoginStatus(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(LOGIN_STATUS_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.warn('Unable to persist login status flag', error);
  }
}

export async function clearLoginStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOGIN_STATUS_KEY);
  } catch (error) {
    console.warn('Unable to clear login status flag', error);
  }
}