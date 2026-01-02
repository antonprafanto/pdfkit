# 🎉 PDF Kit v1.0.14

## ✨ New Features

### Welcome Guide Reset Button
- Added **"Show Welcome Guide"** button in Settings → General
- Users can now re-display the onboarding dialog anytime
- Helps new users rediscover features
- Full internationalization support (English & Indonesian)

### Enhanced Print UX
- **Better notifications** during print process
- **2-second delay** before opening browser (gives users time to read notifications)
- **No auto-close toasts** - users control when to dismiss notifications
- **Full i18n support** for all print-related messages

## 🔧 Improvements

### Print System
- Uses Microsoft Edge explicit path to prevent infinite loop
- Clear feedback when preparing PDF for printing
- Success notifications with instructions
- Better error handling and messages

### Internationalization (i18n)
- Fixed all hardcoded text in ribbon toolbar
- Tab labels now follow language setting (Home/Beranda, Edit, Page/Halaman, Tools/Alat, View/Tampilan)
- Rotation buttons now use i18n (Rotate Left/Putar Kiri, Rotate Right/Putar Kanan)
- Print notifications follow language setting
- Settings dialog fully localized

## 🐛 Bug Fixes

- Fixed mixed language issue throughout the app
- Fixed infinite loop when PDF Kit is set as default PDF app
- Fixed toast notifications auto-closing too fast
- Fixed hardcoded Indonesian text in English mode
- Fixed ribbon toolbar not following language settings

## 📝 Technical Details

**Changed Files:**
- `src/renderer/components/settings/GeneralSettingsTab.tsx` - Added Welcome Guide reset
- `src/renderer/i18n/locales/en.json` - Added translations for new features
- `src/renderer/i18n/locales/id.json` - Added Indonesian translations
- `src/main/main.ts` - Improved print handler with explicit Edge path
- `src/renderer/components/PDFViewer.tsx` - Enhanced print notifications
- `src/renderer/components/RibbonToolbar.tsx` - Fixed hardcoded text
- `src/main/menu.ts` - Custom print handler integration
- `src/preload/preload.ts` - IPC handlers for print

**User Experience:**
- Welcome dialog accessible anytime via Settings
- Print process has clear, non-intrusive notifications
- Users have time to read and understand notifications
- All text consistently follows language preference
- Professional UX with smooth feedback

## 🚀 Installation

Download the appropriate installer for your platform:
- **Windows:** `PDF-Kit-Setup-1.0.14.exe`
- **macOS:** `PDF-Kit-1.0.14.dmg`
- **Linux:** `PDF-Kit-1.0.14.AppImage`

## 🙏 Credits

Built with ❤️ by the PDF Kit team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

---

**Full Changelog**: https://github.com/antonprafanto/pdfkit/compare/v1.0.13...v1.0.14
