/**
 * Enquiry Service
 * Handles public business enquiries (no auth required)
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

export interface CreateEnquiryInput {
  businessId: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
}

export interface Enquiry {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  userId: string | null;
  replyMessage: string | null;
  repliedAt: string | null;
  callCount: number;
  lastCalledAt: string | null;
  createdAt: string;
  updatedAt: string;
  business?: {
    id: string;
    name: string;
    slug: string;
  };
}

function formatEnquiry(raw: Record<string, unknown>): Enquiry {
  return {
    id: raw.id as string,
    businessId: raw.business_id as string,
    name: raw.name as string,
    email: raw.email as string,
    phone: raw.phone as string | null,
    category: raw.category as string,
    subject: raw.subject as string,
    message: raw.message as string,
    status: raw.status as string,
    userId: raw.user_id as string | null,
    replyMessage: raw.reply_message as string | null,
    repliedAt: raw.replied_at ? (raw.replied_at as Date).toISOString() : null,
    callCount: (raw.call_count as number) || 0,
    lastCalledAt: raw.last_called_at ? (raw.last_called_at as Date).toISOString() : null,
    createdAt: (raw.created_at as Date).toISOString(),
    updatedAt: (raw.updated_at as Date).toISOString(),
    business: raw.businesses ? {
      id: (raw.businesses as Record<string, unknown>).id as string,
      name: (raw.businesses as Record<string, unknown>).name as string,
      slug: (raw.businesses as Record<string, unknown>).slug as string,
    } : undefined,
  };
}

class EnquiryService {
  async createEnquiry(
    input: CreateEnquiryInput,
    ipAddress?: string,
    userId?: string,
  ): Promise<Enquiry> {
    const business = await prisma.businesses.findUnique({
      where: { id: input.businessId },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!business) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    if (business.status !== 'ACTIVE') {
      throw ApiError.badRequest('BUSINESS_NOT_ACTIVE', 'Cannot enquire about an inactive business');
    }

    const enquiry = await prisma.business_enquiries.create({
      data: {
        business_id: input.businessId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        category: input.category,
        subject: input.subject.trim(),
        message: input.message.trim(),
        user_id: userId || null,
        ip_address: ipAddress || null,
      },
      include: {
        businesses: { select: { id: true, name: true, slug: true } },
      },
    });

    logger.info({ enquiryId: enquiry.id, businessId: input.businessId }, 'Business enquiry created');
    return formatEnquiry(enquiry as unknown as Record<string, unknown>);
  }

  async getBusinessEnquiries(
    businessId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ): Promise<{ enquiries: Enquiry[]; total: number }> {
    const { status, page = 1, limit = 20 } = options;
    const where: Record<string, unknown> = { business_id: businessId };
    if (status) where.status = status;

    const [enquiries, total] = await Promise.all([
      prisma.business_enquiries.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          businesses: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.business_enquiries.count({ where }),
    ]);

    return {
      enquiries: enquiries.map(e => formatEnquiry(e as unknown as Record<string, unknown>)),
      total,
    };
  }

  async getEnquiryById(id: string): Promise<Enquiry | null> {
    const enquiry = await prisma.business_enquiries.findUnique({
      where: { id },
      include: {
        businesses: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!enquiry) return null;
    return formatEnquiry(enquiry as unknown as Record<string, unknown>);
  }

  async replyToEnquiry(id: string, replyMessage: string): Promise<Enquiry> {
    const enquiry = await prisma.business_enquiries.update({
      where: { id },
      data: {
        reply_message: replyMessage.trim(),
        replied_at: new Date(),
        status: 'REPLIED',
      },
      include: {
        businesses: { select: { id: true, name: true, slug: true } },
      },
    });

    logger.info({ enquiryId: id }, 'Enquiry replied to');
    return formatEnquiry(enquiry as unknown as Record<string, unknown>);
  }

  async recordCallClick(id: string): Promise<Enquiry> {
    const enquiry = await prisma.business_enquiries.update({
      where: { id },
      data: {
        call_count: { increment: 1 },
        last_called_at: new Date(),
        status: 'READ',
      },
      include: {
        businesses: { select: { id: true, name: true, slug: true } },
      },
    });

    logger.info({ enquiryId: id, callCount: enquiry.call_count }, 'Enquiry call click recorded');
    return formatEnquiry(enquiry as unknown as Record<string, unknown>);
  }

  async updateEnquiryStatus(id: string, status: string): Promise<Enquiry> {
    const enquiry = await prisma.business_enquiries.update({
      where: { id },
      data: { status },
      include: {
        businesses: { select: { id: true, name: true, slug: true } },
      },
    });

    return formatEnquiry(enquiry as unknown as Record<string, unknown>);
  }
}

export const enquiryService = new EnquiryService();
