# PDF Kit Features Guide

Complete reference for all PDF Kit features and capabilities.

---

## 📖 PDF Viewer

### High-Quality Rendering
- **PDF.js powered** rendering for accurate display
- **Crisp text** at any zoom level
- **Vector graphics** preserved

### Navigation
- Page-by-page or continuous scrolling
- Jump to any page with Go To (Ctrl+G)
- Thumbnail navigation panel
- Keyboard shortcuts for quick navigation

### Zoom Controls
- Preset zoom levels (50%, 75%, 100%, 125%, 150%, 200%)
- Fit to width / Fit to height
- Custom zoom with mouse scroll (Ctrl+Scroll)

### View Modes
| Mode | Description |
|------|-------------|
| Single Page | One page at a time |
| Continuous | Scrollable document |
| Two Page | Side-by-side view |

---

## ✂️ Split PDF

### Split Modes

**1. By Page Range**
- Extract specific pages: `1-5, 10, 15-20`
- Support for comma-separated ranges
- Flexible syntax

**2. Every N Pages**
- Split into chunks of N pages
- Perfect for large documents

**3. Individual Pages**
- Create one PDF per page
- Automatic file naming

### Output Options
- Custom output folder
- Automatic file naming
- Preview before split

---

## 🔗 Merge PDF

### Capabilities
- Combine unlimited PDFs
- Drag-and-drop reordering
- Preview merged result
- Smart file naming

### How to Use
1. Add PDFs via button or drag-and-drop
2. Reorder by dragging
3. Remove unwanted files
4. Merge and save

---

## 🗜️ Compress PDF

### Quality Presets

| Preset | Size Reduction | Image Quality |
|--------|----------------|---------------|
| Maximum | Up to 90% | Lower |
| High | Up to 70% | Good |
| Medium | Up to 50% | Better |
| Low | Up to 30% | Best |

### Compression Techniques
- Image resampling
- Unused object removal
- Stream optimization

---

## 🔐 Security Features

### Encryption
- **AES-256** encryption
- Password protection
- Permission controls

### Permissions
- Printing allowed/denied
- Copying allowed/denied
- Modification allowed/denied

### Watermarking
- Text watermarks
- Position options
- Opacity control

---

## 🔄 Conversion Tools

### PDF to Images
- **Formats**: PNG, JPEG
- **DPI**: 72, 150, 300, 600
- **Quality**: Adjustable for JPEG

### Images to PDF
- Supported: PNG, JPEG, GIF, BMP, TIFF
- Page size options
- Image positioning

### Office to PDF
**Requirements**: LibreOffice installed

Supported formats:
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- PowerPoint (.ppt, .pptx)
- OpenDocument formats

---

## 🔍 Compare Documents

### Side-by-Side View
- Synchronized scrolling
- Page navigation
- Zoom sync

### Use Cases
- Contract revisions
- Document versions
- Before/after comparison

---

## ✏️ Annotations

### Sticky Notes
- Add notes anywhere on page
- Color options
- Resize and move

### Annotation Management
- View all annotations
- Export annotation list
- Delete annotations

---

## 📋 Form Filling

### Supported Fields
- Text fields
- Checkboxes
- Radio buttons
- Dropdown menus
- Signature fields

### Features
- Auto-detect form fields
- Tab navigation
- Save filled forms

---

## 🔎 OCR (Optical Character Recognition)

**Powered by Tesseract.js**

### Capabilities
- Extract text from scanned PDFs
- Multiple language support
- Searchable PDF output

### Languages
- English
- Indonesian
- And many more via Tesseract

---

## 🤖 AI Features

> Requires API key from OpenAI, Anthropic, or Google

### Chat with PDF
- Ask questions about document content
- Get contextual answers
- Follow-up conversations

### Document Summarization
- Automatic summary generation
- Adjustable length
- Key points extraction

### Semantic Search
- Search by meaning
- Find related content
- Intelligent matching

### Supported Providers
| Provider | Models |
|----------|--------|
| OpenAI | GPT-4, GPT-4o, GPT-4o-mini |
| Anthropic | Claude 3.5 Sonnet |
| Google | Gemini 1.5 Pro, Flash |

---

## ⭐ Favorites

### Features
- Star/unstar with one click
- Quick access panel
- Persistent across sessions

### Access
- Favorites sidebar panel
- Filter in advanced search
- Star icon in toolbar

---

## 📁 Collections

### Virtual Folders
- Create custom collections
- Color-coded
- Description support

### Management
- Add files to multiple collections
- Rename and delete collections
- Filter by collection

---

## 🏷️ Tags

### Color-Coded Labels
- Custom tag colors
- Multiple tags per file
- Quick filtering

### Use Cases
- Status (Review, Approved, Pending)
- Categories (Work, Personal, Archive)
- Priority (High, Medium, Low)

---

## 🔍 Advanced Search

### Filter Options
- By favorites status
- By collection membership
- By assigned tags
- By file name

### History
- Recent searches saved
- Quick re-search
- Clear history option

---

## ⚙️ Settings

### General
- Language (English/Indonesian)
- Default save location
- Startup behavior

### Appearance
- Theme (Light/Dark/System)
- High contrast mode
- Font settings

### PDF Defaults
- Default zoom
- Default view mode
- Remember last position

### AI Settings
- Provider selection
- API key management
- Model selection

### Accessibility
- High contrast mode
- Reduced motion
- Screen reader support

---

## 🔌 Plugin System

### Capabilities
- Extend functionality
- Custom tools
- Event hooks

### Plugin Types
- Tool plugins
- Menu plugins
- Viewer plugins

See [Plugin API](PLUGIN_API.md) for development guide.

---

## 🌍 Internationalization

### Supported Languages
- 🇺🇸 English
- 🇮🇩 Indonesian

### Language Features
- Complete UI translation
- Localized dates/times
- Right-to-left ready

---

## 🔄 Auto-Update

### Features
- Automatic update checks
- Download progress
- Changelog display
- Install on restart

### Settings
- Enable/disable auto-check
- Manual check option
- Update history
