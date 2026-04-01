import * as SecureStore from 'expo-secure-store';
import { SecretSummary } from '../types';

const INDEX_KEY = 'local-secret-vault.index';
const KEYCHAIN_SERVICE = 'local-secret-vault';

type PersistedSecret = SecretSummary & {
  secret: string;
};

function isSecretSummary(value: unknown): value is SecretSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    (typeof candidate.collection === 'undefined' ||
      typeof candidate.collection === 'string') &&
    (typeof candidate.pinned === 'undefined' ||
      typeof candidate.pinned === 'boolean') &&
    (typeof candidate.tags === 'undefined' ||
      (Array.isArray(candidate.tags) &&
        candidate.tags.every((tag) => typeof tag === 'string'))) &&
    (typeof candidate.notes === 'string' || typeof candidate.notes === 'undefined')
  );
}

function normalizeSecretSummary(entry: SecretSummary): SecretSummary {
  return {
    ...entry,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    collection:
      typeof entry.collection === 'string' ? entry.collection : undefined,
    pinned: typeof entry.pinned === 'boolean' ? entry.pinned : false,
  };
}

function secretKey(id: string): string {
  const normalizedID = id.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `local-secret-vault.secret.${normalizedID}`;
}

async function loadIndex(): Promise<SecretSummary[]> {
  try {
    const payload = await SecureStore.getItemAsync(INDEX_KEY, {
      keychainService: KEYCHAIN_SERVICE,
    });

    if (!payload) {
      return [];
    }

    const parsed = JSON.parse(payload) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSecretSummary).map(normalizeSecretSummary);
  } catch (error) {
    console.warn('Failed to load secret index', error);
    return [];
  }
}

async function saveIndex(entries: SecretSummary[]): Promise<void> {
  await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(entries), {
    keychainService: KEYCHAIN_SERVICE,
  });
}

export async function loadSecretSummaries(): Promise<SecretSummary[]> {
  const entries = await loadIndex();
  return entries.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function saveSecretEntry(entry: PersistedSecret): Promise<void> {
  const summaries = await loadIndex();
  const summary: SecretSummary = {
    id: entry.id,
    label: entry.label,
    notes: entry.notes,
    tags: entry.tags,
    collection: entry.collection,
    pinned: entry.pinned,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };

  const nextSummaries = [summary, ...summaries.filter((item) => item.id !== entry.id)];

  await SecureStore.setItemAsync(secretKey(entry.id), entry.secret, {
    keychainService: KEYCHAIN_SERVICE,
  });
  await saveIndex(nextSummaries);
}

export async function deleteSecretEntry(id: string): Promise<void> {
  const summaries = await loadIndex();
  await SecureStore.deleteItemAsync(secretKey(id), {
    keychainService: KEYCHAIN_SERVICE,
  });
  await saveIndex(summaries.filter((entry) => entry.id !== id));
}

export async function loadProtectedSecretValue(
  id: string,
): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(secretKey(id), {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch (error) {
    console.warn('Failed to load protected secret value', error);
    return null;
  }
}
