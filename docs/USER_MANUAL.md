# PDF Kit User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Main Interface](#main-interface)
3. [Opening PDFs](#opening-pdfs)
4. [Viewing PDFs](#viewing-pdfs)
5. [Editing PDFs](#editing-pdfs)
6. [Converting Documents](#converting-documents)
7. [Security Features](#security-features)
8. [AI Features](#ai-features)
9. [Organization Features](#organization-features)
10. [Settings & Preferences](#settings--preferences)
11. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### System Requirements

| Platform | Minimum Requirements |
|----------|---------------------|
| Windows | Windows 11 or later, 4GB RAM |
| macOS | macOS 10.15 (Catalina) or later |
| Linux | Ubuntu 20.04 or equivalent |

### Installation

1. Download the installer for your platform from the [releases page](https://github.com/user/pdf-kit/releases)
2. Run the installer and follow the prompts
3. Launch PDF Kit from your applications menu

---

## Main Interface

The PDF Kit interface consists of:

- **Toolbar** (top): Quick access to common actions
- **Sidebar** (left): Tools and features panel
- **Document Area** (center): PDF viewing and editing
- **Status Bar** (bottom): Page info and zoom controls

---

## Opening PDFs

### Methods to Open PDFs

1. **File Menu**: File → Open (Ctrl+O)
2. **Drag & Drop**: Drag a PDF file into the window
3. **Recent Files**: Access recently opened files from File menu
4. **Double-click**: Set PDF Kit as default PDF application

### Supported Formats

- PDF (.pdf)
- Images can be converted to PDF

---

## Viewing PDFs

### Navigation

| Action | Shortcut |
|--------|----------|
| Next Page | Ctrl+→ or Page Down |
| Previous Page | Ctrl+← or Page Up |
| First Page | Ctrl+Home |
| Last Page | Ctrl+End |
| Go to Page | Ctrl+G |

### Zoom Controls

| Action | Shortcut |
|--------|----------|
| Zoom In | Ctrl++ or Ctrl+Scroll Up |
| Zoom Out | Ctrl+- or Ctrl+Scroll Down |
| Fit to Width | Ctrl+1 |
| Fit to Height | Ctrl+2 |
| Actual Size | Ctrl+0 |

### View Modes

- **Single Page**: View one page at a time
- **Continuous**: Scroll through all pages
- **Two Page**: Side-by-side page view

---

## Editing PDFs

### Split PDF

Split a PDF into multiple files:

1. Open the PDF you want to split
2. Click **Split** in the toolbar
3. Choose split mode:
   - **By Range**: Specify page ranges (e.g., "1-5, 10-15")
   - **Every N Pages**: Split every N pages
   - **Individual Pages**: Create one file per page
4. Click **Split** and choose save location

### Merge PDFs

Combine multiple PDFs into one:

1. Click **Merge** in the toolbar
2. Add PDFs using **Add Files** button
3. Drag to reorder files
4. Click **Merge** and save

### Compress PDF

Reduce PDF file size:

1. Open the PDF
2. Click **Compress** in the toolbar
3. Choose quality level:
   - **Maximum**: Smallest file, lower quality
   - **High**: Good balance
   - **Medium**: Better quality
   - **Low**: Minimal compression
4. Click **Compress** and save

### Edit Metadata

Modify document properties:

1. Open the PDF
2. Go to File → Properties (Ctrl+I)
3. Edit title, author, subject, keywords
4. Click **Save**

---

## Converting Documents

### PDF to Images

1. Open the PDF
2. Go to Convert → PDF to Images
3. Select format (PNG/JPG)
4. Choose quality and DPI
5. Click **Convert**

### Images to PDF

1. Go to Convert → Images to PDF
2. Add images
3. Arrange order
4. Click **Create PDF**

### Office to PDF (if LibreOffice installed)

1. Go to Convert → Office to PDF
2. Select Word, Excel, or PowerPoint file
3. Click **Convert**

---

## Security Features

### Password Protection

1. Open the PDF
2. Go to Security → Encrypt
3. Set password and permissions
4. Save the encrypted file

### Remove Password

1. Open the encrypted PDF (enter password)
2. Go to Security → Remove Password
3. Save as new file

---

## AI Features

> **Note**: AI features require an API key from OpenAI, Anthropic, or Google.

### Setup

1. Go to Settings → AI
2. Select provider (OpenAI, Anthropic, or Gemini)
3. Enter your API key
4. Select model

### Chat with PDF

1. Open a PDF
2. Click the AI icon in the sidebar
3. Type your question
4. The AI will analyze the document and respond

### Document Summary

1. Open a PDF
2. Click **Summarize** in the AI panel
3. Choose summary length
4. View the generated summary

---

## Organization Features

### Favorites

Star important files for quick access:
- Click the star icon on any file
- Access favorites from the Favorites panel

### Collections

Create virtual folders:
1. Go to Collections panel
2. Click **New Collection**
3. Name and color your collection
4. Add files by right-clicking

### Tags

Add color-coded labels:
1. Go to Tags panel
2. Create tags with custom colors
3. Assign tags to files

### Advanced Search

Filter files by:
- Favorites status
- Collections
- Tags
- File name

---

## Settings & Preferences

Access settings via File → Settings or Ctrl+,

### General
- Language (English/Indonesian)
- Default save location
- Startup behavior

### Appearance
- Theme (Light/Dark/System)
- Font settings

### PDF Defaults
- Default zoom level
- View mode

### AI Settings
- API provider and key
- Model selection

### Accessibility
- High contrast mode
- Reduced motion

---

## Keyboard Shortcuts

### File Operations

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Open | Ctrl+O | ⌘O |
| Save | Ctrl+S | ⌘S |
| Save As | Ctrl+Shift+S | ⌘⇧S |
| Print | Ctrl+P | ⌘P |
| Close | Ctrl+W | ⌘W |

### Navigation

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Next Page | Ctrl+→ | ⌘→ |
| Previous Page | Ctrl+← | ⌘← |
| First Page | Ctrl+Home | ⌘↑ |
| Last Page | Ctrl+End | ⌘↓ |

### View

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Zoom In | Ctrl++ | ⌘+ |
| Zoom Out | Ctrl+- | ⌘- |
| Reset Zoom | Ctrl+0 | ⌘0 |
| Fullscreen | F11 | ⌘⇧F |

---

## Need Help?

- [FAQ](FAQ.md) - Frequently asked questions
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [GitHub Issues](https://github.com/user/pdf-kit/issues) - Report bugs
