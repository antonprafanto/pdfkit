# Sample Plugin for PDF Kit

A demonstration plugin showing how to use the PDF Kit Plugin API.

## Features

- **Say Hello**: Shows a greeting notification
- **Count Pages**: Displays the current document's page count

## Installation

1. Copy this folder to PDF Kit's plugins directory
2. Open PDF Kit
3. Go to Tools → Plugin Manager
4. Enable "Sample Plugin"

## Plugin Structure

```
sample-plugin/
├── manifest.json    # Plugin metadata and configuration
├── index.js         # Main entry point
└── README.md        # This file
```

## API Usage Examples

### Registering Commands

```javascript
api.registerCommand('myCommand', function() {
  api.showNotification('Command executed!', 'success');
});
```

### Adding Menu Items

```javascript
api.registerMenuItem({
  command: 'myCommand',
  label: 'My Plugin: Do Something',
  location: 'tools'  // 'tools', 'file', 'edit', 'view', 'help'
});
```

### Accessing Documents

```javascript
if (api.getCurrentDocument) {
  const doc = await api.getCurrentDocument();
  if (doc) {
    console.log('File:', doc.fileName);
    console.log('Pages:', doc.pageCount);
  }
}
```

### Listening for Changes

```javascript
api.onDocumentChange(function(doc) {
  if (doc) {
    console.log('Document opened:', doc.fileName);
  } else {
    console.log('Document closed');
  }
});
```

## Permissions

This plugin requires:

- `commands` - Register command handlers
- `menus` - Add menu items
- `notifications` - Show toast notifications
- `document:read` - Read document information

## License

MIT
