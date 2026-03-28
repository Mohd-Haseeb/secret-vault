# Secret Vault Mobile

Local-only secret manager built with Expo, React Native, and TypeScript.

This app is designed for personal secret storage on-device. It does not use a backend, user accounts, or cloud sync. Secret values are stored locally with `expo-secure-store`, while list metadata and app settings are kept on-device as local app data.

## What the app does

- Stores secrets only on the device
- Separates secret values from list metadata
- Supports vault browsing with:
  - search
  - tag filtering
  - collection/folder filtering
  - sorting
  - pinned secrets
- Supports secret actions:
  - reveal
  - copy
  - edit
  - delete with confirm + undo
- Supports user settings:
  - lock timeout
  - clipboard clear timeout
  - require auth on reveal
  - screenshot blocking

## Current screens

- `Vault List`
  - browse all secrets
  - search by label, notes, and tags
  - filter by tags and collections
  - sort by updated, created, or alphabetical order
  - jump into detail view
- `Secret Detail`
  - reveal secret
  - copy secret
  - edit secret
  - pin or unpin
  - delete with confirmation
- `Secret Editor`
  - create new secret
  - edit existing secret
  - assign tags
  - assign collection/folder
- `Settings`
  - configure security and UX behavior

## Security model

This app aims to be local-only and simple, but it is important to be precise about what that means.

- There is no backend, account, or sync service.
- Secret values are stored using `expo-secure-store`.
- Metadata such as labels, tags, collection, pinned state, and timestamps are stored locally as app-managed metadata.
- When enabled, reveal-related actions can require device authentication before access.
- Clipboard content is auto-cleared after a configurable timeout if the clipboard still contains the same copied secret.
- Screenshot blocking is wired through `expo-screen-capture`.

## Important limitations

- Expo Go is useful for development, but it does not fully represent production-native behavior for all security features.
- Real iOS install testing requires Apple Developer Program access if you want a signed native build on your iPhone.
- Screenshot blocking and some auth-on-reveal behaviors should be validated in a real build, not only in Expo Go.
- This app currently does not implement encrypted import/export.

## No hardcoded secrets

At the current state of this repository, there are no obvious application secrets checked into source control:

- no API keys
- no access tokens
- no backend credentials
- no hardcoded user secret values

What is present:

- app configuration
- package definitions
- local-only vault logic
- bundle identifier metadata in `app.json`

That means the project is reasonable to push to GitHub, assuming you are comfortable sharing the app name and bundle identifier.

## Prerequisites

- `Node.js` 20.19.4 or higher
- `npm`
- Expo tooling via `npx`
- for iOS production-style builds: Apple Developer Program membership
- for Android production-style builds: standard Expo/EAS Android setup

## Local setup

From the project root:

```bash
cd /Users/mohdhaseeb/todo-mobile
source ~/.nvm/nvm.sh
nvm use 20.20.0
npm install
```

Verify TypeScript:

```bash
npx tsc --noEmit
```

## Running the app in Expo Go

```bash
npm start
```

Then:

- open `Expo Go` on your phone
- scan the QR code
- if LAN mode is unreliable, run:

```bash
npx expo start --tunnel
```

## iOS build notes

The project has `eas.json` and base iOS metadata prepared, but real iPhone installation outside Expo Go still requires Apple’s paid developer program for signing/distribution.

Prepared files:

- [app.json](/Users/mohdhaseeb/todo-mobile/app.json)
- [eas.json](/Users/mohdhaseeb/todo-mobile/eas.json)

If your Apple Developer membership becomes active later, the intended flow is:

```bash
source ~/.nvm/nvm.sh
nvm use 20.20.0
npx eas-cli login
npx eas-cli project:init
npx eas-cli build -p ios --profile preview
```

## Android build notes

Android is the easiest path for a real installed build without Apple’s restrictions. Once you decide to validate native behavior outside Expo Go, Android should be the first production-style target.

## Project structure

```text
todo-mobile/
├── src/
│   ├── components/
│   │   ├── UndoBanner.tsx
│   │   └── VaultLockOverlay.tsx
│   ├── screens/
│   │   ├── SecretDetailScreen.tsx
│   │   ├── SecretEditorScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── VaultListScreen.tsx
│   ├── storage/
│   │   ├── settingsStorage.ts
│   │   └── vaultStorage.ts
│   ├── vault/
│   │   └── VaultProvider.tsx
│   └── types.ts
├── App.tsx
├── app.json
├── eas.json
└── package.json
```

## Key implementation details

### Secret values

- stored individually in `SecureStore`
- not kept in the main list index payload

### Metadata

The list index stores only metadata such as:

- label
- notes
- tags
- collection
- pinned state
- timestamps

### Settings

User settings are stored locally and currently include:

- lock timeout
- clipboard clear timeout
- require auth on reveal
- block screenshots

## Recommended testing checklist

When testing in Expo Go:

- create secret
- edit secret
- reveal secret
- copy and paste into Notes
- wait for clipboard timeout
- delete and undo
- pin and unpin
- search and filter by tag
- filter by collection
- change settings

When testing in a real build later:

- confirm auth-on-reveal behavior
- confirm screenshot blocking
- confirm background lock timeout behavior
- confirm clipboard timeout outside Expo Go

## Backlog

- encrypted import/export with explicit backup design
- automated tests for settings, lock timing, undo, and reveal flows
- Android screenshot-block verification in real builds
- real build validation for auth-on-reveal outside Expo Go
- better app branding, icon, and launch assets
- corruption recovery for malformed local metadata
- multi-collection support if needed later
- optional audit log for local actions

## Why import/export is deferred

Import and export are useful for backup and device migration, but they also create a second high-value artifact outside the vault. That changes the threat model. The feature is intentionally kept in the backlog until the backup format, encryption, and user warnings are designed properly.
