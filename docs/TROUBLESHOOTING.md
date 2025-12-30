# Troubleshooting Guide

Common issues and their solutions.

---

## Installation Issues

### Windows: "Windows protected your PC" message

**Solution**: Click "More info" → "Run anyway". This appears because the app isn't signed with a verified certificate yet.

### macOS: "App can't be opened because it is from an unidentified developer"

**Solution**:
1. Right-click the app
2. Select "Open"
3. Click "Open" in the dialog

Or go to System Preferences → Security & Privacy → "Open Anyway"

### Linux: "Permission denied" when running AppImage

**Solution**:
```bash
chmod +x PDF-Kit.AppImage
./PDF-Kit.AppImage
```

---

## PDF Opening Issues

### PDF won't open

**Possible causes and solutions**:

1. **Corrupted PDF**
   - Try opening in another PDF viewer
   - If it doesn't open there either, the file is damaged

2. **Password protected**
   - Enter the password when prompted
   - Contact the document owner if you don't have it

3. **Unsupported PDF version**
   - Very old PDFs might have compatibility issues
   - Try re-saving with another PDF tool

### "Failed to load PDF" error

**Solutions**:
1. Close and reopen the application
2. Check if the file still exists at the path
3. Ensure the file isn't open in another application
4. Try copying the file to a different location

---

## Performance Issues

### Application is slow

**Solutions**:

1. **Close unused documents**
   - Each open PDF uses memory
   
2. **Reduce zoom level**
   - Higher zoom = more memory usage

3. **Use single page view**
   - Continuous mode renders more pages

4. **Restart the application**
   - Clears accumulated memory

### High memory usage

This is normal for large PDFs. If excessive:

1. Close tabs you're not using
2. Restart PDF Kit periodically
3. Consider increasing system RAM

### Slow PDF rendering

**Potential fixes**:
1. Disable smooth scrolling in settings
2. Lower the rendering quality
3. Enable reduced motion mode

---

## AI Features Issues

### AI not responding

**Check these**:

1. **API Key**
   - Settings → AI → Verify key is entered
   - Key hasn't expired
   - Key has sufficient credits

2. **Internet connection**
   - AI features require internet
   - Check your network connection

3. **Provider status**
   - Check if the AI provider is experiencing outages

### "Invalid API Key" error

**Solutions**:
1. Verify the key is copied correctly (no extra spaces)
2. Ensure you're using the right provider
3. Check if the key has the necessary permissions
4. Generate a new API key

### AI responses are slow

**This can be due to**:
- Large documents take longer to process
- Provider API latency
- Network speed

**Try**:
- Shorter, more specific questions
- Smaller documents
- Different AI model (mini/flash versions are faster)

---

## Conversion Issues

### Office to PDF conversion fails

**Requirement**: LibreOffice must be installed

**Solutions**:
1. Download LibreOffice from https://www.libreoffice.org
2. Make sure it's in your system PATH
3. Restart PDF Kit after installing

### Images to PDF produces blank pages

**Check**:
1. Image files aren't corrupted
2. Supported format (PNG, JPEG, GIF, BMP, TIFF)
3. Images have valid dimensions

### PDF to Images quality is low

**Solution**: Increase DPI setting
- 150 DPI for screen viewing
- 300 DPI for printing
- 600 DPI for high-quality needs

---

## Saving Issues

### Can't save file

**Possible causes**:

1. **Permission denied**
   - Save to a different folder
   - Run as administrator (Windows)

2. **Disk full**
   - Free up space
   - Save to a different drive

3. **File is read-only**
   - Check file properties
   - Copy to a writable location

### File saves but changes aren't visible

**Solution**:
1. Close and reopen the file
2. Make sure you're viewing the saved file, not the original

---

## Plugin Issues

### Plugin not loading

**Check**:
1. Plugin is in the correct folder
2. manifest.json is valid
3. Plugin is enabled in settings
4. Check console for error messages

### Plugin causing crashes

**Solution**:
1. Disable the plugin in settings
2. Remove plugin folder from plugins directory
3. Restart PDF Kit

---

## Update Issues

### Update download fails

**Solutions**:
1. Check internet connection
2. Try manual download from GitHub releases
3. Temporarily disable firewall/antivirus

### Update doesn't install

**Solutions**:
1. Run as administrator
2. Close all PDF Kit instances
3. Manually download and install

---

## Data & Settings Issues

### Settings not saving

**Possible causes**:
1. No write permission to settings folder
2. Disk full
3. Antivirus blocking

**Solution**: Run as administrator or check folder permissions

### Lost favorites/collections

Settings are stored in:
- Windows: `%APPDATA%/pdf-kit`
- macOS: `~/Library/Application Support/pdf-kit`
- Linux: `~/.config/pdf-kit`

Backup this folder to preserve settings.

### Reset to default settings

Delete the settings folder (see paths above) and restart the application.

---

## Error Messages

### "Failed to initialize application"

**Solutions**:
1. Reinstall the application
2. Delete settings folder and restart
3. Check for conflicting software

### "Renderer process crashed"

**Solutions**:
1. Restart the application
2. Open fewer documents
3. Update graphics drivers

### "Out of memory"

**Solutions**:
1. Close other applications
2. Work with smaller PDFs
3. Split large PDFs into smaller parts

---

## Getting More Help

If your issue isn't listed here:

1. **Search existing issues**: [GitHub Issues](https://github.com/user/pdf-kit/issues)
2. **Open a new issue** with:
   - Your operating system and version
   - PDF Kit version
   - Steps to reproduce the problem
   - Error messages (if any)
   - Screenshots (if helpful)

---

## Diagnostic Information

To gather system info for bug reports:

1. Go to Help → About
2. Click "Copy System Info"
3. Include this in your bug report
