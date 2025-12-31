# PDF Kit

<p align="center">
  <img width="512" height="512" alt="PDF Kit Logo" width="120" height="120" src="https://github.com/user-attachments/assets/522212f0-1d73-44b8-a38b-304e470025ec" />
</p>

<p align="center">
  <strong>Modern Open-Source PDF Management Desktop Application</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/electron-33.x-9feaf9.svg" alt="Electron">
  <img src="https://img.shields.io/badge/react-19.x-61dafb.svg" alt="React">
</p>

---

## 🎯 Overview

PDF Kit is a comprehensive, offline-first PDF toolkit built with Electron and React. It provides all the essential PDF manipulation features you need without requiring an internet connection or cloud services.

### Why PDF Kit?

- **🔒 Privacy First**: Your documents never leave your device
- **⚡ Fast & Native**: Built with Electron for native performance
- **🌍 Multi-language**: Supports English and Indonesian
- **🤖 AI-Powered**: Optional AI features for document analysis
- **🔌 Extensible**: Plugin system for custom functionality
- **🆓 Open Source**: MIT licensed, free forever

---

## ✨ Features

### Core PDF Operations
- 📖 **PDF Viewer** - High-quality rendering with zoom, rotation, and navigation
- ✂️ **Split PDF** - Extract pages by range, every N pages, or individual pages
- 🔗 **Merge PDF** - Combine multiple PDFs with drag-and-drop reordering
- 🗜️ **Compress PDF** - Reduce file size with quality presets
- 🔐 **Encrypt PDF** - Password protection with AES-256 encryption
- 📝 **Edit Metadata** - Modify title, author, subject, and keywords

### Advanced Features
- 🔄 **Convert** - PDF to Images, Images to PDF, Office to PDF
- 🔍 **Compare** - Side-by-side document comparison
- ✏️ **Annotations** - Sticky notes on documents
- 📋 **Forms** - Fill and edit PDF forms
- 🔎 **OCR** - Text recognition for scanned documents (via Tesseract.js)

### AI-Powered (Optional)
- 💬 **Chat with PDF** - Ask questions about your documents
- 📊 **Summarization** - Generate document summaries
- 🔍 **Semantic Search** - Find content by meaning, not just keywords

### Organization
- ⭐ **Favorites** - Star important files for quick access
- 📁 **Collections** - Virtual folders to organize documents
- 🏷️ **Tags** - Color-coded labels for categorization
- 🔍 **Advanced Search** - Filter by favorites, collections, and tags

---

## 📦 Installation

### Download

Download the latest release for your platform:

- **Windows**: [PDF-Kit-Setup.exe](https://github.com/antonprafanto/pdfkit/releases/download/v1.0.13/PDF.Kit.Setup.1.0.13.exe)
- **macOS**: coming soon
- **Linux**: coming soon

### Build from Source

```bash
# Clone the repository
git clone https://github.com/user/pdf-kit.git
cd pdf-kit

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

---

## 🚀 Quick Start

1. **Open a PDF**: Click "Open PDF" or drag a file into the window
2. **Navigate**: Use scroll or page controls to browse
3. **Edit**: Access tools from the sidebar:
   - Split, Merge, Compress in the toolbar
   - Annotations via the annotation panel
   - AI features in the AI sidebar (requires API key)
4. **Save**: Click "Save" or use Ctrl+S

For detailed instructions, see the [User Manual](docs/USER_MANUAL.md).

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [User Manual](docs/USER_MANUAL.md) | Complete user guide |
| [Quick Start](docs/QUICK_START.md) | Get started in 5 minutes |
| [Features Guide](docs/FEATURES.md) | Detailed feature documentation |
| [FAQ](docs/FAQ.md) | Frequently asked questions |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture overview |
| [Plugin API](docs/PLUGIN_API.md) | Create custom plugins |
| [Build Guide](docs/BUILD.md) | Build and release process |

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Electron 33.x |
| Frontend | React 19.x, TypeScript |
| Build Tool | Vite 6.x |
| PDF Library | pdf-lib, pdfjs-dist |
| AI Integration | OpenAI, Anthropic, Google Gemini |
| Testing | Vitest |
| Styling | CSS with modern features |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
npm install        # Install dependencies
npm run dev        # Start development server
npm run test       # Run tests
npm run build      # Build for production
```

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [pdf-lib](https://github.com/Hopding/pdf-lib) - PDF manipulation
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) - PDF rendering
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR capabilities
- [Electron](https://www.electronjs.org/) - Desktop framework

---

<p align="center">
  Made with ❤️ by the PDF Kit Contributors
</p>
