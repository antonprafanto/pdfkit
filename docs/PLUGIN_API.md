# Plugin API Reference

Guide for developing PDF Kit plugins.

---

## Overview

PDF Kit supports plugins to extend functionality. Plugins run in a sandboxed environment and communicate with the main application through defined APIs.

---

## Plugin Structure

```
my-plugin/
├── manifest.json    # Required: Plugin metadata
└── index.js         # Required: Plugin entry point
```

---

## manifest.json

```json
{
  "id": "my-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "Description of what the plugin does",
  "author": "Your Name",
  "main": "index.js",
  "permissions": ["pdf.read", "pdf.write"],
  "minAppVersion": "0.1.0"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase, hyphens) |
| `name` | string | Display name |
| `version` | string | Semantic version (x.y.z) |
| `main` | string | Entry point file |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Plugin description |
| `author` | string | Author name |
| `permissions` | string[] | Required permissions |
| `minAppVersion` | string | Minimum PDF Kit version |

---

## index.js

```javascript
module.exports = {
  // Called when plugin is loaded
  async init(api) {
    console.log('Plugin initialized!');
    
    // Register menu item
    api.menu.register({
      id: 'my-action',
      label: 'My Action',
      onClick: () => this.handleAction(api)
    });
    
    // Register event listener
    api.events.on('pdf.opened', (data) => {
      console.log('PDF opened:', data.filename);
    });
  },
  
  // Called when plugin is disabled/unloaded
  async cleanup(api) {
    console.log('Plugin cleanup!');
  },
  
  // Custom methods
  handleAction(api) {
    api.notification.show({
      type: 'info',
      message: 'Action performed!'
    });
  }
};
```

---

## Plugin API

### api.menu

Register menu items:

```javascript
// Add menu item
api.menu.register({
  id: 'unique-id',
  label: 'Menu Label',
  submenu: 'Tools',         // Optional: parent menu
  shortcut: 'Ctrl+Shift+M', // Optional: keyboard shortcut
  onClick: () => { }
});

// Remove menu item
api.menu.unregister('unique-id');
```

### api.events

Subscribe to application events:

```javascript
// Available events
api.events.on('pdf.opened', (data) => { });
api.events.on('pdf.closed', (data) => { });
api.events.on('pdf.saved', (data) => { });
api.events.on('page.changed', (data) => { });
api.events.on('tool.activated', (data) => { });

// Unsubscribe
const unsubscribe = api.events.on('pdf.opened', handler);
unsubscribe(); // Later
```

### api.pdf

Access current PDF:

```javascript
// Get PDF info
const info = await api.pdf.getInfo();
// Returns: { filename, pageCount, title, author, ... }

// Get specific page
const page = await api.pdf.getPage(1);
// Returns: { width, height, text, ... }

// Get selected text
const selection = await api.pdf.getSelection();

// Get all text
const text = await api.pdf.getAllText();
```

### api.notification

Show notifications:

```javascript
api.notification.show({
  type: 'info',    // 'info', 'success', 'warning', 'error'
  message: 'Your message here',
  duration: 3000   // Optional: auto-hide after ms
});
```

### api.dialog

Show dialogs:

```javascript
// Alert dialog
await api.dialog.alert({
  title: 'Title',
  message: 'Message'
});

// Confirm dialog
const confirmed = await api.dialog.confirm({
  title: 'Confirm',
  message: 'Are you sure?'
});

// Input dialog
const value = await api.dialog.input({
  title: 'Enter Value',
  placeholder: 'Type here...',
  defaultValue: ''
});
```

### api.storage

Persist plugin data:

```javascript
// Save data
await api.storage.set('key', { any: 'data' });

// Load data
const data = await api.storage.get('key');

// Delete data
await api.storage.remove('key');

// Clear all plugin data
await api.storage.clear();
```

### api.file

File operations:

```javascript
// Open file dialog
const files = await api.file.openDialog({
  filters: [
    { name: 'PDF Files', extensions: ['pdf'] }
  ],
  multiple: false
});

// Save file dialog
const savePath = await api.file.saveDialog({
  defaultName: 'output.pdf',
  filters: [
    { name: 'PDF Files', extensions: ['pdf'] }
  ]
});

// Read file
const content = await api.file.read(path);

// Write file
await api.file.write(path, content);
```

---

## Permissions

Plugins must declare required permissions:

| Permission | Description |
|------------|-------------|
| `pdf.read` | Read PDF content |
| `pdf.write` | Modify PDF content |
| `file.read` | Read files from disk |
| `file.write` | Write files to disk |
| `network` | Make network requests |
| `storage` | Use persistent storage |

---

## Event Reference

### pdf.opened
```javascript
{
  filename: 'document.pdf',
  path: '/path/to/document.pdf',
  pageCount: 10
}
```

### pdf.closed
```javascript
{
  filename: 'document.pdf'
}
```

### pdf.saved
```javascript
{
  filename: 'document.pdf',
  path: '/path/to/document.pdf'
}
```

### page.changed
```javascript
{
  page: 5,
  totalPages: 10
}
```

### tool.activated
```javascript
{
  tool: 'split'  // 'merge', 'compress', etc.
}
```

---

## Example Plugins

### Word Counter

```javascript
module.exports = {
  async init(api) {
    api.menu.register({
      id: 'word-counter',
      label: 'Count Words',
      submenu: 'Tools',
      onClick: async () => {
        const text = await api.pdf.getAllText();
        const words = text.split(/\s+/).filter(w => w).length;
        
        api.dialog.alert({
          title: 'Word Count',
          message: `This document has ${words} words.`
        });
      }
    });
  },
  
  async cleanup(api) {
    api.menu.unregister('word-counter');
  }
};
```

### Auto-Save Reminder

```javascript
module.exports = {
  timer: null,
  
  async init(api) {
    // Remind to save every 10 minutes
    this.timer = setInterval(() => {
      api.notification.show({
        type: 'info',
        message: 'Remember to save your work!'
      });
    }, 10 * 60 * 1000);
  },
  
  async cleanup(api) {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
};
```

---

## Installation

1. Create plugin folder in `plugins/` directory
2. Add `manifest.json` and `index.js`
3. Restart PDF Kit
4. Enable plugin in Settings → Plugins

---

## Debugging

- Open DevTools: View → Toggle Developer Tools
- Plugin logs appear in console
- Use `console.log()` for debugging

---

## Best Practices

1. **Handle errors gracefully**
   ```javascript
   try {
     await api.pdf.getInfo();
   } catch (error) {
     api.notification.show({
       type: 'error',
       message: 'Failed to get PDF info'
     });
   }
   ```

2. **Clean up on unload**
   - Remove event listeners
   - Clear intervals/timeouts
   - Unregister menu items

3. **Use permissions sparingly**
   - Request only needed permissions
   - Explain why in description

4. **Version your plugin**
   - Follow semantic versioning
   - Update for breaking changes

---

## Publishing

1. Create a GitHub repository
2. Add installation instructions
3. Submit to plugins list (coming soon)
