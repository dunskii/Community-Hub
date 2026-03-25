/**
 * X (formerly Twitter) Adapter
 *
 * Implements OAuth 2.0 with PKCE and posting via X API v2.
 * Docs: https://docs.x.com/x-api/introduction
 *
 * Token lifecycle:
 * - Access token: 2 hours
 * - Refresh token: long-lived (requires offline.access scope)
 *
 * Pricing: Pay-per-usage (no subscriptions required)
 * Monthly cap: 2 million post reads on standard plans
 */

import { randomBytes, createHash } from 'node:crypto';
import type { SocialPlatformAdapter, OAuthTokenResponse, PublishParams, PublishResult } from '../types.js';

const API_BASE = 'https://api.x.com';
const OAUTH_AUTHORIZE = 'https://x.com/i/oauth2/authorize';

export class TwitterAdapter implements SocialPlatformAdapter {
  readonly platform = 'TWITTER' as const;

  private get clientId(): string {
    return process.env['TWITTER_CLIENT_ID'] || '';
  }

  private get clientSecret(): string {
    return process.env['TWITTER_CLIENT_SECRET'] || '';
  }

  /** Generate PKCE code verifier and challenge */
  static generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  getAuthUrl(_businessId: string, redirectUri: string, state: string, extra?: { codeChallenge?: string }): string {
    if (!extra?.codeChallenge) {
      throw new Error('X OAuth requires a PKCE codeChallenge parameter');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read media.write offline.access',
      state,
      code_challenge: extra.codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${OAUTH_AUTHORIZE}?${params.toString()}`;
  }

  async handleCallback(code: string, redirectUri: string, codeVerifier?: string): Promise<OAuthTokenResponse> {
    if (!codeVerifier) {
      throw new Error('X OAuth requires PKCE code verifier');
    }

    // Exchange code for tokens
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const tokenRes = await fetch(`${API_BASE}/2/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      throw new Error(`X token exchange failed: ${JSON.stringify(err)}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
      scope: string;
    };

    // Get user info
    const userRes = await fetch(`${API_BASE}/2/users/me`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new Error('Failed to fetch X user info');
    }

    const userData = await userRes.json() as { data: { id: string; username: string; name: string } };

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      platformAccountId: userData.data.id,
      platformAccountName: `@${userData.data.username}`,
      scopes: tokenData.scope.split(' '),
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const res = await fetch(`${API_BASE}/2/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`X token refresh failed: ${JSON.stringify(err)}`);
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    // Get user info with new token
    const userRes = await fetch(`${API_BASE}/2/users/me`, {
      headers: { 'Authorization': `Bearer ${data.access_token}` },
    });
    const userData = await userRes.json() as { data: { id: string; username: string } };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      platformAccountId: userData.data.id,
      platformAccountName: `@${userData.data.username}`,
      scopes: data.scope.split(' '),
    };
  }

  async publishPost(accessToken: string, params: PublishParams): Promise<PublishResult> {
    // Build post text (280 char limit)
    let text = params.caption;
    if (params.link && !text.includes(params.link)) {
      // X auto-shortens URLs to 23 chars via t.co
      const availableChars = 280 - 24; // 23 chars for URL + 1 space
      if (text.length > availableChars) {
        text = text.substring(0, availableChars - 3) + '...';
      }
      text = `${text} ${params.link}`;
    }

    const postBody: Record<string, unknown> = { text };

    // TODO: Add media upload support via POST /2/media/upload
    // Requires media.write scope (already requested)

    const res = await fetch(`${API_BASE}/2/tweets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string; title?: string };
      throw new Error(`X publish failed: ${err.detail || err.title || res.statusText}`);
    }

    const data = await res.json() as { data: { id: string } };

    return {
      platformPostId: data.data.id,
      platformPostUrl: `https://x.com/i/status/${data.data.id}`,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    await fetch(`${API_BASE}/2/oauth2/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: 'access_token',
      }).toString(),
    });
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/2/users/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    return res.ok;
  }
}
