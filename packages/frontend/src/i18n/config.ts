import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import type definitions for translation keys
import './types.js';

// Import all translation files
import translationEN from '../../public/locales/en/translation.json';
import translationAR from '../../public/locales/ar/translation.json';
import translationZH_CN from '../../public/locales/zh-CN/translation.json';
import translationZH_TW from '../../public/locales/zh-TW/translation.json';
import translationVI from '../../public/locales/vi/translation.json';
import translationHI from '../../public/locales/hi/translation.json';
import translationUR from '../../public/locales/ur/translation.json';
import translationKO from '../../public/locales/ko/translation.json';
import translationEL from '../../public/locales/el/translation.json';
import translationIT from '../../public/locales/it/translation.json';

const resources = {
  en: { translation: translationEN },
  ar: { translation: translationAR },
  'zh-CN': { translation: translationZH_CN },
  'zh-TW': { translation: translationZH_TW },
  vi: { translation: translationVI },
  hi: { translation: translationHI },
  ur: { translation: translationUR },
  ko: { translation: translationKO },
  el: { translation: translationEL },
  it: { translation: translationIT },
};

// Custom language detector order
const languageDetectorOptions = {
  order: ['querystring', 'localStorage', 'navigator'],
  lookupQuerystring: 'lang',
  lookupLocalStorage: 'community-hub-language',
  caches: ['localStorage'],
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: languageDetectorOptions,
    react: {
      useSuspense: false, // Disable suspense to avoid loading flickers
    },
  });

export default i18n;
