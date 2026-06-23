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
            const data = entry.data as Record<string, unknown>;
            for (const locale of locales) {
                if (typeof data[locale] === "object" && data[locale] !== null) {
                    if (!cmsTranslations[locale]) cmsTranslations[locale] = {};
                    Object.assign(cmsTranslations[locale], data[locale] as Record<string, string>);
                }
            }
        }
        return cmsTranslations || {};
    } catch {
        return {};
    }
}

export function getTranslations(locale: Locale) {
    const dict = dictionaries[locale] || dictionaries.en;
    return (key: string): string => {
        return (dict as Record<string, string>)[key] || key;
    };
}
