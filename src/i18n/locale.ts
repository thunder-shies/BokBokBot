export type AppLocale = 'zh-HK' | 'en';

export const DEFAULT_LOCALE: AppLocale = 'zh-HK';
export const LOCALE_STORAGE_KEY = 'bokbokbot-locale';

export function isAppLocale(value: string): value is AppLocale {
  return value === 'zh-HK' || value === 'en';
}

export function speechRecognitionLang(locale: AppLocale): string {
  return locale === 'en' ? 'en-US' : 'zh-HK';
}

export function speechSynthesisLang(locale: AppLocale): string {
  return locale === 'en' ? 'en-US' : 'zh-HK';
}
