/**
 * Instagram Adapter
 *
 * Implements posting to Instagram Business/Creator accounts via Facebook Graph API.
 * Instagram publishing uses a container-based flow:
 *   1. Create a media container (image + caption)
 *   2. Publish the container
 *
 * Requirements:
 * - Instagram account must be Professional (Business or Creator)
 * - Must be linked to a Facebook Page
 * - Uses the same Facebook App credentials
 *
 * Scopes: instagram_basic, instagram_content_publish
 */

import type { SocialPlatformAdapter, OAuthTokenResponse, PublishParams, PublishResult } from '../types.js';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const OAUTH_BASE = `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`;

export class InstagramAdapter implements SocialPlatformAdapter {
  readonly platform = 'INSTAGRAM' as const;

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
      scope: 'pages_show_list,instagram_basic,instagram_content_publish',
      response_type: 'code',
    });

    return `${OAUTH_BASE}?${params.toString()}`;
  }

  async handleCallback(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    // 1. Exchange code for user token (same as Facebook)
    const tokenUrl = `${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code,
    }).toString()}`;

    const tokenRes = await fetch(tokenUrl);
    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      throw new Error(`Instagram token exchange failed: ${(err as Record<string, unknown>).error || tokenRes.statusText}`);
    }
    const tokenData = await tokenRes.json() as { access_token: string };

    // 2. Exchange for long-lived token
    const longLivedUrl = `${GRAPH_API_BASE}/oauth/access_token?${new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: tokenData.access_token,
    }).toString()}`;

    const longLivedRes = await fetch(longLivedUrl);
    if (!longLivedRes.ok) {
      throw new Error('Instagram long-lived token exchange failed');
    }
    const longLivedData = await longLivedRes.json() as { access_token: string; expires_in?: number };

    // 3. Get pages and find the one with an Instagram account
    const pagesUrl = `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${longLivedData.access_token}`;
    const pagesRes = await fetch(pagesUrl);
    if (!pagesRes.ok) {
      throw new Error('Failed to fetch Instagram accounts');
    }

    interface PageData {
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string; username: string };
    }
    const pagesData = await pagesRes.json() as { data: PageData[] };

    // Find the first page with an Instagram business account
    const pageWithIG = pagesData.data.find(p => p.instagram_business_account);
    if (!pageWithIG || !pageWithIG.instagram_business_account) {
      throw new Error('No Instagram Business account found. Your Instagram must be a Professional account linked to a Facebook Page.');
    }

    const igAccount = pageWithIG.instagram_business_account;

    return {
      accessToken: pageWithIG.access_token,
      expiresIn: undefined, // Page token doesn't expire
      platformAccountId: igAccount.id,
      platformAccountName: `@${igAccount.username}`,
      scopes: ['instagram_basic', 'instagram_content_publish'],
    };
  }

  async refreshToken(_refreshToken: string): Promise<OAuthTokenResponse> {
    throw new Error('Instagram tokens derived from Facebook Page tokens do not expire. Re-authenticate if invalid.');
  }

  async publishPost(accessToken: string, params: PublishParams): Promise<PublishResult> {
    const igUserId = params.platformAccountId;

    if (!params.imageUrl) {
      throw new Error('Instagram requires an image for every post');
    }

    // Step 1: Create media container
    const containerBody: Record<string, string> = {
      image_url: params.imageUrl,
      caption: params.caption,
      access_token: accessToken,
    };

    const containerUrl = `${GRAPH_API_BASE}/${igUserId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    });

    if (!containerRes.ok) {
      const err = await containerRes.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(`Instagram container creation failed: ${err.error?.message || containerRes.statusText}`);
    }

    const containerData = await containerRes.json() as { id: string };

    // Step 2: Wait for container to be ready (poll if needed)
    await this.waitForContainer(igUserId, containerData.id, accessToken);

    // Step 3: Publish the container
    const publishUrl = `${GRAPH_API_BASE}/${igUserId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: accessToken,
      }),
    });

    if (!publishRes.ok) {
      const err = await publishRes.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(`Instagram publish failed: ${err.error?.message || publishRes.statusText}`);
    }

    const publishData = await publishRes.json() as { id: string };

    // Get the permalink
    const permalinkRes = await fetch(`${GRAPH_API_BASE}/${publishData.id}?fields=permalink&access_token=${accessToken}`);
    let permalink: string | undefined;
    if (permalinkRes.ok) {
      const data = await permalinkRes.json() as { permalink?: string };
      permalink = data.permalink;
    }

    return {
      platformPostId: publishData.id,
      platformPostUrl: permalink,
    };
  }

  /** Poll container status until FINISHED or timeout */
  private async waitForContainer(_igUserId: string, containerId: string, accessToken: string, maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const statusUrl = `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`;
      const res = await fetch(statusUrl);
      if (res.ok) {
        const data = await res.json() as { status_code?: string };
        if (data.status_code === 'FINISHED') return;
        if (data.status_code === 'ERROR') {
          throw new Error('Instagram media container failed to process');
        }
      }
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Instagram media container processing timed out');
  }

  async revokeToken(accessToken: string): Promise<void> {
    const url = `${GRAPH_API_BASE}/me/permissions?access_token=${accessToken}`;
    await fetch(url, { method: 'DELETE' });
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const url = `${GRAPH_API_BASE}/me?access_token=${accessToken}`;
    const res = await fetch(url);
    return res.ok;
  }
}
