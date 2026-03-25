/**
 * Social Platform Adapter Interface
 *
 * Defines the contract that each social media platform adapter must implement.
 * Spec §20: Social Media Integration
 */

import type { SocialPlatform } from '@community-hub/shared';

/** OAuth token response from a platform */
export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds until access token expires
  platformAccountId: string;
  platformAccountName: string;
  scopes: string[];
}

/** Parameters for publishing a post */
export interface PublishParams {
  caption: string;
  imageUrl?: string;
  link?: string;
  platformAccountId: string;
}

/** Result of a successful publish */
export interface PublishResult {
  platformPostId: string;
  platformPostUrl?: string;
}

/** Platform adapter interface - each platform implements this */
export interface SocialPlatformAdapter {
  readonly platform: SocialPlatform;

  /**
   * Generate the OAuth authorization URL for the user to visit.
   * @param businessId - Used in state parameter for CSRF protection
   * @param redirectUri - The callback URL registered with the platform
   * @param state - CSRF state token
   * @param extra - Optional extra params (e.g., PKCE codeChallenge for Twitter)
   * @returns The full OAuth authorization URL
   */
  getAuthUrl(businessId: string, redirectUri: string, state: string, extra?: { codeChallenge?: string }): string;

  /**
   * Exchange the OAuth callback code for access/refresh tokens.
   * @param code - Authorization code from the callback
   * @param redirectUri - Must match the one used in getAuthUrl
   * @param codeVerifier - PKCE code verifier (Twitter only)
   * @returns Token response with account details
   */
  handleCallback(code: string, redirectUri: string, codeVerifier?: string): Promise<OAuthTokenResponse>;

  /**
   * Refresh an expired access token using the refresh token.
   * @param refreshToken - The stored refresh token
   * @returns New token response
   */
  refreshToken(refreshToken: string): Promise<OAuthTokenResponse>;

  /**
   * Publish a post to the platform.
   * @param accessToken - Valid access token
   * @param params - Post content and metadata
   * @returns Platform post ID and URL
   */
  publishPost(accessToken: string, params: PublishParams): Promise<PublishResult>;

  /**
   * Revoke the access token on the platform side.
   * Called during disconnect flow.
   * @param accessToken - Token to revoke
   */
  revokeToken(accessToken: string): Promise<void>;

  /**
   * Check if an access token is still valid.
   * @param accessToken - Token to validate
   * @returns true if valid
   */
  validateToken(accessToken: string): Promise<boolean>;
}

/** OAuth state stored in Redis for CSRF protection */
export interface OAuthState {
  businessId: string;
  userId: string;
  platform: SocialPlatform;
  codeVerifier?: string; // PKCE (Twitter)
  createdAt: number;
}
