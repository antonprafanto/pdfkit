# PDF Kit Architecture

Technical overview of PDF Kit's architecture and code structure.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PDF Kit Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    IPC    ┌─────────────────────────┐  │
│  │   Main Process  │◄────────►│   Renderer Process      │  │
│  │   (Electron)    │           │   (React + TypeScript)  │  │
│  └────────┬────────┘           └───────────┬─────────────┘  │
│           │                                 │                │
│  ┌────────▼────────┐           ┌───────────▼─────────────┐  │
│  │    Services     │           │      Components         │  │
│  │ - Connectivity  │           │ - PDFViewer             │  │
│  │ - Auto-updater  │           │ - Toolbar               │  │
│  │ - Office Conv.  │           │ - Sidebar               │  │
│  │ - Plugins       │           │ - Dialogs               │  │
│  └─────────────────┘           └───────────┬─────────────┘  │
│                                            │                │
│                                ┌───────────▼─────────────┐  │
│                                │       State (Zustand)    │  │
│                                │ - pdf-store              │  │
│                                │ - settings-store         │  │
│                                │ - ai-store               │  │
│                                └─────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
pdf-kit/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Entry point
│   │   ├── menu.ts              # Application menu
│   │   ├── services/            # Main process services
│   │   │   ├── connectivity.service.ts
│   │   │   ├── auto-updater.service.ts
│   │   │   └── office-conversion.service.ts
│   │   └── plugins/             # Plugin system
│   │       ├── index.ts
│   │       ├── plugin-loader.ts
│   │       ├── plugin-lifecycle.ts
│   │       └── plugin-settings.ts
│   │
│   ├── preload/                 # Preload scripts
│   │   └── preload.ts           # IPC bridge
│   │
│   ├── renderer/                # React application
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Root component
│   │   ├── components/          # UI components
│   │   │   ├── PDFViewer.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ui/              # Reusable UI components
│   │   │   ├── tools/           # PDF tools components
│   │   │   ├── forms/           # Form components
│   │   │   ├── ai/              # AI components
│   │   │   └── settings/        # Settings components
│   │   ├── store/               # Zustand stores
│   │   │   ├── pdf-store.ts
│   │   │   ├── settings-store.ts
│   │   │   ├── ai-store.ts
│   │   │   ├── favorites-store.ts
│   │   │   ├── collections-store.ts
│   │   │   ├── tags-store.ts
│   │   │   └── search-store.ts
│   │   ├── lib/                 # Utilities
│   │   │   ├── ai/              # AI services
│   │   │   └── pdf/             # PDF utilities
│   │   ├── i18n/                # Internationalization
│   │   │   └── locales/
│   │   │       ├── en.json
│   │   │       └── id.json
│   │   └── styles/              # CSS styles
│   │       └── index.css
│   │
│   └── test/                    # Test files
│       ├── setup.ts
│       └── integration.test.ts
│
├── docs/                        # Documentation
├── tasks/                       # Project management
├── plugins/                     # Plugin directory
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── electron-builder.yml
```

---

## Main Process

### Entry Point (`src/main/main.ts`)

The main process handles:
- Window creation and management
- Native file dialogs
- IPC handlers
- Service initialization
- Application menu

### Services

| Service | Purpose |
|---------|---------|
| `connectivity.service.ts` | Monitor network status |
| `auto-updater.service.ts` | Handle app updates |
| `office-conversion.service.ts` | LibreOffice integration |

### Plugin System

```
src/main/plugins/
├── index.ts           # Exports
├── plugin-loader.ts   # Load plugins from disk
├── plugin-lifecycle.ts # Initialize/shutdown plugins
└── plugin-settings.ts  # Plugin enable/disable state
```

---

## Renderer Process

### React Application

Built with:
- **React 19** with functional components
- **TypeScript** for type safety
- **Vite** for fast development
- **Zustand** for state management

### Component Organization

```
components/
├── PDFViewer.tsx          # Main PDF display
├── Toolbar.tsx            # Top toolbar
├── Sidebar.tsx            # Left sidebar
├── ui/                    # Reusable primitives
│   ├── Button.tsx
│   ├── Dialog.tsx
│   ├── Input.tsx
│   └── ...
├── tools/                 # PDF operation tools
│   ├── SplitTool.tsx
│   ├── MergeTool.tsx
│   ├── CompressTool.tsx
│   └── ...
├── ai/                    # AI features
│   ├── AISidebar.tsx
│   ├── RAGService.tsx
│   └── ...
└── settings/              # Settings panels
    ├── GeneralSettingsTab.tsx
    └── ...
