import { act, render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SecretDraft, SecretSummary, VaultSettings } from '../src/types';
import { useVault, VaultProvider } from '../src/vault/VaultProvider';

const mockLoadVaultSettings = jest.fn();
const mockSaveVaultSettings = jest.fn();
const mockDeleteSecretEntry = jest.fn();
const mockLoadProtectedSecretValue = jest.fn();
const mockLoadSecretSummaries = jest.fn();
const mockSaveSecretEntry = jest.fn();

jest.mock('../src/storage/settingsStorage', () => ({
  defaultVaultSettings: {
    lockTimeout: 'immediate',
    clipboardTimeout: '45s',
    requireAuthOnReveal: true,
    blockScreenshots: true,
  },
  loadVaultSettings: (...args: unknown[]) => mockLoadVaultSettings(...args),
  saveVaultSettings: (...args: unknown[]) => mockSaveVaultSettings(...args),
}));

jest.mock('../src/storage/vaultStorage', () => ({
  deleteSecretEntry: (...args: unknown[]) => mockDeleteSecretEntry(...args),
  loadProtectedSecretValue: (...args: unknown[]) =>
    mockLoadProtectedSecretValue(...args),
  loadSecretSummaries: (...args: unknown[]) => mockLoadSecretSummaries(...args),
  saveSecretEntry: (...args: unknown[]) => mockSaveSecretEntry(...args),
}));

jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(),
  setString: jest.fn(),
  setStringAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
  },
  authenticateAsync: jest.fn(),
  getEnrolledLevelAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
}));

type VaultSnapshot = ReturnType<typeof useVault>;

const mockedClipboard = Clipboard as jest.Mocked<typeof Clipboard>;
const mockedLocalAuth = LocalAuthentication as jest.Mocked<
  typeof LocalAuthentication
>;

