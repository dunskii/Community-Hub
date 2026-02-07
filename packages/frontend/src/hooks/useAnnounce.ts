import { useCallback, useState } from 'react';

interface AnnounceOptions {
  /** Politeness level */
  politeness?: 'polite' | 'assertive';
  /** Clear announcement after delay (ms) */
  clearAfter?: number;
}

/**
 * Hook for making screen reader announcements
 * Returns [message, announce function]
 */
export function useAnnounce() {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback((
    newMessage: string,
    options: AnnounceOptions = {}
  ) => {
    const {
      politeness: newPoliteness = 'polite',
      clearAfter = 5000,
    } = options;

    setPoliteness(newPoliteness);
    setMessage(newMessage);

    if (clearAfter > 0) {
      setTimeout(() => {
        setMessage('');
      }, clearAfter);
    }
  }, []);

  return {
    message,
    politeness,
    announce,
  };
}
