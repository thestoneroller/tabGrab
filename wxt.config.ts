import tailwindcss from '@tailwindcss/vite';
import { obfuscator } from 'rollup-obfuscator';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['tabs'],
    browser_specific_settings: {
      gecko: {
        id: 'tab-grab@extension.com',
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss() as any, obfuscator()],
  }),
  webExt: {
    binaries: {
      firefox: 'firefoxdeveloperedition',
    },
  },
});
