import en from '../i18n/en.json';
import ne from '../i18n/ne.json';
import newa from '../i18n/newa.json';

const dictionaries = { en, ne, newa } as const;

type Locale = keyof typeof dictionaries;

export function getTranslations(locale: Locale) {
  const dict = dictionaries[locale] || dictionaries.en;
  return (key: string): string => {
    return (dict as Record<string, string>)[key] || key;
  };
}

export function getLocaleFromURL(pathname: string): Locale {
  if (pathname.startsWith('/ne/')) return 'ne';
  if (pathname.startsWith('/newa/')) return 'newa';
  return 'en';
}

export function localizedPath(path: string, locale: Locale): string {
  if (locale === 'en') return path;
  return `/${locale}${path}`;
}

export const locales = ['en', 'ne', 'newa'] as const;
