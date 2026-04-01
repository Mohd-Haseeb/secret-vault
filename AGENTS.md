# AGENTS.md

This repository is a local-only secret manager mobile app built with Expo, React Native, and TypeScript.

## Product summary

- App name: `Secret Vault`
- Goal: store secrets locally on-device with a simple, privacy-first UX
- No backend
- No user accounts
- No cloud sync
- No import/export yet

## Current architecture

- `App.tsx`
  - root navigation
  - safe area setup
  - global lock overlay
  - global undo banner
- `src/vault/VaultProvider.tsx`
  - shared vault state
  - secure actions
  - lock handling
  - clipboard clear timing
  - settings application
- `src/storage/vaultStorage.ts`
  - local secret persistence
  - secret metadata index
  - per-secret value storage in `expo-secure-store`
- `src/storage/settingsStorage.ts`
  - persisted app settings via local storage
- `src/screens/VaultListScreen.tsx`
  - main vault browsing screen
  - search, sort, tag filter, collection filter
- `src/screens/SecretDetailScreen.tsx`
  - reveal, copy, edit, pin, delete
- `src/screens/SecretEditorScreen.tsx`
  - create and edit form
- `src/screens/SettingsScreen.tsx`
  - security and UX settings

## Security model

- Secret values are stored locally in `expo-secure-store`
- Metadata is stored locally as app-managed index data
- Reveal-related actions can require device auth depending on settings and runtime support
- Clipboard auto-clear is supported
- Screenshot blocking is wired with `expo-screen-capture`

## Important limitations

- Expo Go does not fully represent production-native behavior for:
  - auth-on-reveal
  - screenshot blocking
- iOS real-device native install requires Apple Developer Program membership for EAS distribution
- Import/export is intentionally deferred because it changes the threat model

## Coding constraints for future agents

- Do not add a backend or sync flow unless explicitly requested
- Do not add import/export casually
- Do not weaken the local-only security model without calling it out explicitly
- Prefer platform or Expo-supported security APIs over random third-party crypto packages
- Keep list metadata separate from secret values
- Preserve backward compatibility for stored metadata when adding new fields

## Current product features

- create secret
- edit secret
- reveal secret
- copy secret
- auto-clear clipboard
- delete with confirm + undo
- pin/unpin
- tags
- collections/folders
- search
- sorting
- settings
- lock overlay

## Near-term priorities

- stabilize with tests
- validate real native builds
- verify screenshot blocking and auth-on-reveal outside Expo Go
- polish branding and release flow

## Useful commands

```bash
source ~/.nvm/nvm.sh
nvm use 20.20.0
npx tsc --noEmit
npm start
```

## Build notes

- `eas.json` exists
- `app.json` contains a bundle identifier
- EAS iOS builds require Apple developer enrollment

## If resuming work in a future session

Read these files first:

1. `README.md`
2. `AGENTS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/ROADMAP.md`
5. `docs/RELEASE.md`
