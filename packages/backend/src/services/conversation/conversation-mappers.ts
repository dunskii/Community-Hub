/**
 * Conversation Mappers
 * Phase 9: Messaging System — snake_case to camelCase mapping
 *
 * Centralises the Prisma row -> domain object transformations that were
 * previously copy-pasted across multiple service methods.
 */

import type {
  ConversationSummary,
  ConversationWithMessages,
  MessageWithAttachments,
} from './conversation-types.js';

// ─── Prisma result shapes (structural types, no coupling to Prisma client) ──

/** Shape returned when including businesses + users + last message for list views */
export interface RawConversationSummary {
  id: string;
  business_id: string;
  businesses: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  user_id: string;
  users: {
    id: string;
    display_name: string;
    profile_photo: string | null;
  };
  subject: string;
  subject_category: ConversationSummary['subjectCategory'];
  status: ConversationSummary['status'];
  last_message_at: Date | null;
  unread_count_user: number;
  unread_count_business: number;
  created_at: Date;
  updated_at: Date;
  messages: { content: string }[];
}

/** Shape returned when including full messages + attachments for detail views */
export interface RawConversationWithMessages {
  id: string;
  business_id: string;
  businesses: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    email: string | null;
    phone: string;
    claimed_by: string | null;
  };
  user_id: string;
  users: {
    id: string;
    display_name: string;
    profile_photo: string | null;
  };
  subject: string;
  subject_category: ConversationWithMessages['subjectCategory'];
  status: ConversationWithMessages['status'];
  last_message_at: Date | null;
  unread_count_business: number;
  unread_count_user: number;
  created_at: Date;
  updated_at: Date;
  messages: RawMessageWithAttachments[];
}

export interface RawMessageWithAttachments {
  id: string;
  conversation_id: string;
  sender_type: MessageWithAttachments['senderType'];
  sender_id: string;
  content: string;
  read_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  message_attachments: {
    id: string;
    url: string;
    alt_text: string | null;
    size_bytes: number;
    mime_type: string;
  }[];
}

// ─── Mappers ─────────────────────────────────────────────────

/**
 * Map a single message row (with attachments) to the domain shape.
 */
export function mapMessageWithAttachments(msg: RawMessageWithAttachments): MessageWithAttachments {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderType: msg.sender_type,
    senderId: msg.sender_id,
    content: msg.content,
    readAt: msg.read_at,
    deletedAt: msg.deleted_at,
    createdAt: msg.created_at,
    attachments: msg.message_attachments.map((att) => ({
      id: att.id,
      url: att.url,
      altText: att.alt_text,
      sizeBytes: att.size_bytes,
      mimeType: att.mime_type,
    })),
  };
}

/**
 * Map a conversation summary row to the domain shape.
 *
 * @param unreadField - which unread counter to expose: 'user' or 'business'
 */
export function mapConversationSummary(
  conv: RawConversationSummary,
  unreadField: 'user' | 'business'
): ConversationSummary {
  return {
    id: conv.id,
    businessId: conv.business_id,
    business: {
      id: conv.businesses.id,
      name: conv.businesses.name,
      slug: conv.businesses.slug,
      logo: conv.businesses.logo,
    },
    userId: conv.user_id,
    user: {
      id: conv.users.id,
      displayName: conv.users.display_name,
      profilePhoto: conv.users.profile_photo,
    },
    subject: conv.subject,
    subjectCategory: conv.subject_category,
    status: conv.status,
    lastMessageAt: conv.last_message_at,
    lastMessagePreview: conv.messages[0]?.content?.substring(0, 100) || null,
    unreadCount:
      unreadField === 'user' ? conv.unread_count_user : conv.unread_count_business,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
  };
}

/**
 * Map a full conversation row (with messages) to the domain shape.
 */
export function mapConversationWithMessages(
  conv: RawConversationWithMessages
): ConversationWithMessages {
  return {
    id: conv.id,
    businessId: conv.business_id,
    business: {
      id: conv.businesses.id,
      name: conv.businesses.name,
      slug: conv.businesses.slug,
      logo: conv.businesses.logo,
      email: conv.businesses.email,
      phone: conv.businesses.phone,
    },
    userId: conv.user_id,
    user: {
      id: conv.users.id,
      displayName: conv.users.display_name,
      profilePhoto: conv.users.profile_photo,
    },
    subject: conv.subject,
    subjectCategory: conv.subject_category,
    status: conv.status,
    lastMessageAt: conv.last_message_at,
    unreadCountBusiness: conv.unread_count_business,
    unreadCountUser: conv.unread_count_user,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
    messages: conv.messages.map(mapMessageWithAttachments),
  };
}
