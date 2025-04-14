import tailwindcss from '@tailwindcss/vite';
import { obfuscator } from 'rollup-obfuscator';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['tabs', 'storage'],
    browser_specific_settings: {
      gecko: {
        id: 'tab-grab@thestoneroller.com',
      },
    },
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'",
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
