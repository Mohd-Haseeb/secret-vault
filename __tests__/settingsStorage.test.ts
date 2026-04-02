jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultVaultSettings,
  loadVaultSettings,
  saveVaultSettings,
} from '../src/storage/settingsStorage';

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('settingsStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns defaults when nothing is stored', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

    await expect(loadVaultSettings()).resolves.toEqual(defaultVaultSettings);
  });

  it('merges partial stored settings with defaults', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        clipboardTimeout: '90s',
        blockScreenshots: false,
      }),
    );

    await expect(loadVaultSettings()).resolves.toEqual({
      ...defaultVaultSettings,
      clipboardTimeout: '90s',
      blockScreenshots: false,
    });
  });

  it('falls back to defaults for invalid stored payloads', async () => {
    mockedAsyncStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        clipboardTimeout: '120s',
      }),
    );

    await expect(loadVaultSettings()).resolves.toEqual(defaultVaultSettings);
  });

  it('persists settings as JSON', async () => {
    await saveVaultSettings(defaultVaultSettings);

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
      'local-secret-vault.settings',
      JSON.stringify(defaultVaultSettings),
    );
  });
});
