import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '@community-hub/shared';
import {
  getEnabledLanguages,
  validateLanguageCode,
  updateHTMLAttributes,
  isRTL,
} from '../i18n/utils';

interface UseLanguageReturn {
  currentLanguage: string;
  availableLanguages: LanguageCode[];
  changeLanguage: (code: string) => Promise<void>;
  isRTL: boolean;
  isLoading: boolean;
}

/**
 * Hook for managing language switching and detection
 */
export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation();
  const [availableLanguages, setAvailableLanguages] = useState<LanguageCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load available languages on mount
  useEffect(() => {
    try {
      const languages = getEnabledLanguages();
      setAvailableLanguages(languages);
    } catch (error) {
      console.error('Error loading languages:', error);
      setAvailableLanguages(['en']);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update HTML attributes when language changes
  useEffect(() => {
    updateHTMLAttributes(i18n.language);
  }, [i18n.language]);

  /**
   * Change the current language with validation
   */
  const changeLanguage = async (code: string): Promise<void> => {
    const validatedCode = validateLanguageCode(code);
    await i18n.changeLanguage(validatedCode);
    updateHTMLAttributes(validatedCode);

    // Persist to localStorage
    localStorage.setItem('community-hub-language', validatedCode);

    // TODO Phase 2: If user is authenticated, update user.language_preference via API
  };

  return {
    currentLanguage: i18n.language,
    availableLanguages,
    changeLanguage,
    isRTL: isRTL(i18n.language),
    isLoading,
  };
}
