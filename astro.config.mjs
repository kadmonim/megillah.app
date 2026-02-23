// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://megillah.app',
  output: 'static',
  integrations: [preact({ compat: true }), sitemap({
    filter: (page) => !['/debug', '/updates', '/live/join'].some(p => page.endsWith(p) || page.endsWith(p + '/')),
  })],
});