import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vigil.vercel.app',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
