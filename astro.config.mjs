// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
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
});
