// @ts-check

import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
    site: "https://metalhub.pages.dev",
    base: "/",
    vite: {
        plugins: [tailwindcss()],
    },
    i18n: {
        defaultLocale: "en",
        locales: ["en", "ne", "newa"],
        routing: { prefixDefaultLocale: false },
    },
    prefetch: {
        prefetchAll: false,
        defaultStrategy: "hover",
    },
    integrations: [sitemap()],
    adapter: cloudflare(),
});
