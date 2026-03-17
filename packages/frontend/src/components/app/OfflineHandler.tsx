/**
 * OfflineHandler Component
 *
 * [UI/UX Spec v2.2 §12.3 - Offline Behaviour]
 *
 * Handles offline detection, banner display, and connection recovery toasts.
 * Should be rendered inside ToastProvider and BrowserRouter.
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from '../../hooks/useToast';
import { OfflineBanner } from '../ui/OfflineBanner';

interface OfflineHandlerProps {
  children: React.ReactNode;
}

export function OfflineHandler({ children }: OfflineHandlerProps) {
  const { t } = useTranslation();
  const { isOnline, wasOffline, clearWasOffline } = useOnlineStatus();
  const { showToast } = useToast();
  const hasShownReconnectToast = useRef(false);

  // Show toast when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && !hasShownReconnectToast.current) {
      hasShownReconnectToast.current = true;

      // Show "back online" toast
      showToast({
        message: t('offline.backOnline', 'Back online'),
        type: 'success',
        duration: 3000,
      });

      // Clear the wasOffline flag after showing toast
      clearWasOffline();
    }

    // Reset flag when going offline
    if (!isOnline) {
      hasShownReconnectToast.current = false;
    }
  }, [isOnline, wasOffline, clearWasOffline, showToast, t]);

  return (
    <>
      <OfflineBanner isOffline={!isOnline} />
      {children}
    </>
  );
}