```

### State Management (Zustand)

Each store manages a specific domain:

| Store | Purpose |
|-------|---------|
| `pdf-store.ts` | Current PDF state, pages, zoom |
| `settings-store.ts` | User preferences |
| `ai-store.ts` | AI provider config, chat history |
| `favorites-store.ts` | Starred files |
| `collections-store.ts` | Virtual folders |
| `tags-store.ts` | File labels |
| `search-store.ts` | Search history/filters |

---

## IPC Communication

### Preload Script (`src/preload/preload.ts`)

Bridges main and renderer processes securely:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFileDialog: () => ipcRenderer.invoke('dialog:save'),
  savePdfFile: (path, bytes) => ipcRenderer.invoke('pdf:save', path, bytes),
  
  // Events
  onMenuOpenFile: (callback) => {
    ipcRenderer.on('menu:open-file', callback);
    return () => ipcRenderer.removeListener('menu:open-file', callback);
  },
  
  // ... more methods
});
```

### IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `dialog:save` | R→M | Open save dialog |
| `pdf:save` | R→M | Save PDF to disk |
| `menu:open-file` | M→R | File menu clicked |
| `updater:check` | R→M | Check for updates |
| `plugin:*` | Both | Plugin communication |

---

## PDF Processing

### Libraries Used

| Library | Purpose |
|---------|---------|
| `pdfjs-dist` | PDF rendering |
| `pdf-lib` | PDF manipulation |
| `tesseract.js` | OCR |

### PDF Operations Flow

```
User Action → Component → pdf-lib → Binary Operations → Save
                ↓
           Zustand Store ← State Update
```

---

## AI Integration

### Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  AI Store   │───►│  AI Service │───►│  Provider   │
│  (state)    │    │  (logic)    │    │  (API)      │
└─────────────┘    └─────────────┘    └─────────────┘
                         │
                   ┌─────▼─────┐
                   │  RAG Svc  │
                   │  (embed)  │
                   └───────────┘
```

### Supported Providers

- **OpenAI**: GPT-4, GPT-4o, GPT-4o-mini
- **Anthropic**: Claude 3.5 Sonnet
- **Google**: Gemini 1.5 Pro, Flash

---

## Internationalization

### Structure

```
i18n/
├── index.ts           # i18next setup
└── locales/
    ├── en.json        # English
    └── id.json        # Indonesian
```

### Usage

```tsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <span>{t('common.save')}</span>;
}
```

---

## Testing

### Framework

- **Vitest** for unit/integration tests
- **Testing Library** for component tests
- **jsdom** for DOM simulation

### Test Structure

```
src/
├── renderer/
│   ├── store/
│   │   ├── settings-store.ts
│   │   └── settings-store.test.ts
│   └── lib/
│       └── pdf-utils.test.ts
└── test/
    ├── setup.ts           # Global mocks
    └── integration.test.ts
```

---

## Build Process

### Development

```bash
npm run dev
# Starts Vite dev server + Electron
```

### Production

```bash
npm run build
# 1. Vite builds renderer
# 2. TSC compiles main process

npm run package
# Uses electron-builder for distribution
```

---

## Plugin System

See [Plugin API](PLUGIN_API.md) for details.

### Plugin Structure

```
plugins/
└── my-plugin/
    ├── manifest.json
    └── index.js
```

### Lifecycle

1. **Load**: Read manifest.json
2. **Initialize**: Call plugin's init()
3. **Active**: Plugin can register handlers
4. **Shutdown**: Call plugin's cleanup()

---

## Security Considerations

- **Context Isolation**: Renderer can't access Node.js
- **No Remote Module**: Disabled for security
- **Content Security Policy**: Strict CSP in production
- **Preload Bridge**: Only exposed APIs are accessible
- **No Eval**: Code injection prevented
