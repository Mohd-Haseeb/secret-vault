import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  defaultVaultSettings,
  loadVaultSettings,
  saveVaultSettings,
} from '../storage/settingsStorage';
import {
  deleteSecretEntry,
  loadProtectedSecretValue,
  loadSecretSummaries,
  saveSecretEntry,
} from '../storage/vaultStorage';
import { SecretDraft, SecretSummary, VaultSettings } from '../types';

type VaultContextValue = {
  entries: SecretSummary[];
  isLoading: boolean;
  sessionLocked: boolean;
  lockVersion: number;
  deviceSecurityWarning: string | null;
  supportsRuntimeDeviceAuth: boolean;
  settings: VaultSettings;
  clearWarning: () => void;
  updateSettings: (patch: Partial<VaultSettings>) => Promise<void>;
  unlockVault: () => Promise<void>;
  saveDraft: (draft: SecretDraft) => Promise<boolean>;
  deleteSecret: (id: string) => Promise<boolean>;
  revealSecret: (id: string) => Promise<string | null>;
  copySecret: (id: string) => Promise<boolean>;
  loadDraftForEditing: (entry: SecretSummary) => Promise<SecretDraft | null>;
  togglePinned: (entry: SecretSummary) => Promise<boolean>;
  hasPendingUndo: boolean;
  undoDelete: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

const initialDraft: SecretDraft = {
  id: undefined,
  createdAt: undefined,
  label: '',
  secret: '',
  notes: '',
  tags: '',
  collection: '',
};

function normalizeTags(rawTags: string): string[] {
  return Array.from(
    new Set(
      rawTags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function createSecretEntry(draft: SecretDraft, pinned = false) {
  const now = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).slice(2, 10);

  return {
    id: draft.id ?? `secret_${Date.now()}_${randomSuffix}`,
    label: draft.label.trim(),
    secret: draft.secret.trim(),
    notes: draft.notes.trim() || undefined,
    tags: normalizeTags(draft.tags),
    collection: draft.collection.trim() || undefined,
    pinned,
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
  };
}

function normalizeLabelForComparison(label: string) {
  return label.trim().toLocaleLowerCase();
}

export const emptySecretDraft = initialDraft;

export const VaultProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [pendingUndoEntry, setPendingUndoEntry] = useState<
    (SecretSummary & { secret: string }) | null
  >(null);
  const [entries, setEntries] = useState<SecretSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [lockVersion, setLockVersion] = useState(0);
  const [settings, setSettings] = useState<VaultSettings>(defaultVaultSettings);
  const [supportsRuntimeDeviceAuth, setSupportsRuntimeDeviceAuth] =
    useState(false);
  const [deviceSecurityWarning, setDeviceSecurityWarning] = useState<
    string | null
  >(null);
  const clipboardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clipboardOwnedValueRef = useRef<string | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const [storedSettings, storedEntries, hasAuthHardware, enrolledLevel] =
        await Promise.all([
          loadVaultSettings(),
          loadSecretSummaries(),
          LocalAuthentication.hasHardwareAsync().catch(() => false),
          LocalAuthentication.getEnrolledLevelAsync().catch(
            () => LocalAuthentication.SecurityLevel.NONE,
          ),
        ]);

      setSettings(storedSettings);
      setEntries(storedEntries);
      setSupportsRuntimeDeviceAuth(
        hasAuthHardware &&
          enrolledLevel !== LocalAuthentication.SecurityLevel.NONE,
      );
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    const timeoutBySetting: Record<VaultSettings['lockTimeout'], number> = {
      immediate: 0,
      '15s': 15_000,
      '30s': 30_000,
      '60s': 60_000,
    };

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          if (backgroundLockTimeoutRef.current) {
            clearTimeout(backgroundLockTimeoutRef.current);
            backgroundLockTimeoutRef.current = null;
          }
          return;
        }

        if (backgroundLockTimeoutRef.current) {
          clearTimeout(backgroundLockTimeoutRef.current);
        }

        const delay = timeoutBySetting[settings.lockTimeout];
        if (delay === 0) {
          setSessionLocked(true);
          setLockVersion((value) => value + 1);
          return;
        }

        backgroundLockTimeoutRef.current = setTimeout(() => {
          setSessionLocked(true);
          setLockVersion((value) => value + 1);
          backgroundLockTimeoutRef.current = null;
        }, delay);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [settings.lockTimeout]);

  useEffect(() => {
    if (!settings.blockScreenshots) {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
      return;
    }

    void ScreenCapture.preventScreenCaptureAsync().catch((error) => {
      console.warn('Failed to enable screen capture blocking', error);
    });

    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => undefined);
    };
  }, [settings.blockScreenshots]);

  useEffect(() => {
    return () => {
      if (clipboardTimeoutRef.current) {
        clearTimeout(clipboardTimeoutRef.current);
      }
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      if (backgroundLockTimeoutRef.current) {
        clearTimeout(backgroundLockTimeoutRef.current);
      }
    };
  }, []);

  const clearClipboardIfOwned = async () => {
    if (!clipboardOwnedValueRef.current) {
      return;
    }

    const currentClipboardValue = await Clipboard.getStringAsync();
    if (currentClipboardValue === clipboardOwnedValueRef.current) {
      await Clipboard.setStringAsync('');
    }

    clipboardOwnedValueRef.current = null;
  };

  const getClipboardTimeoutMs = () => {
    switch (settings.clipboardTimeout) {
      case '15s':
        return 15_000;
      case '90s':
        return 90_000;
      case '45s':
      default:
        return 45_000;
    }
  };

  const getClipboardTimeoutLabel = () => {
    switch (settings.clipboardTimeout) {
      case '15s':
        return '15 seconds';
      case '90s':
        return '90 seconds';
      case '45s':
      default:
        return '45 seconds';
    }
  };

  const authenticateForAccess = async (promptMessage: string) => {
    if (!supportsRuntimeDeviceAuth) {
      setDeviceSecurityWarning(
        'Device authentication is not available on this device. Set up a screen lock or biometrics to use this protection.',
      );
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setDeviceSecurityWarning(null);
        return true;
      }

      if (
        result.error === 'user_cancel' ||
        result.error === 'app_cancel' ||
        result.error === 'system_cancel'
      ) {
        return false;
      }

      setDeviceSecurityWarning(
        'Authentication failed. Check your screen lock or biometric setup and try again.',
      );
      return false;
    } catch (error) {
      console.warn('Failed to run local authentication', error);
      setDeviceSecurityWarning(
        'Authentication failed. Check your screen lock or biometric setup and try again.',
      );
      return false;
    }
  };

  const scheduleClipboardClear = (secretValue: string) => {
    if (clipboardTimeoutRef.current) {
      clearTimeout(clipboardTimeoutRef.current);
    }

    clipboardOwnedValueRef.current = secretValue;
    clipboardTimeoutRef.current = setTimeout(() => {
      void clearClipboardIfOwned();
    }, getClipboardTimeoutMs());
  };

  const revealSecret = async (id: string) => {
    if (settings.requireAuthOnReveal) {
      const didAuthenticate = await authenticateForAccess(
        'Authenticate to reveal this secret',
      );
      if (!didAuthenticate) {
        return null;
      }
    }

    const value = await loadProtectedSecretValue(id);

    if (!value) {
      setDeviceSecurityWarning(
        'This secret could not be loaded from secure storage.',
      );
      return null;
    }

    setDeviceSecurityWarning(null);
    return value;
  };

  const copySecret = async (id: string) => {
    const value = await revealSecret(id);
    if (!value) {
      return false;
    }

    let didWrite = await Clipboard.setStringAsync(value);
    if (!didWrite) {
      Clipboard.setString(value);
      const clipboardValue = await Clipboard.getStringAsync();
      didWrite = clipboardValue === value;
    }

    if (!didWrite) {
      setDeviceSecurityWarning(
        'Copy failed. The phone clipboard did not accept the secret value.',
      );
      return false;
    }

    scheduleClipboardClear(value);
    setDeviceSecurityWarning(
      `Secret copied. The clipboard will be cleared in ${getClipboardTimeoutLabel()} if it still contains the same value.`,
    );
    return true;
  };

  const saveDraft = async (draft: SecretDraft) => {
    if (!draft.label.trim() || !draft.secret.trim()) {
      setDeviceSecurityWarning('Label and secret value are required.');
      return false;
    }

    const normalizedDraftLabel = normalizeLabelForComparison(draft.label);
    const hasDuplicateLabel = entries.some(
      (entry) =>
        entry.id !== draft.id &&
        normalizeLabelForComparison(entry.label) === normalizedDraftLabel,
    );

    if (hasDuplicateLabel) {
      setDeviceSecurityWarning('A secret with this name already exists.');
      return false;
    }

    try {
      const existingEntry = draft.id
        ? entries.find((entry) => entry.id === draft.id)
        : undefined;
      const nextEntry = createSecretEntry(draft, existingEntry?.pinned ?? false);
      await saveSecretEntry(nextEntry);
      setEntries((current) => [
        {
          id: nextEntry.id,
          label: nextEntry.label,
          notes: nextEntry.notes,
          tags: nextEntry.tags,
          collection: nextEntry.collection,
          pinned: nextEntry.pinned,
          createdAt: nextEntry.createdAt,
          updatedAt: nextEntry.updatedAt,
        },
        ...current.filter((entry) => entry.id !== nextEntry.id),
      ]);
      setDeviceSecurityWarning(null);
      return true;
    } catch (error) {
      console.warn('Failed to save protected secret', error);
      setDeviceSecurityWarning(
        'Saving failed. Make sure device security is enabled and try again.',
      );
      return false;
    }
  };

  const deleteSecret = async (id: string) => {
    try {
      const entry = entries.find((item) => item.id === id);
      if (!entry) {
        return false;
      }

      const secret = await revealSecret(id);
      if (!secret) {
        return false;
      }

      await deleteSecretEntry(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      setPendingUndoEntry({
        ...entry,
        secret,
      });
      undoTimeoutRef.current = setTimeout(() => {
        setPendingUndoEntry(null);
      }, 8_000);
      setDeviceSecurityWarning('Secret deleted. Undo is available for 8 seconds.');
      return true;
    } catch (error) {
      console.warn('Failed to delete protected secret', error);
      setDeviceSecurityWarning('Delete failed. Please try again.');
      return false;
    }
  };

  const undoDelete = async () => {
    if (!pendingUndoEntry) {
      return;
    }

    try {
      await saveSecretEntry(pendingUndoEntry);
      setEntries((current) => [
        {
          id: pendingUndoEntry.id,
          label: pendingUndoEntry.label,
          notes: pendingUndoEntry.notes,
          tags: pendingUndoEntry.tags,
          collection: pendingUndoEntry.collection,
          pinned: pendingUndoEntry.pinned,
          createdAt: pendingUndoEntry.createdAt,
          updatedAt: pendingUndoEntry.updatedAt,
        },
        ...current.filter((entry) => entry.id !== pendingUndoEntry.id),
      ]);
      setPendingUndoEntry(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
      setDeviceSecurityWarning('Deletion undone.');
    } catch (error) {
      console.warn('Failed to undo deletion', error);
      setDeviceSecurityWarning('Undo failed. Please try again.');
    }
  };

  const loadDraftForEditing = async (entry: SecretSummary) => {
    const value = await revealSecret(entry.id);
    if (!value) {
      return null;
    }

    setDeviceSecurityWarning(
      'Editing an existing secret. Save will update it in place.',
    );
    return {
      id: entry.id,
      createdAt: entry.createdAt,
      label: entry.label,
      secret: value,
      notes: entry.notes ?? '',
      tags: entry.tags.join(', '),
      collection: entry.collection ?? '',
    };
  };

  const togglePinned = async (entry: SecretSummary) => {
    const value = await revealSecret(entry.id);
    if (!value) {
      return false;
    }

    try {
      const updated = {
        id: entry.id,
        label: entry.label,
        secret: value,
        notes: entry.notes,
        tags: entry.tags,
        collection: entry.collection,
        pinned: !entry.pinned,
        createdAt: entry.createdAt,
        updatedAt: new Date().toISOString(),
      };
      await saveSecretEntry(updated);
      setEntries((current) => [
        {
          ...entry,
          pinned: updated.pinned,
          updatedAt: updated.updatedAt,
        },
        ...current.filter((item) => item.id !== entry.id),
      ]);
      setDeviceSecurityWarning(null);
      return true;
    } catch (error) {
      console.warn('Failed to update pinned state', error);
      setDeviceSecurityWarning('Pin update failed. Please try again.');
      return false;
    }
  };

  const unlockVault = async () => {
    if (!supportsRuntimeDeviceAuth) {
      setSessionLocked(false);
      setDeviceSecurityWarning(
        'Device authentication is not available on this device, so the vault lock is acting only as a privacy screen.',
      );
      return;
    }

    const didUnlock = await authenticateForAccess('Unlock Secret Vault');
    if (!didUnlock) {
      return;
    }

    setDeviceSecurityWarning(null);
    setSessionLocked(false);
  };

  const updateSettings = async (patch: Partial<VaultSettings>) => {
    const nextSettings = {
      ...settings,
      ...patch,
    };
    setSettings(nextSettings);
    await saveVaultSettings(nextSettings);
  };

  const value = useMemo<VaultContextValue>(
    () => ({
      entries,
      isLoading,
      sessionLocked,
      lockVersion,
      deviceSecurityWarning,
      supportsRuntimeDeviceAuth,
      settings,
      clearWarning: () => setDeviceSecurityWarning(null),
      updateSettings,
      unlockVault,
      saveDraft,
      deleteSecret,
      revealSecret,
      copySecret,
      loadDraftForEditing,
      togglePinned,
      hasPendingUndo: pendingUndoEntry != null,
      undoDelete,
    }),
    [
      entries,
      isLoading,
      sessionLocked,
      lockVersion,
      deviceSecurityWarning,
      supportsRuntimeDeviceAuth,
      settings,
      pendingUndoEntry,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
