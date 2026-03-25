/**
 * LinkedIn Adapter
 *
 * Implements OAuth 2.0 and posting to LinkedIn organization pages
 * via the Community Management API.
 *
 * Token lifecycle:
 * - Access token: 60 days
 * - Refresh token: 365 days
 *
 * Requires LinkedIn Partner Program approval for w_organization_social scope.
 */

import type { SocialPlatformAdapter, OAuthTokenResponse, PublishParams, PublishResult } from '../types.js';

const OAUTH_BASE = 'https://www.linkedin.com/oauth/v2';
const API_BASE = 'https://api.linkedin.com';

export class LinkedInAdapter implements SocialPlatformAdapter {
  readonly platform = 'LINKEDIN' as const;

  private get clientId(): string {
    return process.env['LINKEDIN_CLIENT_ID'] || '';
  }

  private get clientSecret(): string {
    return process.env['LINKEDIN_CLIENT_SECRET'] || '';
  }

  getAuthUrl(_businessId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'w_member_social r_liteprofile r_organization_social w_organization_social',
    });

    return `${OAUTH_BASE}/authorization?${params.toString()}`;
  }

  async handleCallback(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    // Exchange code for tokens
    const tokenRes = await fetch(`${OAUTH_BASE}/accessToken`, {
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
      throw new Error(`LinkedIn token exchange failed: ${JSON.stringify(err)}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      refresh_token_expires_in?: number;
      scope: string;
    };

    // Get user's organizations (company pages)
    const orgsRes = await fetch(`${API_BASE}/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    let orgId: string;
    let orgName: string;

    if (orgsRes.ok) {
      const orgsData = await orgsRes.json() as {
        elements?: Array<{
          'organization~'?: { id: number; localizedName: string };
        }>;
      };

      const firstOrg = orgsData.elements?.[0]?.['organization~'];
      if (firstOrg) {
        orgId = String(firstOrg.id);
        orgName = firstOrg.localizedName;
      } else {
        // Fall back to personal profile
        const profileRes = await fetch(`${API_BASE}/v2/me`, {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });
        const profileData = await profileRes.json() as { id: string; localizedFirstName: string; localizedLastName: string };
        orgId = profileData.id;
        orgName = `${profileData.localizedFirstName} ${profileData.localizedLastName}`;
      }
    } else {
      // Fallback to personal profile
      const profileRes = await fetch(`${API_BASE}/v2/me`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      const profileData = await profileRes.json() as { id: string; localizedFirstName: string; localizedLastName: string };
      orgId = profileData.id;
      orgName = `${profileData.localizedFirstName} ${profileData.localizedLastName}`;
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      platformAccountId: orgId,
      platformAccountName: orgName,
      scopes: tokenData.scope.split(' '),
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const res = await fetch(`${OAUTH_BASE}/accessToken`, {
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
      throw new Error(`LinkedIn token refresh failed: ${JSON.stringify(err)}`);
    }

    const data = await res.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      platformAccountId: '', // Will be preserved from existing account
      platformAccountName: '',
      scopes: data.scope.split(' '),
    };
  }

  async publishPost(accessToken: string, params: PublishParams): Promise<PublishResult> {
    const authorUrn = params.platformAccountId.match(/^\d+$/)
      ? `urn:li:organization:${params.platformAccountId}`
      : `urn:li:person:${params.platformAccountId}`;

    const postBody: Record<string, unknown> = {
      author: authorUrn,
      commentary: params.caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
    };

    // Add article link if provided
    if (params.link) {
      postBody.content = {
        article: {
          source: params.link,
          title: params.caption.substring(0, 100),
          ...(params.imageUrl ? { thumbnail: params.imageUrl } : {}),
        },
      };
    }

    const res = await fetch(`${API_BASE}/rest/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify(postBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(`LinkedIn publish failed: ${err.message || res.statusText}`);
    }

    // LinkedIn returns the post URN in the x-restli-id header
    const postUrn = res.headers.get('x-restli-id') || '';
    const postId = postUrn.replace('urn:li:share:', '');

    return {
      platformPostId: postUrn,
      platformPostUrl: postId ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined,
    };
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // LinkedIn does not have a public token revocation endpoint.
    // Token will expire naturally (60 days access, 365 days refresh).
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/v2/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    return res.ok;
  }
}
