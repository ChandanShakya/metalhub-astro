// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ne', 'newa'],
    routing: { prefixDefaultLocale: false }
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  }
});
