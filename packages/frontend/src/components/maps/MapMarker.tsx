interface MapMarkerProps {
  businessName: string;
}

/**
 * Custom business marker icon
 * Uses SVG for scalability and accessibility
 * Spec §4.3 Business Profile - Location & Map
 */
export function MapMarker({ businessName }: MapMarkerProps) {
  return (
    <div className="relative" role="img" aria-label={`Location marker for ${businessName}`}>
      <svg
        width="32"
        height="40"
        viewBox="0 0 32 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        {/* Marker pin shape */}
        <path
          d="M16 0C7.16 0 0 7.16 0 16C0 24.84 16 40 16 40C16 40 32 24.84 32 16C32 7.16 24.84 0 16 0Z"
          fill="var(--color-primary)"
        />
        {/* Inner circle (white) */}
        <circle cx="16" cy="16" r="6" fill="white" />
      </svg>
    </div>
  );
}
