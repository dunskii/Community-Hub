interface SkipLinkProps {
  targetId?: string;
}

/**
 * Skip to main content link [Spec §3.6].
 *
 * Visually hidden by default, becomes visible on keyboard focus.
 * Allows keyboard users to bypass navigation and jump to main content.
 */
export function SkipLink({ targetId = 'main-content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-sm focus-visible:focus-ring"
    >
      Skip to main content
    </a>
  );
}
