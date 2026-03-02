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

// Import business-specific translations
import businessEN from './locales/en/business.json';
import businessAR from './locales/ar/business.json';
import categoryEN from './locales/en/category.json';
import categoryAR from './locales/ar/category.json';
import reviewsEN from './locales/en/reviews.json';
import reviewsAR from './locales/ar/reviews.json';
import reviewsZH_CN from './locales/zh-CN/reviews.json';
import reviewsZH_TW from './locales/zh-TW/reviews.json';
import reviewsVI from './locales/vi/reviews.json';
import reviewsHI from './locales/hi/reviews.json';
import reviewsUR from './locales/ur/reviews.json';
import reviewsKO from './locales/ko/reviews.json';
import reviewsEL from './locales/el/reviews.json';
import reviewsIT from './locales/it/reviews.json';

const resources = {
  en: {
    translation: translationEN,
    business: businessEN,
    category: categoryEN,
    reviews: reviewsEN,
  },
  ar: {
    translation: translationAR,
    business: businessAR,
    category: categoryAR,
    reviews: reviewsAR,
  },
  'zh-CN': {
    translation: translationZH_CN,
    reviews: reviewsZH_CN,
  },
  'zh-TW': {
    translation: translationZH_TW,
    reviews: reviewsZH_TW,
  },
  vi: {
    translation: translationVI,
    reviews: reviewsVI,
  },
  hi: {
    translation: translationHI,
    reviews: reviewsHI,
  },
  ur: {
    translation: translationUR,
    reviews: reviewsUR,
  },
  ko: {
    translation: translationKO,
    reviews: reviewsKO,
  },
  el: {
    translation: translationEL,
    reviews: reviewsEL,
  },
  it: {
    translation: translationIT,
    reviews: reviewsIT,
  },
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
    defaultNS: 'translation',
    ns: ['translation', 'business', 'category', 'reviews'],
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
