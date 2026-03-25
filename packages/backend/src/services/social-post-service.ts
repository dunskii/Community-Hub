/**
 * Social Post Service
 *
 * Handles creation, management, and caption generation for social media posts.
 * Spec §20: Social Media Integration, §17: Deals & Promotions
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import { getPlatformConfig } from '../config/platform-loader.js';
import { CAPTION_LIMITS } from '@community-hub/shared';
import type { SocialPlatform, SocialPostStatus, SocialContentType } from '@community-hub/shared';
import { socialPostQueue } from '../queues/social-post-queue.js';

// ─── Types ────────────────────────────────────────────────────

interface CreatePostsInput {
  platforms: SocialPlatform[];
  contentType: SocialContentType;
  contentId: string;
  caption?: string;
  imageUrl?: string;
  scheduledAt?: string;
}

interface PostFilters {
  status?: SocialPostStatus;
  platform?: SocialPlatform;
  contentType?: SocialContentType;
  page: number;
  limit: number;
}

// ─── Service ──────────────────────────────────────────────────

export class SocialPostService {
  /**
   * Create social post(s) for a deal/event across selected platforms.
   * One social_posts row per platform. Enqueues each for async publishing.
   */
  async createPosts(
    businessId: string,
    userId: string,
    input: CreatePostsInput,
  ): Promise<Array<{ id: string; platform: SocialPlatform; status: string }>> {
    // Verify connected accounts exist for requested platforms
    const accounts = await prisma.social_accounts.findMany({
      where: {
        business_id: businessId,
        platform: { in: input.platforms },
        is_active: true,
      },
    });

    const connectedPlatforms = new Set(accounts.map(a => a.platform));
    const missingPlatforms = input.platforms.filter(p => !connectedPlatforms.has(p));
    if (missingPlatforms.length > 0) {
      throw ApiError.badRequest(
        'PLATFORMS_NOT_CONNECTED',
        `Not connected to: ${missingPlatforms.join(', ')}`,
      );
    }

    // Verify content exists
    await this.verifyContentExists(input.contentType, input.contentId, businessId);

    // Instagram requires an image for every post
    if (input.platforms.includes('INSTAGRAM') && !input.imageUrl) {
      throw ApiError.badRequest(
        'INSTAGRAM_REQUIRES_IMAGE',
        'Instagram requires an image for every post. Please provide an image URL.',
      );
    }

    const results: Array<{ id: string; platform: SocialPlatform; status: string }> = [];

    for (const account of accounts) {
      // Generate caption per platform if not provided
      const caption = input.caption || await this.generateCaption(
        input.contentType,
        input.contentId,
        account.platform,
      );

      // Truncate caption to platform limit
      const limit = CAPTION_LIMITS[account.platform];
      const truncatedCaption = caption.length > limit
        ? caption.substring(0, limit - 3) + '...'
        : caption;

      const post = await prisma.social_posts.create({
        data: {
          business_id: businessId,
          social_account_id: account.id,
          content_type: input.contentType,
          content_id: input.contentId,
          platform: account.platform,
          caption: truncatedCaption,
          image_url: input.imageUrl || null,
          status: input.scheduledAt ? 'PENDING' : 'QUEUED',
          scheduled_at: input.scheduledAt ? new Date(input.scheduledAt) : null,
          created_by: userId,
        },
      });

      // Log creation
      await prisma.social_post_logs.create({
        data: {
          social_post_id: post.id,
          action: 'CREATED',
          details: { platform: account.platform, contentType: input.contentType },
        },
      });

      // Enqueue for immediate publishing (unless scheduled)
      if (!input.scheduledAt) {
        await socialPostQueue.enqueue({
          socialPostId: post.id,
          platform: account.platform,
          retryCount: 0,
          queuedAt: new Date().toISOString(),
        });
      }

      results.push({
        id: post.id,
        platform: account.platform,
        status: post.status,
      });
    }

    logger.info(
      { businessId, contentType: input.contentType, contentId: input.contentId, platforms: input.platforms },
      `Created ${results.length} social post(s)`,
    );

    return results;
  }

  /**
   * Cancel a pending/queued post.
   */
  async cancelPost(postId: string, businessId: string): Promise<void> {
    const post = await prisma.social_posts.findFirst({
      where: { id: postId, business_id: businessId },
    });

    if (!post) {
      throw ApiError.notFound('SOCIAL_POST_NOT_FOUND', 'Social post not found');
    }

    if (!['PENDING', 'QUEUED'].includes(post.status)) {
      throw ApiError.badRequest('CANNOT_CANCEL', `Cannot cancel a post with status: ${post.status}`);
    }

    await prisma.social_posts.update({
      where: { id: postId },
      data: { status: 'CANCELLED' },
    });

    await prisma.social_post_logs.create({
      data: {
        social_post_id: postId,
        action: 'CANCELLED',
      },
    });
  }

  /**
   * Retry a failed post.
   */
  async retryPost(postId: string, businessId: string): Promise<void> {
    const post = await prisma.social_posts.findFirst({
      where: { id: postId, business_id: businessId },
    });

    if (!post) {
      throw ApiError.notFound('SOCIAL_POST_NOT_FOUND', 'Social post not found');
    }

    if (post.status !== 'FAILED') {
      throw ApiError.badRequest('CANNOT_RETRY', 'Can only retry failed posts');
    }

    await prisma.social_posts.update({
      where: { id: postId },
      data: {
        status: 'QUEUED',
        error_message: null,
        retry_count: { increment: 1 },
      },
    });

    await socialPostQueue.enqueue({
      socialPostId: post.id,
      platform: post.platform,
      retryCount: post.retry_count + 1,
      queuedAt: new Date().toISOString(),
    });

    await prisma.social_post_logs.create({
      data: {
        social_post_id: postId,
        action: 'RETRIED',
      },
    });
  }

  /**
   * Get posts for a business with filters.
   */
  async getPostsForBusiness(businessId: string, filters: PostFilters) {
    const where: Record<string, unknown> = { business_id: businessId };
    if (filters.status) where.status = filters.status;
    if (filters.platform) where.platform = filters.platform;
    if (filters.contentType) where.content_type = filters.contentType;

    const [posts, total] = await Promise.all([
      prisma.social_posts.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          social_accounts: {
            select: { platform_account_name: true },
          },
        },
      }),
      prisma.social_posts.count({ where }),
    ]);

    return {
      posts: posts.map(p => ({
        id: p.id,
        businessId: p.business_id,
        socialAccountId: p.social_account_id,
        accountName: p.social_accounts.platform_account_name,
        contentType: p.content_type,
        contentId: p.content_id,
        platform: p.platform,
        caption: p.caption,
        imageUrl: p.image_url,
        platformPostId: p.platform_post_id,
        platformPostUrl: p.platform_post_url,
        status: p.status,
        scheduledAt: p.scheduled_at?.toISOString() || null,
        publishedAt: p.published_at?.toISOString() || null,
        errorMessage: p.error_message,
        retryCount: p.retry_count,
        createdAt: p.created_at.toISOString(),
      })),
      total,
      page: filters.page,
      pages: Math.ceil(total / filters.limit),
    };
  }

  /**
   * Get posts for a specific content item (deal or event).
   */
  async getPostsForContent(contentType: string, contentId: string) {
    const posts = await prisma.social_posts.findMany({
      where: { content_type: contentType, content_id: contentId },
      orderBy: { created_at: 'desc' },
      include: {
        social_accounts: {
          select: { platform_account_name: true },
        },
      },
    });

    return posts.map(p => ({
      id: p.id,
      platform: p.platform,
      accountName: p.social_accounts.platform_account_name,
      status: p.status,
      platformPostUrl: p.platform_post_url,
      publishedAt: p.published_at?.toISOString() || null,
      errorMessage: p.error_message,
    }));
  }

  /**
   * Generate a platform-appropriate caption from deal/event data.
   */
  async generateCaption(
    contentType: SocialContentType,
    contentId: string,
    platform: SocialPlatform,
  ): Promise<string> {
    if (contentType === 'DEAL') {
      return this.generateDealCaption(contentId, platform);
    }
    return this.generateEventCaption(contentId, platform);
  }

  /** Get locale string from platform config for date formatting */
  private getLocale(): string {
    try {
      const config = getPlatformConfig();
      return config.multilingual.defaultLanguage || 'en';
    } catch {
      return 'en';
    }
  }

  private async generateDealCaption(dealId: string, platform: SocialPlatform): Promise<string> {
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
      include: {
        businesses: { select: { name: true, slug: true } },
      },
    });

    if (!deal) throw ApiError.notFound('DEAL_NOT_FOUND', 'Deal not found');

    const limit = CAPTION_LIMITS[platform];
    const businessName = deal.businesses.name;
    const title = deal.title;
    const description = deal.description;

    // Build discount string
    let discountInfo = '';
    if (deal.discount_type === 'PERCENTAGE' && deal.discount_value) {
      discountInfo = `Save ${deal.discount_value}%!`;
    } else if (deal.discount_type === 'FIXED' && deal.discount_value) {
      discountInfo = `$${deal.discount_value} off!`;
    } else if (deal.discount_type === 'BOGO') {
      discountInfo = 'Buy one, get one free!';
    } else if (deal.discount_type === 'FREE_ITEM') {
      discountInfo = 'Free item included!';
    }

    // Format dates
    const validFrom = deal.valid_from.toLocaleDateString(this.getLocale(), { day: 'numeric', month: 'short' });
    const validUntil = deal.valid_until.toLocaleDateString(this.getLocale(), { day: 'numeric', month: 'short' });

    // Build caption parts
    const parts: string[] = [];
    parts.push(`${title} at ${businessName}`);
    if (discountInfo) parts.push(discountInfo);

    // Add description (truncated for short platforms)
    if (platform === 'TWITTER') {
      // Twitter: keep it very short
      if (description.length <= 80) parts.push(description);
    } else {
      parts.push(description);
    }

    parts.push(`Valid: ${validFrom} - ${validUntil}`);

    let caption = parts.join('\n\n');

    // Truncate to platform limit
    if (caption.length > limit) {
      caption = caption.substring(0, limit - 3) + '...';
    }

    return caption;
  }

  private async generateEventCaption(eventId: string, platform: SocialPlatform): Promise<string> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
    });

    if (!event) throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found');

    const limit = CAPTION_LIMITS[platform];
    const startDate = event.start_time.toLocaleDateString(this.getLocale(), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const startTime = event.start_time.toLocaleTimeString(this.getLocale(), {
      hour: '2-digit', minute: '2-digit',
    });

    const parts: string[] = [];
    parts.push(event.title);
    parts.push(`${startDate} at ${startTime}`);
    if (event.description && platform !== 'TWITTER') {
      const desc = event.description.length > 200
        ? event.description.substring(0, 197) + '...'
        : event.description;
      parts.push(desc);
    }
    if (event.cost) parts.push(`Cost: ${event.cost}`);

    let caption = parts.join('\n\n');
    if (caption.length > limit) {
      caption = caption.substring(0, limit - 3) + '...';
    }

    return caption;
  }

  /**
   * Verify that the content (deal/event) exists and belongs to the business.
   */
  async verifyContentExists(
    contentType: SocialContentType,
    contentId: string,
    businessId: string,
  ): Promise<void> {
    if (contentType === 'DEAL') {
      const deal = await prisma.deals.findFirst({
        where: { id: contentId, business_id: businessId },
      });
      if (!deal) {
        throw ApiError.notFound('DEAL_NOT_FOUND', 'Deal not found for this business');
      }
    } else if (contentType === 'EVENT') {
      const event = await prisma.events.findFirst({
        where: { id: contentId, linked_business_id: businessId },
      });
      if (!event) {
        throw ApiError.notFound('EVENT_NOT_FOUND', 'Event not found for this business');
      }
    }
  }
}

export const socialPostService = new SocialPostService();
