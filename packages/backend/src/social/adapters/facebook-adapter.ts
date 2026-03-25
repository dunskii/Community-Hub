/**
 * Facebook Page Adapter
 *
 * Implements OAuth 2.0 and posting to Facebook Pages via Graph API v21.0.
 * Scopes: pages_manage_posts, pages_show_list, pages_read_engagement
 *
 * Token lifecycle:
 * - Short-lived user token (1-2 hours) -> exchanged for long-lived user token (60 days)
 * - Long-lived user token -> used to get Page Access Token (never expires)
 */

import type { SocialPlatformAdapter, OAuthTokenResponse, PublishParams, PublishResult } from '../types.js';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const OAUTH_BASE = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`;

export class FacebookAdapter implements SocialPlatformAdapter {
  readonly platform = 'FACEBOOK' as const;

  private get appId(): string {
    return process.env['FACEBOOK_APP_ID'] || '';
  }

  private get appSecret(): string {
    return process.env['FACEBOOK_APP_SECRET'] || '';
  }

  getAuthUrl(_businessId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      state,
      scope: 'pages_manage_posts,pages_show_list,pages_read_engagement',
      response_type: 'code',
    });

    return `${OAUTH_BASE}?${params.toString()}`;
  }

  async handleCallback(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    // 1. Exchange code for short-lived user token
    const tokenUrl = `${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code,
    }).toString()}`;

    const tokenRes = await fetch(tokenUrl);
    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      throw new Error(`Facebook token exchange failed: ${(err as Record<string, unknown>).error || tokenRes.statusText}`);
    }
    const tokenData = await tokenRes.json() as { access_token: string; token_type: string; expires_in?: number };

    // 2. Exchange short-lived token for long-lived token
    const longLivedUrl = `${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: tokenData.access_token,
    }).toString()}`;

    const longLivedRes = await fetch(longLivedUrl);
    if (!longLivedRes.ok) {
      throw new Error('Facebook long-lived token exchange failed');
    }
    const longLivedData = await longLivedRes.json() as { access_token: string; expires_in?: number };

    // 3. Get the user's managed pages
    const pagesUrl = `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token&access_token=${longLivedData.access_token}`;
    const pagesRes = await fetch(pagesUrl);
    if (!pagesRes.ok) {
      throw new Error('Failed to fetch Facebook pages');
    }
    const pagesData = await pagesRes.json() as { data: Array<{ id: string; name: string; access_token: string }> };

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook Pages found. You must be an admin of at least one Facebook Page.');
    }

    // Use the first page (in the future, let user choose)
    const page = pagesData.data[0]!;

    return {
      accessToken: page.access_token,
      // Page tokens derived from long-lived user tokens don't expire
      expiresIn: undefined,
      platformAccountId: page.id,
      platformAccountName: page.name,
      scopes: ['pages_manage_posts', 'pages_show_list', 'pages_read_engagement'],
    };
  }

  async refreshToken(_refreshToken: string): Promise<OAuthTokenResponse> {
    // Facebook Page tokens obtained from long-lived user tokens don't expire.
    // If the token is invalid, the user needs to re-authenticate.
    throw new Error('Facebook Page tokens do not expire. Re-authenticate if the token is invalid.');
  }

  async publishPost(accessToken: string, params: PublishParams): Promise<PublishResult> {
    const pageId = params.platformAccountId;
    let response: Response;
    let result: Record<string, unknown>;

    if (params.imageUrl) {
      // Post with photo
      const url = `${GRAPH_API_BASE}/${pageId}/photos`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: params.imageUrl,
          message: params.caption,
          access_token: accessToken,
        }),
      });
    } else {
      // Text/link post
      const body: Record<string, string> = {
        message: params.caption,
        access_token: accessToken,
      };
      if (params.link) {
        body.link = params.link;
      }

      const url = `${GRAPH_API_BASE}/${pageId}/feed`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(`Facebook publish failed: ${err.error?.message || response.statusText}`);
    }

    result = await response.json() as Record<string, unknown>;
    const postId = (result.id || result.post_id) as string;

    return {
      platformPostId: postId,
      platformPostUrl: `https://www.facebook.com/${postId}`,
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    const url = `${GRAPH_API_BASE}/me/permissions?access_token=${accessToken}`;
    await fetch(url, { method: 'DELETE' });
    // Best-effort revocation - don't throw on failure
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const url = `${GRAPH_API_BASE}/me?access_token=${accessToken}`;
    const res = await fetch(url);
    return res.ok;
  }
}