function createSummary(
  overrides: Partial<SecretSummary> = {},
): SecretSummary {
  return {
    id: 'secret-1',
    label: 'Email',
    tags: [],
    pinned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createDraft(overrides: Partial<SecretDraft> = {}): SecretDraft {
  return {
    label: 'Email',
    secret: 'super-secret',
    notes: '',
    tags: '',
    collection: '',
    ...overrides,
  };
}

describe('VaultProvider', () => {
  let latestVault: VaultSnapshot | null = null;
  let appStateListener: ((state: AppStateStatus) => void) | null = null;

  function Harness() {
    latestVault = useVault();
    return null;
  }

  async function renderProvider({
    entries = [],
    settings,
  }: {
    entries?: SecretSummary[];
    settings?: Partial<VaultSettings>;
  } = {}) {
    latestVault = null;
    mockLoadSecretSummaries.mockResolvedValue(entries);
    mockLoadVaultSettings.mockResolvedValue({
      lockTimeout: 'immediate',
      clipboardTimeout: '45s',
      requireAuthOnReveal: true,
      blockScreenshots: true,
      ...settings,
    });
    mockedLocalAuth.hasHardwareAsync.mockResolvedValue(false);
    mockedLocalAuth.getEnrolledLevelAsync.mockResolvedValue(
      LocalAuthentication.SecurityLevel.NONE,
    );
    mockedLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
    } as Awaited<ReturnType<typeof LocalAuthentication.authenticateAsync>>);

    render(
      <VaultProvider>
        <Harness />
      </VaultProvider>,
    );

    await waitFor(() => {
      expect(latestVault).not.toBeNull();
      expect(latestVault?.isLoading).toBe(false);
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_, listener) => {
        appStateListener = listener;
        return { remove: jest.fn() };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects duplicate labels case-insensitively when saving', async () => {
    await renderProvider({
      entries: [createSummary({ id: 'gmail-1', label: 'Gmail' })],
    });

    let didSave = false;
    await act(async () => {
      didSave = await latestVault!.saveDraft(
        createDraft({ label: '  gmail  ', secret: 'another-secret' }),
      );
    });

    expect(didSave).toBe(false);
    expect(mockSaveSecretEntry).not.toHaveBeenCalled();
    expect(latestVault?.statusMessage).toEqual({
      tone: 'error',
      text: 'A secret with this name already exists.',
    });
  });

  it('allows editing an existing secret without treating its own label as a duplicate', async () => {
    await renderProvider({
      entries: [createSummary({ id: 'gmail-1', label: 'Gmail', pinned: true })],
    });

    let didSave = false;
    await act(async () => {
      didSave = await latestVault!.saveDraft(
        createDraft({
          id: 'gmail-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          label: ' gmail ',
          secret: 'updated-secret',
        }),
      );
    });

    expect(didSave).toBe(true);
    expect(mockSaveSecretEntry).toHaveBeenCalledTimes(1);
  });

  it('persists settings updates with the merged settings object', async () => {
    await renderProvider({
      settings: { clipboardTimeout: '45s', blockScreenshots: true },
    });

    await act(async () => {
      await latestVault!.updateSettings({ clipboardTimeout: '90s' });
    });

    expect(mockSaveVaultSettings).toHaveBeenCalledWith({
      lockTimeout: 'immediate',
      clipboardTimeout: '90s',
      requireAuthOnReveal: true,
      blockScreenshots: true,
    });
    expect(latestVault?.settings.clipboardTimeout).toBe('90s');
  });

  it('deletes a secret and restores it through undo', async () => {
    mockLoadProtectedSecretValue.mockResolvedValue('top-secret');

    await renderProvider({
      entries: [createSummary({ id: 'secret-1', label: 'Email' })],
      settings: { requireAuthOnReveal: false },
    });

    let didDelete = false;
    await act(async () => {
      didDelete = await latestVault!.deleteSecret('secret-1');
    });

    expect(didDelete).toBe(true);
    expect(mockDeleteSecretEntry).toHaveBeenCalledWith('secret-1');
    expect(latestVault?.entries).toEqual([]);
    expect(latestVault?.hasPendingUndo).toBe(true);

    await act(async () => {
      await latestVault!.undoDelete();
    });

    expect(mockSaveSecretEntry).toHaveBeenLastCalledWith({
      id: 'secret-1',
      label: 'Email',
      tags: [],
      pinned: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      secret: 'top-secret',
    });
    expect(latestVault?.entries).toHaveLength(1);
    expect(latestVault?.hasPendingUndo).toBe(false);
  });

  it('copies a secret and clears the clipboard after the configured timeout', async () => {
    jest.useFakeTimers();
    mockLoadProtectedSecretValue.mockResolvedValue('copied-secret');
    mockedClipboard.setStringAsync.mockResolvedValue(true);
    mockedClipboard.getStringAsync.mockResolvedValue('copied-secret');

    await renderProvider({
      entries: [createSummary({ id: 'secret-1' })],
      settings: {
        requireAuthOnReveal: false,
        clipboardTimeout: '15s',
      },
    });

    let didCopy = false;
    await act(async () => {
      didCopy = await latestVault!.copySecret('secret-1');
    });

    expect(didCopy).toBe(true);
    expect(mockedClipboard.setStringAsync).toHaveBeenCalledWith('copied-secret');

    await act(async () => {
      jest.advanceTimersByTime(15_000);
    });

    await waitFor(() => {
      expect(mockedClipboard.setStringAsync).toHaveBeenCalledWith('');
    });
  });

  it('locks the session after the configured background timeout', async () => {
    jest.useFakeTimers();

    await renderProvider({
      settings: { lockTimeout: '15s' },
    });

    act(() => {
      appStateListener?.('background');
    });

    act(() => {
      jest.advanceTimersByTime(14_999);
    });
    expect(latestVault?.sessionLocked).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(latestVault?.sessionLocked).toBe(true);
  });
});
