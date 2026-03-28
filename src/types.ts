export type SecretSummary = {
  id: string;
  label: string;
  notes?: string;
  tags: string[];
  collection?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SecretDraft = {
  id?: string;
  createdAt?: string;
  label: string;
  secret: string;
  notes: string;
  tags: string;
  collection: string;
};

export type SortMode = 'updated' | 'alphabetical' | 'created';

export type LockTimeoutOption = 'immediate' | '15s' | '30s' | '60s';

export type ClipboardTimeoutOption = '15s' | '45s' | '90s';

export type VaultSettings = {
  lockTimeout: LockTimeoutOption;
  clipboardTimeout: ClipboardTimeoutOption;
  requireAuthOnReveal: boolean;
  blockScreenshots: boolean;
};
