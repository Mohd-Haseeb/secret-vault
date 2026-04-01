# Architecture

## Overview

Secret Vault is an Expo React Native app built around a local-only storage model.

The app separates:

- secret values
- secret metadata
- app settings
- UI/state orchestration

This separation is intentional and should be preserved.

## Data model

### Secret values

- stored individually in `expo-secure-store`
- keyed by secret ID
- retrieved only when needed for reveal/copy/edit/delete/pin flows

### Secret metadata

Stored in the local metadata index:

- `id`
- `label`
- `notes`
- `tags`
- `collection`
- `pinned`
- `createdAt`
- `updatedAt`

The metadata index is used for:

- list rendering
- search
- tag filtering
- collection filtering
- sorting

### Settings

Stored separately from vault data:

- `lockTimeout`
- `clipboardTimeout`
- `requireAuthOnReveal`
- `blockScreenshots`

## Main modules

### `src/vault/VaultProvider.tsx`

This is the operational core of the app.

Responsibilities:

- load initial entries
- load initial settings
- manage warning state
- apply lock timing
- manage undo-delete state
- manage clipboard ownership and clearing
- expose actions to screens

### `src/storage/vaultStorage.ts`

Responsibilities:

- read/write metadata index
- read/write per-secret secure values
- normalize older records when new metadata fields are added

### `src/storage/settingsStorage.ts`

Responsibilities:

- persist settings locally
- provide defaults
- normalize stored settings

## Screen design

### Vault List

- browse-oriented
- no secret values loaded by default
- filters and sorting live here

### Secret Detail

- secret-specific actions
- reveals, copy, pin, delete, edit

### Secret Editor

- single-purpose create/edit form

### Settings

- user-controlled security and UX behavior

## Security notes

- This app does not claim hardware-grade custom cryptography
- It relies on Expo-supported local secure storage
- Real validation must happen in native builds, not only Expo Go

## Change guidelines

When changing the data model:

- keep backward compatibility
- normalize older records
- avoid introducing migrations that break existing local data

When changing secret flows:

- prefer reading the secret only when needed
- do not move secret values into general list state unnecessarily

When changing settings:

- keep defaults explicit
- persist changes immediately
- document behavioral implications in the UI when relevant
