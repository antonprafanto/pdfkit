# Build Guide

Instructions for building and releasing PDF Kit.

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or later | Runtime |
| npm | 9.x or later | Package manager |
| Git | Latest | Version control |

### Optional for Full Features

| Software | Version | Purpose |
|----------|---------|---------|
| LibreOffice | 7.x+ | Office conversion |

---

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/user/pdf-kit.git
cd pdf-kit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

This starts:
- Vite dev server (port 5173)
- Electron in development mode
- Hot module replacement

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development mode |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run test:ui` | Run tests with UI |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix lint issues |
| `npm run format` | Format code with Prettier |
| `npm run package` | Create distributable |
| `npm run package:win` | Windows installer |
| `npm run package:mac` | macOS installer |
| `npm run package:linux` | Linux installer |

---

## Build Process

### Step 1: Build Frontend

```bash
npm run build:vite
```

Outputs to `dist/` directory:
- `index.html`
- JavaScript bundles
- CSS files
- Assets

### Step 2: Build Electron

```bash
npm run build:electron
```

Compiles TypeScript:
- Main process code
- Preload scripts

### Step 3: Full Build

```bash
npm run build
```

Runs both steps sequentially.

---

## Packaging

### All Platforms

```bash
npm run package
```

### Windows Only

```bash
npm run package:win
```

Creates:
- `PDF-Kit-Setup-x.x.x.exe` (NSIS installer)
- `PDF-Kit-x.x.x.exe` (Portable)

### macOS Only

```bash
npm run package:mac
```

Creates:
- `PDF-Kit-x.x.x.dmg`
- `PDF-Kit-x.x.x-mac.zip`

### Linux Only

```bash
npm run package:linux
```

Creates:
- `PDF-Kit-x.x.x.AppImage`
- `pdf-kit_x.x.x_amd64.deb`

---

## Configuration

### electron-builder.yml

```yaml
appId: com.pdfkit.app
productName: PDF Kit
copyright: Copyright © 2025

directories:
  output: release

files:
  - dist/**/*
  - package.json

win:
  target:
    - nsis
    - portable
  icon: build/icon.ico

mac:
  target:
    - dmg
    - zip
  icon: build/icon.icns

linux:
  target:
    - AppImage
    - deb
  icon: build/icons
```

### vite.config.ts

Key settings:
- `base: './'` - Relative paths for Electron
- `build.outDir: 'dist'` - Output directory
- React plugin for JSX

---

## Testing

### Run All Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test -- --watch
```

### Coverage Report

```bash
npm run test -- --coverage
```

### Specific Test File

```bash
npm run test -- src/renderer/store/settings-store.test.ts
```

---

## Release Process

### 1. Update Version

```bash
npm version patch  # or minor, major
```

### 2. Update Changelog

Edit `CHANGELOG.md` with new version notes.

### 3. Build and Test

```bash
npm run build
npm run test
```

### 4. Create Package

```bash
npm run package
```

### 5. Create GitHub Release

1. Push tags: `git push --tags`
2. Create release on GitHub
3. Upload installers
4. Write release notes

---

## CI/CD

### GitHub Actions Workflow

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm run package
      
      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: release/*
```

---

## Code Signing

### Windows

Requires code signing certificate:

```yaml
# In electron-builder.yml
win:
  certificateFile: path/to/certificate.pfx
  certificatePassword: ${CERTIFICATE_PASSWORD}
```

### macOS

Requires Apple Developer account:

```yaml
# In electron-builder.yml
mac:
  identity: "Developer ID Application: Your Name"
  hardenedRuntime: true
  entitlements: build/entitlements.plist
```

---

## Troubleshooting

### Build Fails

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Clear build cache:
   ```bash
   rm -rf dist release
   npm run build
   ```

### Package Fails

1. Check electron-builder.yml syntax
2. Ensure all referenced files exist
3. Check permissions on icon files

### Tests Fail

1. Run specific test to isolate:
   ```bash
   npm run test -- --run path/to/test.ts
   ```

2. Check test output for details

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | development/production |
| `VITE_DEV_SERVER_URL` | Dev server URL |
| `CERTIFICATE_PASSWORD` | Code signing password |

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
