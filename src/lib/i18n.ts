export const locales = ["en", "ne", "newa"] as const;

export type Locale = (typeof locales)[number];

export function localizedPath(path: string, locale: Locale): string {
    if (locale === "en") return path;
    return `/${locale}${path}`;
}

let cmsTranslations: Record<string, Record<string, string>> | null = null;

async function loadTranslations(): Promise<Record<string, Record<string, string>>> {
    if (cmsTranslations) return cmsTranslations;
    try {
        const { getCollection } = await import("astro:content");
        const entries = await getCollection("i18n");
        cmsTranslations = {};
        for (const entry of entries) {
            const data = entry.data as { key: string; en: string; ne: string; newa: string };
            if (!data.key) continue;
            for (const locale of locales) {
                if (typeof data[locale] === "string") {
                    if (!cmsTranslations[locale]) cmsTranslations[locale] = {};
                    cmsTranslations[locale][data.key] = data[locale];
                }
            }
        }
        return cmsTranslations || {};
    } catch (err) {
        console.error("Failed to load translations:", err);
        return {};
    }
}

export async function getTranslations(locale: Locale) {
    const cms = await loadTranslations();
    const dict = cms[locale] || cms.en;
    return (key: string): string => {
        return dict[key] || key;
    };
}
