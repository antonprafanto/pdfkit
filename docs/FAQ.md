# Frequently Asked Questions (FAQ)

## General Questions

### What is PDF Kit?
PDF Kit is an open-source desktop application for managing PDF documents. It runs completely offline and never sends your documents to external servers.

### Is PDF Kit free?
Yes! PDF Kit is free and open-source under the MIT license.

### What platforms does PDF Kit support?
- Windows 10 and later
- macOS 10.15 (Catalina) and later
- Linux (Ubuntu 20.04 and equivalents)

### Does PDF Kit require an internet connection?
No, PDF Kit works completely offline. Internet is only needed for:
- Downloading updates
- Using AI features (requires API key)

---

## Installation

### How do I install PDF Kit?
Download the installer for your platform from the releases page and run it.

### Where can I download PDF Kit?
Visit our [GitHub Releases](https://github.com/user/pdf-kit/releases) page.

### How do I update PDF Kit?
PDF Kit checks for updates automatically. You can also check manually via Help → Check for Updates.

---

## Features

### Can I edit the text in a PDF?
PDF Kit focuses on document management (split, merge, compress) rather than full text editing. You can:
- Add annotations
- Edit form fields
- Modify metadata

### How do I split a PDF?
1. Open the PDF
2. Click Split in the toolbar
3. Choose your split method
4. Save the resulting files

### Can I merge multiple PDFs?
Yes! Click Merge, add your files, arrange the order, and save.

### What compression quality should I use?
- **Maximum**: For email attachments and web uploads
- **High**: Good balance of size and quality
- **Medium**: When quality matters more
- **Low**: Minimal compression for quality documents

---

## AI Features

### What AI providers are supported?
- OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini 1.5 Pro, Flash)

### Do I need an API key?
Yes, you need your own API key from one of the supported providers.

### Where do I get an API key?
- OpenAI: https://platform.openai.com
- Anthropic: https://console.anthropic.com
- Google: https://makersuite.google.com

### Are my documents sent to AI providers?
Only when you use AI features like Chat with PDF. The text content is sent to generate responses. Your files are never stored on their servers.

### Why isn't the AI responding?
Check:
1. Valid API key in Settings → AI
2. Internet connection is available
3. API key has sufficient credits/quota

---

## Security

### How secure is PDF encryption?
PDF Kit uses AES-256 encryption, which is industry-standard and very secure.

### Can I remove a password from a PDF?
Yes, if you know the password. Open the protected PDF, then go to Security → Remove Password.

### Is my data safe?
Yes! PDF Kit:
- Works offline
- Never uploads your documents
- Stores settings locally

---

## Conversion

### What formats can I convert to PDF?
- Images: PNG, JPEG, GIF, BMP, TIFF
- Office: Word, Excel, PowerPoint (requires LibreOffice)

### Why isn't Office conversion working?
Office to PDF conversion requires LibreOffice to be installed. Download it from https://www.libreoffice.org

### What DPI should I use for PDF to Image?
- **72 DPI**: Screen viewing
- **150 DPI**: General use
- **300 DPI**: Printing
- **600 DPI**: High-quality printing

---

## Performance

### PDF Kit is slow with large files
Try:
1. Close other applications
2. Reduce zoom level
3. Use single page view instead of continuous

### The app uses too much memory
PDF Kit caches rendered pages for smooth navigation. For very large files:
1. Close unused documents
2. Restart the application periodically

---

## Localization

### How do I change the language?
Go to Settings → General and select your preferred language.

### What languages are supported?
- English
- Indonesian

### Can I help translate?
Yes! See our [Contributing Guide](../CONTRIBUTING.md) for translation instructions.

---

## Troubleshooting

### PDF won't open
- Ensure the file is a valid PDF
- Check if the file is password-protected
- Try opening with another PDF reader to verify

### Features are missing
Make sure you're using the latest version. Check Help → Check for Updates.

### How do I report a bug?
Open an issue on our [GitHub page](https://github.com/user/pdf-kit/issues).

---

## Still have questions?

- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Read the [User Manual](USER_MANUAL.md)
- [Open an issue](https://github.com/user/pdf-kit/issues) on GitHub
