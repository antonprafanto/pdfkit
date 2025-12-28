# PDF Kit

Modern open-source PDF management desktop application with AI-powered features.

## 🚀 Features

### Current (v0.1.0 - Development)
- ✅ Cross-platform desktop app (Windows, macOS, Linux)
- ✅ Always-online connectivity monitoring
- ✅ Modern UI with dark/light theme support
- 🚧 PDF Viewer (Coming soon)
- 🚧 PDF Editing Tools (Coming soon)
- 🚧 AI-Powered Features with BYOK (Coming soon)

### Planned Features
- 📄 **PDF Viewer**: View, zoom, rotate, search in documents
- ✂️ **PDF Editing**: Merge, split, rotate, reorder pages
- 🔄 **Conversion**: PDF ↔️ Images, Office documents
- 🔒 **Security**: Encryption, watermarking, digital signatures
- 📝 **Annotations**: Highlights, comments, stamps
- 🤖 **AI Features**: Chat with PDF, summarization, translation (BYOK)
- 🔍 **OCR**: Text extraction from scanned documents
- 🔌 **Plugin System**: Extend functionality with community plugins

## 🛠️ Tech Stack

- **Electron 28+** - Desktop framework
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **PDF.js** - PDF rendering
- **pdf-lib** - PDF manipulation
- **LangChain.js** - AI integration

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pdf-kit.git
cd pdf-kit
```

2. Install dependencies:
```bash
npm install
```

3. Run development mode:
```bash
npm run dev
```

### Build

Build for your platform:
```bash
npm run build
npm run package
```

Platform-specific builds:
```bash
npm run package:win   # Windows
npm run package:mac   # macOS
npm run package:linux # Linux
```

## 🗂️ Project Structure

```
pdf-kit/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts
│   │   ├── menu.ts
│   │   └── services/   # Background services
│   ├── renderer/       # React frontend
│   │   ├── components/
│   │   ├── views/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── styles/
│   ├── preload/        # IPC bridge
│   └── shared/         # Shared utilities
├── public/             # Static assets
├── build/              # Build resources (icons, etc)
├── tests/              # Test files
└── tasks/              # Development tasks
```

## 🧪 Testing

```bash
npm run test        # Run unit tests
npm run test:ui     # Run tests with UI
npm run lint        # Lint code
npm run format      # Format code
```

## 📝 Development Workflow

See [tasks/todo.md](tasks/todo.md) for the complete development roadmap and progress tracking.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation
- [Electron](https://www.electronjs.org/) for the desktop framework
- [Stirling PDF](https://stirling.com/) for feature inspiration

## 📧 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Issues: [GitHub Issues](https://github.com/yourusername/pdf-kit/issues)

---

**Status**: 🚧 In Development (v0.1.0)

Made with ❤️ by the PDF Kit team
