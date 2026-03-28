import AsyncStorage from '@react-native-async-storage/async-storage';
import { VaultSettings } from '../types';

const SETTINGS_KEY = 'local-secret-vault.settings';

export const defaultVaultSettings: VaultSettings = {
  lockTimeout: 'immediate',
  clipboardTimeout: '45s',
  requireAuthOnReveal: true,
  blockScreenshots: true,
};

function isVaultSettings(value: unknown): value is Partial<VaultSettings> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.lockTimeout === undefined ||
      candidate.lockTimeout === 'immediate' ||
      candidate.lockTimeout === '15s' ||
      candidate.lockTimeout === '30s' ||
      candidate.lockTimeout === '60s') &&
    (candidate.clipboardTimeout === undefined ||
      candidate.clipboardTimeout === '15s' ||
      candidate.clipboardTimeout === '45s' ||
      candidate.clipboardTimeout === '90s') &&
    (candidate.requireAuthOnReveal === undefined ||
      typeof candidate.requireAuthOnReveal === 'boolean') &&
    (candidate.blockScreenshots === undefined ||
      typeof candidate.blockScreenshots === 'boolean')
  );
}

export async function loadVaultSettings(): Promise<VaultSettings> {
  try {
    const payload = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!payload) {
      return defaultVaultSettings;
    }

    const parsed = JSON.parse(payload) as unknown;
    if (!isVaultSettings(parsed)) {
      return defaultVaultSettings;
    }

    return {
      ...defaultVaultSettings,
      ...parsed,
    };
  } catch (error) {
    console.warn('Failed to load vault settings', error);
    return defaultVaultSettings;
  }
}

export async function saveVaultSettings(settings: VaultSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save vault settings', error);
  }
}
