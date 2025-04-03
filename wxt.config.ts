import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // extensionApi: 'chrome',
  manifest: {
    permissions: ['tabs', 'storage', 'activeTab'],
    browser_specific_settings: {
      gecko: {
        id: 'tabs-grabber@example.com',
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss() as any],
  }),
  // webExt: {
  //   binaries: {
  //     firefox: 'firefoxdeveloperedition',
  //   },
  // },
});
