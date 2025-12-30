/**
 * Sample Plugin for PDF Kit
 * Demonstrates the plugin API capabilities
 */

// Plugin activation
module.exports.activate = function(api) {
  api.log('Sample Plugin activated!', 'info');
  
  // Register command: Say Hello
  api.registerCommand('sayHello', function() {
    api.showNotification('Hello from Sample Plugin! 👋', 'success');
  });
  
  // Register command: Count Pages
  api.registerCommand('countPages', async function() {
    if (api.getCurrentDocument) {
      const doc = await api.getCurrentDocument();
      if (doc) {
        api.showNotification(
          `Document "${doc.fileName}" has ${doc.pageCount} page(s)`,
          'info'
        );
      } else {
        api.showNotification('No document is currently open', 'warning');
      }
    } else {
      api.showNotification('Document access not available', 'error');
    }
  });
  
  // Register menu items from manifest
  api.registerMenuItem({
    command: 'sayHello',
    label: 'Sample: Say Hello',
    location: 'tools'
  });
  
  api.registerMenuItem({
    command: 'countPages',
    label: 'Sample: Count Pages',
    location: 'tools'
  });
  
  // Optional: Listen for document changes
  if (api.onDocumentChange) {
    api.onDocumentChange(function(doc) {
      if (doc) {
        api.log('Document changed: ' + doc.fileName, 'debug');
      } else {
        api.log('Document closed', 'debug');
      }
    });
  }
  
  api.log('Sample Plugin commands registered', 'info');
};

// Plugin deactivation
module.exports.deactivate = function() {
  console.log('Sample Plugin deactivated');
};
