# Developer Guide

## Tech Stack

- **Electron** — desktop application framework
- **React 19** — UI framework
- **TypeScript** — type safety
- **Vite** — build tool and dev server
- **Tailwind CSS** — styling
- **Zustand** — state management
- **TanStack React Table** — data tables

## Setup

**Prerequisites:** Node.js 20+

```bash
pnpm install
```

## Development

```bash
# Run the app (Vite dev server + Electron)
pnpm dev

# Type check
npx tsc --noEmit

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Building

```bash
pnpm build
```

This runs `tsc`, then Vite, then `electron-builder` and outputs installers to `release/`.

## Releasing

Releases are published automatically to GitHub Releases via GitHub Actions when a version tag is pushed. The tag and `package.json` version must match — use `pnpm version` to keep them in sync:

```bash
pnpm version patch   # 1.0.0 → 1.0.1  (bug fixes)
pnpm version minor   # 1.0.0 → 1.1.0  (new features)
pnpm version major   # 1.0.0 → 2.0.0  (breaking changes)
```

Then push the commit and tag:

```bash
git push origin main
git push origin --tags
```

GitHub Actions will build the app for Windows and Linux and publish installers to the new release. Existing installs receive an update prompt on next launch.

## Recommended IDE

[VS Code](https://code.visualstudio.com/)
