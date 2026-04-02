import { SecretDraft, SecretSummary, VaultSettings } from '../types';

export type PersistedSecretEntry = SecretSummary & {
  secret: string;
};

export function normalizeTags(rawTags: string): string[] {
  return Array.from(
    new Set(
      rawTags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function normalizeLabelForComparison(label: string) {
  return label.trim().toLocaleLowerCase();
}

function normalizeOptionalText(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}

export function createSecretEntry(
  draft: SecretDraft,
  pinned = false,
): PersistedSecretEntry {
  const now = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).slice(2, 10);

  return {
    id: draft.id ?? `secret_${Date.now()}_${randomSuffix}`,
    label: draft.label.trim(),
    secret: draft.secret.trim(),
    notes: normalizeOptionalText(draft.notes),
    tags: normalizeTags(draft.tags),
    collection: normalizeOptionalText(draft.collection),
    pinned,
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
  };
}

export function getClipboardTimeoutMs(
  timeout: VaultSettings['clipboardTimeout'],
) {
  switch (timeout) {
    case '15s':
      return 15_000;
    case '90s':
      return 90_000;
    case '45s':
    default:
      return 45_000;
  }
}

export function getClipboardTimeoutLabel(
  timeout: VaultSettings['clipboardTimeout'],
) {
  switch (timeout) {
    case '15s':
      return '15 seconds';
    case '90s':
      return '90 seconds';
    case '45s':
    default:
      return '45 seconds';
  }
}

export function toSecretSummary(entry: PersistedSecretEntry): SecretSummary {
  return {
    id: entry.id,
    label: entry.label,
    notes: entry.notes,
    tags: entry.tags,
    collection: entry.collection,
    pinned: entry.pinned,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
