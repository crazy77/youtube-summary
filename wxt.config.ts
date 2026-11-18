import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: 'ko',
    permissions: ['contextMenus', 'storage'],
    host_permissions: ['*://*.youtube.com/*', 'https://gemini.google.com/*'],
    action: {
      default_title: '__MSG_actionTitle__',
    },
  },
});
