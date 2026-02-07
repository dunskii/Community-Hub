interface MapFallbackProps {
  address: string;
}

/**
 * Fallback component when Mapbox API is unavailable
 * Spec §27.5 Graceful Degradation
 */
export function MapFallback({ address }: MapFallbackProps) {
  return (
    <div
      className="flex items-center gap-3 p-6 bg-neutral-light rounded-lg border border-neutral-medium"
      role="region"
      aria-label="Business location (map unavailable)"
    >
      <svg
        className="w-8 h-8 text-primary shrink-0"
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
      <div>
        <p className="text-sm text-text-light mb-1">Location</p>
        <p className="text-base text-text-dark font-medium">{address}</p>
      </div>
    </div>
  );
}
