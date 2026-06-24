import en from "../i18n/en.json";
import ne from "../i18n/ne.json";
import newa from "../i18n/newa.json";

const dictionaries = { en, ne, newa } as const;

export type Locale = keyof typeof dictionaries;

export const locales = ["en", "ne", "newa"] as const;

export function localizedPath(path: string, locale: Locale): string {
    if (locale === "en") return path;
    return `/${locale}${path}`;
}

let cmsTranslations: Record<string, Record<string, string>> | null = null;

export async function loadCMSTranslations(): Promise<Record<string, Record<string, string>>> {
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
        console.error("Failed to load CMS translations:", err);
        return {};
    }
}

export type LocalizedString = Record<Locale, string>;

export function localizedValue(value: LocalizedString | undefined, locale: Locale): string {
    if (!value) return "";
    return value[locale] || value.en;
}

export function getTranslations(locale: Locale) {
    const dict = dictionaries[locale] || dictionaries.en;
    return (key: string): string => {
        return (dict as Record<string, string>)[key] || key;
    };
}
