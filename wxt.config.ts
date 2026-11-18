import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    web_accessible_resources: [
      { resources: ['gemini.svg'], matches: ['*://*.youtube.com/*'] },
    ],
    name: '__MSG_extensionName__',
    homepage_url: 'https://github.com/crazy77/youtube-summary',
    description: '__MSG_extensionDescription__',
    default_locale: 'ko',
    permissions: ['contextMenus', 'storage'],
    host_permissions: ['*://*.youtube.com/*', 'https://gemini.google.com/*'],
    action: {
      default_title: '__MSG_actionTitle__',
    },
  },
});
