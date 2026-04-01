# Roadmap

## Current state

The app supports the core local vault experience:

- vault list
- detail view
- editor
- settings
- search
- tags
- collections
- sorting
- pinned secrets
- clipboard clear
- confirm delete + undo

## Short-term priorities

### 1. Real build validation

- build outside Expo Go
- validate auth-on-reveal
- validate screenshot blocking
- validate clipboard timeout
- validate lock timeout

### 2. Automated tests

Target:

- settings persistence
- sorting
- tag filtering
- collection filtering
- delete + undo
- lock timing
- clipboard timing

### 3. Release polish

- app icon
- splash assets
- better settings copy
- more polished empty/loading states

## Deferred backlog

### Import/export

Deferred on purpose.

Reason:

- creates a second high-value artifact outside the vault
- requires explicit encrypted format design
- requires careful warning UX

### Advanced organization

- multiple collections per secret
- nested folders
- favorites beyond pinned

### Data recovery

- malformed metadata recovery
- backup/restore workflow

### Auditability

- local-only action log
- last viewed/copied timestamps

## Decision principles

- do not add features that weaken the local-only posture casually
- do not add backend-dependent flows unless explicitly requested
- prefer reliability and clarity over feature count
