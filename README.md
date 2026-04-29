# Class Sorter

A desktop application for teachers to sort students into balanced classes based on various parameters such as preferred friends, blacklisted students, gender balance, and EAL (English as Additional Language) distribution.

## Tech Stack

- **Electron** - Desktop application framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **TanStack React Table** - Data tables

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Releasing a new version

Releases are published automatically to GitHub Releases via GitHub Actions when a version tag is pushed. The tag and `package.json` version must match — use `npm version` to keep them in sync:

```bash
npm version patch   # 1.0.0 → 1.0.1  (bug fixes)
npm version minor   # 1.0.0 → 1.1.0  (new features)
npm version major   # 1.0.0 → 2.0.0  (breaking changes)
```

This updates `package.json`, commits the change, and creates the git tag in one step. Then push both:

```bash
git push origin main
git push origin --tags
```

GitHub Actions will build the app and publish the installer to a new GitHub Release. Existing installs will receive an update prompt on next launch.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
