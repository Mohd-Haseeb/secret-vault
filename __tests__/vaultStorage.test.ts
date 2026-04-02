jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import {
  deleteSecretEntry,
  loadProtectedSecretValue,
  loadSecretSummaries,
  saveSecretEntry,
} from '../src/storage/vaultStorage';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('vaultStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads, normalizes, and sorts secret summaries', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: 'older',
          label: 'Older',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'newer',
          label: 'Newer',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
          tags: ['work'],
          pinned: true,
        },
        {
          invalid: true,
        },
      ]),
    );

    await expect(loadSecretSummaries()).resolves.toEqual([
      {
        id: 'newer',
        label: 'Newer',
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
        tags: ['work'],
        pinned: true,
      },
      {
        id: 'older',
        label: 'Older',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        tags: [],
        collection: undefined,
        pinned: false,
      },
    ]);
  });

  it('stores secret values separately and updates the metadata index', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: 'existing',
          label: 'Existing',
          tags: [],
          pinned: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );

    await saveSecretEntry({
      id: 'abc/123',
      label: 'Email',
      secret: 'super-secret',
      notes: 'Primary login',
      tags: ['work'],
      collection: 'Accounts',
      pinned: true,
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    });

    expect(mockedSecureStore.setItemAsync).toHaveBeenNthCalledWith(
      1,
      'local-secret-vault.secret.abc_123',
      'super-secret',
      { keychainService: 'local-secret-vault' },
    );
    expect(mockedSecureStore.setItemAsync).toHaveBeenNthCalledWith(
      2,
      'local-secret-vault.index',
      JSON.stringify([
        {
          id: 'abc/123',
          label: 'Email',
          notes: 'Primary login',
          tags: ['work'],
          collection: 'Accounts',
          pinned: true,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
        {
          id: 'existing',
          label: 'Existing',
          tags: [],
          pinned: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
      { keychainService: 'local-secret-vault' },
    );
  });

  it('deletes the secure value and removes the metadata entry', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(
      JSON.stringify([
        {
          id: 'remove-me',
          label: 'Old',
          tags: [],
          pinned: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'keep-me',
          label: 'Keep',
          tags: [],
          pinned: false,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ]),
    );

    await deleteSecretEntry('remove-me');

    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
      'local-secret-vault.secret.remove-me',
      { keychainService: 'local-secret-vault' },
    );
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
      'local-secret-vault.index',
      JSON.stringify([
        {
          id: 'keep-me',
          label: 'Keep',
          tags: [],
          pinned: false,
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ]),
      { keychainService: 'local-secret-vault' },
    );
  });

  it('returns null when a protected secret read fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('boom'));

    await expect(loadProtectedSecretValue('missing')).resolves.toBeNull();
  });
});
