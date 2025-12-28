# 📄 PDF Kit

**Modern open-source PDF management desktop application with comprehensive editing, security, and form features.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Electron](https://img.shields.io/badge/Electron-28+-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 Overview

PDF Kit is a powerful, cross-platform desktop application for PDF management. Built with Electron and React, it provides a modern interface for viewing, editing, securing, and creating interactive PDF forms.

**Current Version**: v0.1.0 (Development)
**Status**: ✅ Core Features Complete

---

## ✨ Features

### 📖 PDF Viewer (Complete)
- ✅ **3 View Modes**: Single page, Continuous scroll, Facing pages (book view)
- ✅ **Advanced Navigation**: Thumbnails sidebar, page jumps, keyboard shortcuts
- ✅ **Zoom Controls**: Manual zoom (25%-500%), Fit to width, Fit to page
- ✅ **Rotation**: Rotate pages clockwise/counter-clockwise (90° increments)
- ✅ **Search**: Full-text search with visual highlighting on canvas
- ✅ **Metadata Viewer**: Display complete PDF properties
- ✅ **Recent Files**: Quick access to recently opened PDFs
- ✅ **Drag & Drop**: Open PDFs by dragging into the window
- ✅ **Keyboard Shortcuts**: 12+ shortcuts for navigation, zoom, rotation, search

### ✂️ PDF Editing (Complete)
- ✅ **Merge PDFs**: Combine multiple PDF files with reordering
- ✅ **Split PDFs**: Split by page ranges with multi-range support
- ✅ **Delete Pages**: Remove selected pages with grid selection
- ✅ **Rotate Pages**: Rotate individual or multiple pages (90°, 180°, 270°)
- ✅ **Reorder Pages**: Drag & drop page reordering with HTML5 API
- ✅ **Extract Pages**: Extract selected pages to new PDF
- ✅ **Duplicate Pages**: Duplicate single page with insert position
- ✅ **Unsaved Changes Warning**: Prevent accidental data loss

### 🔄 Conversion Tools (Complete)
- ✅ **PDF to Images**: Export pages to PNG, JPG, WEBP with quality settings
- ✅ **Images to PDF**: Convert multiple images to PDF with ordering
- ✅ **Office to PDF**: Convert Word, Excel files via LibreOffice headless
- ✅ **Batch Export**: Export all pages or selected ranges
- ✅ **Image Ordering**: Reorder images before conversion

### 🔒 Security Features (Complete)
- ✅ **Encryption**: Password protection with AES-256 encryption
- ✅ **Permission Settings**: Control print, copy, edit restrictions
- ✅ **Bulk Encryption**: Encrypt multiple PDFs at once
- ✅ **Watermarking**: Add text/image watermarks with positioning & opacity
- ✅ **Watermark Templates**: Save and reuse watermark presets
- ✅ **Digital Signatures**: Sign PDFs with P12/PFX certificates
- ✅ **Signature Viewer**: View and verify existing signatures

### 📝 Annotations (Complete)
- ✅ **Text Comments**: Click-to-place sticky notes with editable content
- ✅ **Drawing Tools**: Pen, rectangle, circle, line, arrow
- ✅ **Stamps**: Pre-made stamps (Approved, Rejected, Draft, Confidential, etc.)
- ✅ **Annotation List**: Sidebar with all annotations grouped by page
- ✅ **Delete/Edit**: Per-annotation delete and note editing
- ✅ **Export/Import**: Save annotations to JSON for sharing
- ✅ **Multi-view Support**: Works in all view modes (single, continuous, facing)

### 📋 Forms & Templates (Complete) ⭐ NEW!
- ✅ **Form Detection**: Auto-detect interactive AcroForm fields
- ✅ **Form Filling**: Fill text, checkbox, radio, dropdown fields
- ✅ **Form Data Import/Export**: Save and load form data as JSON
- ✅ **Manual Field Creation**: Create fields on static PDFs
- ✅ **Field Types**: Text (single/multiline), Checkbox, Radio groups, Dropdowns
- ✅ **Field Properties**: Name, required, read-only, default values, validation
- ✅ **Save as Template**: Export PDF with embedded interactive fields
- ✅ **Cross-Software Compatibility**: Fields work in Adobe Reader, Chrome, Edge, Foxit
- ✅ **Click-to-Place**: Visual field editor with crosshair cursor

### 🌐 Connectivity & System
- ✅ **Always-Online Monitoring**: Real-time connectivity status
- ✅ **Offline Warning**: Visual indicators when offline
- ✅ **Cross-Platform**: Windows, macOS, Linux support
- ✅ **Dark/Light Theme**: CSS variables ready for theme toggle
- ✅ **Responsive Layout**: Adapts to different window sizes

---

## 🛠️ Tech Stack

### Core Technologies
- **Electron 28+** - Desktop application framework
- **React 18** - UI library with hooks
- **TypeScript 5** - Type safety and developer experience
- **Vite 5** - Fast build tool with HMR
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable UI components

### PDF Processing
- **PDF.js** - Mozilla's PDF rendering engine
- **pdf-lib** - PDF manipulation and creation
- **coherentpdf.js** - Advanced PDF operations (encryption)

### State Management & Utils
- **Zustand** - Lightweight state management
- **Sharp** - Image processing for conversions
- **Axios** - HTTP client for connectivity checks

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- **LibreOffice** (optional, for Office document conversion)

### Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/antonprafanto/pdfkit.git
cd pdfkit
```

2. **Install dependencies**:
```bash
npm install
```

3. **Run in development mode**:
```bash
npm run dev
```

The app will launch with hot-reload enabled for rapid development.

### Production Build

**Build for current platform**:
```bash
npm run build       # Build renderer + main process
npm run package     # Package for current OS
```

**Platform-specific builds**:
```bash
npm run package:win     # Windows installer
npm run package:mac     # macOS DMG
npm run package:linux   # Linux AppImage/deb/rpm
```

**Build outputs**:
- Windows: `.exe` installer
- macOS: `.dmg` disk image
- Linux: `.AppImage`, `.deb`, `.rpm`

---

## 🗂️ Project Structure

```
pdf-kit/
├── src/
│   ├── main/                   # Electron main process
│   │   ├── main.ts            # App entry point
│   │   ├── menu.ts            # Application menu
│   │   └── services/
│   │       ├── connectivity.service.ts
│   │       └── office-conversion.service.ts
│   ├── renderer/               # React application
│   │   ├── components/
│   │   │   ├── forms/         # ⭐ Form components (NEW)
│   │   │   ├── annotations/   # Annotation tools
│   │   │   ├── editing/       # PDF editing dialogs
│   │   │   ├── security/      # Security features
│   │   │   ├── conversion/    # Conversion tools
│   │   │   └── ui/            # Reusable UI components
│   │   ├── lib/               # Services & utilities
│   │   │   ├── pdf-service.ts
│   │   │   ├── pdf-forms.service.ts      # ⭐ NEW
│   │   │   ├── pdf-manipulation.service.ts
│   │   │   ├── security.service.ts
│   │   │   └── ...
│   │   ├── store/             # Zustand stores
│   │   │   ├── pdf-store.ts
│   │   │   ├── forms-store.ts            # ⭐ NEW
│   │   │   ├── annotation-store.ts
│   │   │   └── editing-store.ts
│   │   ├── hooks/             # Custom React hooks
│   │   └── styles/            # Global styles
│   ├── preload/               # IPC bridge (secure)
│   │   └── preload.ts
│   └── shared/                # Shared types & utils
│       ├── types/
│       └── utils/
├── public/                     # Static assets
├── tasks/                      # Development docs
│   ├── todo.md                # Complete roadmap
│   ├── how-to-create-form-fields.md
│   └── IMPLEMENTATION_SUMMARY_*.md
├── .claude/                    # Claude Code config
├── package.json
├── tsconfig.json              # TypeScript configs
├── vite.config.ts             # Vite configuration
└── tailwind.config.js         # Tailwind config
```

---

## 🚀 Usage Examples

### Opening a PDF
- **File menu**: File → Open
- **Drag & drop**: Drag PDF file into window
- **Recent files**: File → Recent Files
- **Keyboard**: `Ctrl+O` (Windows/Linux) or `Cmd+O` (macOS)

### Creating Interactive PDF Forms

**For static PDFs (image-based forms)**:

1. Open your static PDF (e.g., university form, application form)
2. Click **Forms Mode** button (green document icon)
3. Click **"Create New Fields"** (purple button)
4. Click on PDF where you want to add fields
5. Configure field properties (name, type, required, etc.)
6. Repeat for all fields
7. Click **"Exit Edit Mode"**
8. Click **"Save PDF with Fields"** (indigo button) ⭐ NEW!
9. Save the template
10. Open in Adobe Reader / Chrome - fields are now interactive! ✨

**Supported field types**:
- Text (single-line, multi-line, with validation)
- Checkbox (single or multiple)
- Radio buttons (grouped with mutual exclusion)
- Dropdown (with custom options)

**The saved PDF**:
- ✅ Contains embedded AcroForm fields
- ✅ Works in all PDF readers (Adobe, Chrome, Edge, Foxit)
- ✅ Fields are fully interactive
- ✅ Can be filled, saved, and shared
- ✅ Reusable as a template

### Merging PDFs
1. Open any PDF
2. Click **PDF Tools** → **Merge**
3. Select multiple PDF files
4. Reorder if needed (drag & drop)
5. Click **Merge**
6. Save the merged PDF

### Adding Watermarks
1. Open PDF
2. Click **Security** → **Add Watermark**
3. Choose text or image watermark
4. Configure position, opacity, rotation
5. Preview and apply
6. Save watermarked PDF

---

## ⌨️ Keyboard Shortcuts

### Navigation
- `←` / `→` / `PageUp` / `PageDown` / `Space` - Navigate pages
- `Home` - First page
- `End` - Last page

### Zoom
- `Ctrl +` - Zoom in
- `Ctrl -` - Zoom out
- `Ctrl 0` - Reset zoom (100%)
- `Ctrl 1` - Fit to width
- `Ctrl 2` - Fit to page

### Rotation
- `Ctrl R` - Rotate counter-clockwise
- `Ctrl Shift R` - Rotate clockwise

### Other
- `Ctrl F` - Toggle search bar
- `Ctrl O` - Open file
- `Ctrl W` - Close document

*Note: Use `Cmd` instead of `Ctrl` on macOS*

---

## 🧪 Development

### Code Quality
```bash
npm run lint          # ESLint
npm run lint:fix      # Auto-fix linting issues
npm run format        # Prettier formatting
npm run type-check    # TypeScript type checking
```

### Testing
```bash
npm run test          # Run tests (when implemented)
```

### Build Analysis
```bash
npm run build         # Check build output and bundle size
```

---

## 🎨 Customization

### Theme
Theme variables are defined in `src/renderer/styles/index.css`. Toggle functionality can be added by implementing theme switcher component.

### Adding Features
1. Create component in appropriate folder (`src/renderer/components/`)
2. Add service in `src/renderer/lib/` if needed
3. Add Zustand store in `src/renderer/store/` for state
4. Add IPC handlers in `src/main/main.ts` and `src/preload/preload.ts`
5. Update types in `src/shared/types/`

---

## 📚 Documentation

- **[Development Roadmap](tasks/todo.md)** - Complete feature list and progress
- **[Form Creation Guide](tasks/how-to-create-form-fields.md)** - Step-by-step form field creation
- **[Implementation Summary](tasks/IMPLEMENTATION_SUMMARY_save-template.md)** - Latest feature details
- **[CLAUDE.md](CLAUDE.md)** - Development workflow instructions

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Workflow
- Follow existing code style (ESLint + Prettier)
- Add TypeScript types for all new code
- Test thoroughly on multiple platforms
- Update documentation for new features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering engine by Mozilla
- [pdf-lib](https://pdf-lib.js.org/) - PDF creation and manipulation
- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [React](https://reactjs.org/) - UI library
- [Stirling PDF](https://github.com/Stirling-Tools/Stirling-PDF) - Feature inspiration
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

## 📧 Contact & Support

- **GitHub**: [@antonprafanto](https://github.com/antonprafanto)
- **Repository**: [pdfkit](https://github.com/antonprafanto/pdfkit)
- **Issues**: [GitHub Issues](https://github.com/antonprafanto/pdfkit/issues)

---

## 🗺️ Roadmap

### ✅ Completed (v0.1.0)
- Core PDF Viewer with 3 view modes
- PDF Editing Tools (merge, split, rotate, reorder, extract, duplicate)
- Image Conversion (PDF ↔️ Images)
- Office Document Conversion (Word, Excel → PDF)
- Security Features (encryption, watermarking, signatures)
- Annotations System
- **Forms & Templates** (detect, fill, create, save as template)

### 🚧 In Progress
- UI/UX Polish
- Performance optimizations
- Comprehensive testing

### 📋 Planned (Future Versions)
- **AI-Powered Features** (v0.2.0)
  - Chat with PDF (RAG)
  - Document summarization
  - Translation
  - Smart categorization
  - BYOK (Bring Your Own Key) support

- **Advanced Features** (v0.3.0)
  - OCR text extraction (Tesseract.js)
  - PDF comparison tool
  - Batch operations
  - Plugin system
  - Cloud sync (optional)

- **Internationalization** (v0.4.0)
  - Multi-language support (i18next)
  - RTL language support
  - Accessibility improvements

- **Auto-Update System** (v0.5.0)
  - Automatic update checking
  - Background downloads
  - Changelog viewer

---

## 📊 Project Statistics

- **Lines of Code**: ~20,000+
- **Components**: 70+
- **Services**: 10+
- **Features**: 50+ implemented
- **Supported Platforms**: Windows, macOS, Linux
- **Build Time**: ~10 seconds
- **Bundle Size**: ~1.2 MB (minified)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ by Anton Prafanto**

**Powered by Claude Code** 🤖

---

*Last Updated: December 28, 2025*
