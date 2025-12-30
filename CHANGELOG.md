# Changelog

All notable changes to PDF Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-31

🎉 **First Stable Release!**

### Added

#### Core Features
- PDF Viewer with high-quality rendering (pdfjs-dist)
- Page navigation with keyboard shortcuts
- Zoom controls (fit width, fit height, custom)
- View modes (single page, continuous, two-page)

#### PDF Operations
- **Split PDF**: By range, every N pages, individual pages
- **Merge PDF**: Combine multiple PDFs with reordering
- **Compress PDF**: Multiple quality presets
- **Encrypt PDF**: AES-256 password protection
- **Metadata Editor**: Edit title, author, subject, keywords

#### Conversion Tools
- PDF to Images (PNG, JPEG)
- Images to PDF
- Office to PDF (requires LibreOffice)

#### Annotations
- Sticky notes with color options
- Annotation management panel

#### Form Filling
- Text fields, checkboxes, radio buttons
- Dropdown menus, signature fields

#### AI Features (Optional)
- Chat with PDF (RAG-based)
- Document summarization
- Semantic search
- Support for OpenAI, Anthropic, Google Gemini

#### Organization
- Favorites (starred files)
- Collections (virtual folders)
- Tags (color-coded labels)
- Advanced search with filters

#### Settings
- Language support (English, Indonesian)
- Theme options (Light, Dark, System)
- Accessibility features (high contrast, reduced motion)
- Customizable keyboard shortcuts

#### Plugin System
- Plugin loader and lifecycle management
- Plugin API for extensions
- Plugin settings panel

#### Auto-Update
- Automatic update checks
- Download progress indicator
- Changelog viewer
- Install on restart

### Technical
- Electron 33.x
- React 19.x with TypeScript
- Vite 6.x build system
- Zustand state management
- Vitest testing framework (72 tests)

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2025-12-30 | Initial release |

---

## Upcoming

### Planned for v0.2.0
- Performance optimizations
- Additional language support
- Enhanced annotation features
- Digital signature support

---

[Unreleased]: https://github.com/user/pdf-kit/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/user/pdf-kit/releases/tag/v0.1.0
