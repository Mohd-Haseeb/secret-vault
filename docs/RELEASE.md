# Release Guide

## Current reality

The app is production-shaped, but some security-sensitive behaviors still need validation in real native builds.

## Before any release

### Technical checks

```bash
source ~/.nvm/nvm.sh
nvm use
npx tsc --noEmit
```

### Manual checks

- create secret
- edit secret
- reveal secret
- copy and paste
- clipboard auto-clear
- delete and undo
- pin/unpin
- search
- tag filter
- collection filter
- sorting
- lock timeout
- auth-on-reveal toggle
- screenshot blocking toggle
- fully close and reopen the app
- restart the Android device and reopen the app
- verify previously saved secrets still load after reboot

## Expo Go warning

Expo Go is not sufficient for final security validation.

Use real builds for:

- auth-on-reveal
- screenshot blocking
- production signing behavior

## EAS notes

Project files already exist:

- `eas.json`
- `app.json`

If Apple Developer access becomes available:

```bash
source ~/.nvm/nvm.sh
nvm use
npx eas-cli login
npx eas-cli project:init
npx eas-cli build -p ios --profile preview
```

## Android suggestion

If iOS signing is blocked by Apple Developer membership, Android should be the first real build target for production-style validation.

## Android reboot and persistence check

For the Android installed build, explicitly verify:

- saved secrets still appear after a full device restart
- secret values can still be revealed after restart
- settings persist across restart
- auth-on-reveal still prompts through the device's configured unlock method

## Release checklist

- verify README accuracy
- verify bundle identifier and app metadata
- verify no secrets are committed
- verify screenshots and auth behavior in real build
- verify settings persist across restarts
- verify old local metadata still loads correctly
