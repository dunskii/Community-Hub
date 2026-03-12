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

// Import owner/analytics translations
import ownerEN from './locales/en/owner.json';
import ownerAR from './locales/ar/owner.json';
import ownerZH_CN from './locales/zh-CN/owner.json';
import ownerZH_TW from './locales/zh-TW/owner.json';
import ownerVI from './locales/vi/owner.json';
import ownerHI from './locales/hi/owner.json';
import ownerUR from './locales/ur/owner.json';
import ownerKO from './locales/ko/owner.json';
import ownerEL from './locales/el/owner.json';
import ownerIT from './locales/it/owner.json';

// Import home page translations
import homeEN from './locales/en/home.json';
import homeAR from './locales/ar/home.json';
import homeZH_CN from './locales/zh-CN/home.json';
import homeZH_TW from './locales/zh-TW/home.json';
import homeVI from './locales/vi/home.json';
import homeHI from './locales/hi/home.json';
import homeUR from './locales/ur/home.json';
import homeKO from './locales/ko/home.json';
import homeEL from './locales/el/home.json';
import homeIT from './locales/it/home.json';

// Import events translations (Phase 8)
import eventsEN from './locales/en/events.json';
import eventsAR from './locales/ar/events.json';
import eventsZH_CN from './locales/zh-CN/events.json';
import eventsZH_TW from './locales/zh-TW/events.json';
import eventsVI from './locales/vi/events.json';
import eventsHI from './locales/hi/events.json';
import eventsUR from './locales/ur/events.json';
import eventsKO from './locales/ko/events.json';
import eventsEL from './locales/el/events.json';
import eventsIT from './locales/it/events.json';

const resources = {
  en: {
    translation: translationEN,
    business: businessEN,
    category: categoryEN,
    reviews: reviewsEN,
    owner: ownerEN,
    home: homeEN,
    events: eventsEN,
  },
  ar: {
    translation: translationAR,
    business: businessAR,
    category: categoryAR,
    reviews: reviewsAR,
    owner: ownerAR,
    home: homeAR,
    events: eventsAR,
  },
  'zh-CN': {
    translation: translationZH_CN,
    reviews: reviewsZH_CN,
    owner: ownerZH_CN,
    home: homeZH_CN,
    events: eventsZH_CN,
  },
  'zh-TW': {
    translation: translationZH_TW,
    reviews: reviewsZH_TW,
    owner: ownerZH_TW,
    home: homeZH_TW,
    events: eventsZH_TW,
  },
  vi: {
    translation: translationVI,
    reviews: reviewsVI,
    owner: ownerVI,
    home: homeVI,
    events: eventsVI,
  },
  hi: {
    translation: translationHI,
    reviews: reviewsHI,
    owner: ownerHI,
    home: homeHI,
    events: eventsHI,
  },
  ur: {
    translation: translationUR,
    reviews: reviewsUR,
    owner: ownerUR,
    home: homeUR,
    events: eventsUR,
  },
  ko: {
    translation: translationKO,
    reviews: reviewsKO,
    owner: ownerKO,
    home: homeKO,
    events: eventsKO,
  },
  el: {
    translation: translationEL,
    reviews: reviewsEL,
    owner: ownerEL,
    home: homeEL,
    events: eventsEL,
  },
  it: {
    translation: translationIT,
    reviews: reviewsIT,
    owner: ownerIT,
    home: homeIT,
    events: eventsIT,
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
    ns: ['translation', 'business', 'category', 'reviews', 'owner', 'home', 'events'],
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
