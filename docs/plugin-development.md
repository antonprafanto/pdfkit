# PDF Kit Plugin Development Guide

This guide explains how to create plugins for PDF Kit.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Structure](#plugin-structure)
3. [Manifest Specification](#manifest-specification)
4. [Plugin API Reference](#plugin-api-reference)
5. [Permissions](#permissions)
6. [Best Practices](#best-practices)
7. [Publishing](#publishing)

---

## Getting Started

### Prerequisites

- Basic JavaScript knowledge
- PDF Kit installed on your system

### Quick Start

1. Create a new folder in PDF Kit's plugins directory
2. Add a `manifest.json` file with plugin metadata
3. Create your `index.js` entry point
4. Enable your plugin in the Plugin Manager

### Minimal Example

**manifest.json:**
```json
{
  "id": "com.yourname.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My first PDF Kit plugin",
  "author": "Your Name",
  "main": "index.js",
  "permissions": ["notifications"]
}
```

**index.js:**
```javascript
module.exports.activate = function(api) {
  api.showNotification('My plugin is active!', 'success');
};

module.exports.deactivate = function() {
  console.log('Plugin deactivated');
};
```

---

## Plugin Structure

```
my-plugin/
├── manifest.json     # Required: Plugin metadata
├── index.js          # Required: Entry point (or as specified in manifest)
├── README.md         # Recommended: Plugin documentation
├── LICENSE           # Recommended: License file
└── lib/              # Optional: Additional modules
    └── helpers.js
```

---

## Manifest Specification

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (reverse domain notation recommended) |
| `name` | string | Display name |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `description` | string | Short description |
| `author` | string | Author name |
| `main` | string | Entry point file path |
| `permissions` | string[] | Required permissions |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `homepage` | string | Plugin website URL |
| `license` | string | License identifier (e.g., "MIT") |
| `minAppVersion` | string | Minimum PDF Kit version |
| `icon` | string | Icon file path |
| `categories` | string[] | Plugin categories |
| `contributes` | object | Declarative contributions |

### Categories

- `editing` - Document editing features
- `conversion` - Format conversion
- `security` - Security and encryption
- `productivity` - Workflow enhancements
- `accessibility` - Accessibility features
- `other` - Miscellaneous

---

## Plugin API Reference

The API object is passed to your `activate` function.

### `api.version`

Current API version string.

### `api.registerCommand(commandId, handler)`

Register a command that can be triggered.

```javascript
api.registerCommand('doSomething', async () => {
  // Your code here
});
```

### `api.registerMenuItem(item)`

Add an item to PDF Kit's menus.

```javascript
api.registerMenuItem({
  command: 'doSomething',
  label: 'Do Something',
  location: 'tools',  // 'tools', 'file', 'edit', 'view', 'help'
  shortcut: 'Ctrl+Shift+D'  // Optional
});
```

### `api.showNotification(message, type)`

Display a toast notification.

```javascript
api.showNotification('Operation complete!', 'success');
// Types: 'info', 'success', 'warning', 'error'
```

### `api.getCurrentDocument()`

Get information about the current document. Requires `document:read` permission.

```javascript
const doc = await api.getCurrentDocument();
if (doc) {
  console.log(doc.fileName);    // "document.pdf"
  console.log(doc.pageCount);   // 10
  console.log(doc.metadata);    // { title, author, subject }
}
```

### `api.onDocumentChange(handler)`

Subscribe to document changes. Returns an unsubscribe function.

```javascript
const unsubscribe = api.onDocumentChange((doc) => {
  if (doc) {
    console.log('Opened:', doc.fileName);
  } else {
    console.log('Document closed');
  }
});

// Later: unsubscribe();
```

### `api.getSetting(key)`

Get a plugin setting value.

```javascript
const theme = api.getSetting('theme') || 'dark';
```

### `api.setSetting(key, value)`

Save a plugin setting. Requires `settings` permission.

```javascript
api.setSetting('theme', 'light');
```

### `api.log(message, level)`

Log a message for debugging.

```javascript
api.log('Something happened', 'info');
// Levels: 'debug', 'info', 'warn', 'error'
```

---

## Permissions

Plugins must declare required permissions in their manifest.

| Permission | Description |
|------------|-------------|
| `commands` | Register command handlers |
| `menus` | Add menu items |
| `notifications` | Show toast notifications |
| `document:read` | Read current document info |
| `document:write` | Modify/save documents |
| `filesystem:read` | Read files from disk |
| `filesystem:write` | Write files to disk |
| `network` | Make network requests |
| `clipboard` | Access clipboard |
| `settings` | Store plugin settings |

---

## Best Practices

### 1. Handle Errors Gracefully

```javascript
try {
  await riskyOperation();
} catch (error) {
  api.log('Error: ' + error.message, 'error');
  api.showNotification('Operation failed', 'error');
}
```

### 2. Clean Up on Deactivate

```javascript
let intervalId;

module.exports.activate = function(api) {
  intervalId = setInterval(checkSomething, 5000);
};

module.exports.deactivate = function() {
  if (intervalId) {
    clearInterval(intervalId);
  }
};
```

### 3. Respect Permissions

Only request permissions you actually need.

### 4. Be Responsive

Avoid blocking operations. Use async/await for long tasks.

### 5. Test Thoroughly

Test your plugin with various document types and edge cases.

---

## Publishing

### Preparing for Publication

1. Ensure `manifest.json` is complete and accurate
2. Include a clear `README.md`
3. Add a `LICENSE` file
4. Test on a fresh installation

### Distribution

Currently, plugins are distributed as folders. Users can:

1. Download your plugin folder
2. Copy it to their plugins directory
3. Enable it in Plugin Manager

### Future Marketplace

A plugin marketplace is planned for easier discovery and installation.

---

## Support

- GitHub Issues: Report bugs and request features
- Documentation: Check this guide for updates
- Community: Join our Discord for plugin developer discussions

---

*Happy plugin development! 🚀*
