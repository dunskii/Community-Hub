import { openDirections } from './utils/directions';

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  address: string;
  businessName: string;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

/**
 * Button to open directions in native maps app
 * Spec §4.3 Business Profile - Get Directions
 * Analytics: Track "Direction Requests" per Spec §13.4
 */
export function DirectionsButton({
  latitude,
  longitude,
  address,
  businessName,
  variant = 'primary',
  fullWidth = false,
}: DirectionsButtonProps) {
  const handleClick = () => {
    const opened = openDirections({ latitude, longitude }, address);

    if (!opened) {
      // Popup was blocked - show user-friendly message
      alert(
        'Please allow popups for this site to open directions in your maps app.\n\n' +
          `Address: ${address}`
      );
    }

    // TODO: Track analytics event (Phase 7.3)
    // trackEvent('business.directions_requested', { businessName, popupBlocked: !opened });
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses =
    variant === 'primary'
      ? 'bg-primary text-white hover:bg-primary/90 focus:ring-primary'
      : 'bg-white text-primary border-2 border-primary hover:bg-primary/5 focus:ring-primary';

  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses} ${widthClasses} min-h-[44px]`}
      aria-label={`Get directions to ${businessName}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <span>Get Directions</span>
    </button>
  );
}
