/**
 * Google Business Profile Adapter
 *
 * Implements OAuth 2.0 and posting local posts (offers/updates) to
 * Google Business Profile via the Google Business Profile API.
 *
 * Token lifecycle:
 * - Access token: 1 hour
 * - Refresh token: long-lived (no documented expiry, but can be revoked)
 *
 * Post types: OFFER, UPDATE, EVENT
 */

import type { SocialPlatformAdapter, OAuthTokenResponse, PublishParams, PublishResult } from '../types.js';

const OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GBP_POSTS_BASE = 'https://mybusiness.googleapis.com/v4';

export class GoogleBusinessAdapter implements SocialPlatformAdapter {
  readonly platform = 'GOOGLE_BUSINESS' as const;

  private get clientId(): string {
    return process.env['GOOGLE_BUSINESS_CLIENT_ID'] || '';
  }

  private get clientSecret(): string {
    return process.env['GOOGLE_BUSINESS_CLIENT_SECRET'] || '';
  }

  getAuthUrl(_businessId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'https://www.googleapis.com/auth/business.manage',
      access_type: 'offline',
      prompt: 'consent', // Force consent to ensure refresh token is returned
    });

    return `${OAUTH_BASE}?${params.toString()}`;
  }

  async handleCallback(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    // Exchange code for tokens
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      throw new Error(`Google OAuth token exchange failed: ${JSON.stringify(err)}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    // Get the user's business accounts
    const accountsRes = await fetch(`https://mybusinessaccountmanagement.googleapis.com/v1/accounts`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    if (!accountsRes.ok) {
      throw new Error('Failed to fetch Google Business accounts');
    }

    const accountsData = await accountsRes.json() as {
      accounts?: Array<{ name: string; accountName: string; type: string }>;
    };

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No Google Business Profile accounts found.');
    }

    const account = accountsData.accounts[0]!;

    // Get locations for this account
    const locationsRes = await fetch(`${GBP_API_BASE}/${account.name}/locations?readMask=name,title`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    let locationName = account.name;
    let displayName = account.accountName;

    if (locationsRes.ok) {
      const locationsData = await locationsRes.json() as {
        locations?: Array<{ name: string; title: string }>;
      };
      if (locationsData.locations && locationsData.locations.length > 0) {
        locationName = locationsData.locations[0]!.name;
        displayName = locationsData.locations[0]!.title || account.accountName;
      }
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      platformAccountId: locationName, // e.g., "accounts/123/locations/456"
      platformAccountName: displayName,
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Google token refresh failed: ${JSON.stringify(err)}`);
    }

    const data = await res.json() as {
      access_token: string;
      expires_in: number;
      scope: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken, // Google doesn't return a new refresh token
      expiresIn: data.expires_in,
      platformAccountId: '', // Preserved from existing account
      platformAccountName: '',
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    };
  }

  async publishPost(accessToken: string, params: PublishParams): Promise<PublishResult> {
    const locationName = params.platformAccountId;

    // Build local post (OFFER type for deals)
    const postBody: Record<string, unknown> = {
      languageCode: 'en',
      summary: params.caption,
      topicType: 'OFFER',
    };

    // Add call to action with link
    if (params.link) {
      postBody.callToAction = {
        actionType: 'LEARN_MORE',
        url: params.link,
      };
    }

    // Add media if provided
    if (params.imageUrl) {
      postBody.media = [{
        mediaFormat: 'PHOTO',
        sourceUrl: params.imageUrl,
      }];
    }

    const res = await fetch(`${GBP_POSTS_BASE}/${locationName}/localPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(`Google Business publish failed: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json() as { name?: string; searchUrl?: string };

    return {
      platformPostId: data.name || '',
      platformPostUrl: data.searchUrl,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
    return res.ok;
  }
}
