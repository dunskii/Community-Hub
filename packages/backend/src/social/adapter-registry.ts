/**
 * Social Platform Adapter Registry
 *
 * Provides a factory for getting the appropriate adapter for each platform.
 */

import type { SocialPlatform } from '@community-hub/shared';
import type { SocialPlatformAdapter } from './types.js';
import { FacebookAdapter } from './adapters/facebook-adapter.js';
import { InstagramAdapter } from './adapters/instagram-adapter.js';
import { TwitterAdapter } from './adapters/twitter-adapter.js';
import { LinkedInAdapter } from './adapters/linkedin-adapter.js';
import { GoogleBusinessAdapter } from './adapters/google-business-adapter.js';

const adapters = new Map<SocialPlatform, SocialPlatformAdapter>();

/** Initialize all adapters (call once at startup) */
export function initializeAdapters(): void {
  adapters.set('FACEBOOK', new FacebookAdapter());
  adapters.set('INSTAGRAM', new InstagramAdapter());
  adapters.set('TWITTER', new TwitterAdapter());
  adapters.set('LINKEDIN', new LinkedInAdapter());
  adapters.set('GOOGLE_BUSINESS', new GoogleBusinessAdapter());
}

/** Get the adapter for a specific platform */
export function getAdapter(platform: SocialPlatform): SocialPlatformAdapter {
  const adapter = adapters.get(platform);
  if (!adapter) {
    throw new Error(`No adapter registered for platform: ${platform}`);
  }
  return adapter;
}

/** Check if an adapter is available (has required env vars) */
export function isAdapterConfigured(platform: SocialPlatform): boolean {
  switch (platform) {
    case 'FACEBOOK':
    case 'INSTAGRAM':
      return !!(process.env['FACEBOOK_APP_ID'] && process.env['FACEBOOK_APP_SECRET']);
    case 'TWITTER':
      return !!(process.env['TWITTER_CLIENT_ID'] && process.env['TWITTER_CLIENT_SECRET']);
    case 'LINKEDIN':
      return !!(process.env['LINKEDIN_CLIENT_ID'] && process.env['LINKEDIN_CLIENT_SECRET']);
    case 'GOOGLE_BUSINESS':
      return !!(process.env['GOOGLE_BUSINESS_CLIENT_ID'] && process.env['GOOGLE_BUSINESS_CLIENT_SECRET']);
    default:
      return false;
  }
}
