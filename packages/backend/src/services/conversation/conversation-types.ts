/**
 * Conversation Types
 * Phase 9: Messaging System — Type definitions
 *
 * All interfaces and type aliases used by the conversation service modules.
 */

import type { ConversationStatus, SubjectCategory, SenderType } from '../../generated/prisma/index.js';

export type { AuditContext, PaginationOptions } from '../../types/service-types.js';

// ─── Domain types ────────────────────────────────────────────

export interface ConversationSummary {
  id: string;
  businessId: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
  subject: string;
  subjectCategory: SubjectCategory;
  status: ConversationStatus;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithMessages {
  id: string;
  businessId: string;
  business: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    email: string | null;
    phone: string;
  };
  userId: string;
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
  subject: string;
  subjectCategory: SubjectCategory;
  status: ConversationStatus;
  lastMessageAt: Date | null;
  unreadCountBusiness: number;
  unreadCountUser: number;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageWithAttachments[];
}

export interface MessageWithAttachments {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId: string;
  content: string;
  readAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  attachments: {
    id: string;
    url: string;
    altText: string | null;
    sizeBytes: number;
    mimeType: string;
  }[];
}

export interface PaginatedConversations {
  conversations: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
