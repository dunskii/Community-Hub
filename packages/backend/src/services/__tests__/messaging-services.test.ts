/**
 * Messaging Services Integration Tests
 * Phase 9: Messaging System
 *
 * These tests verify that messaging services are properly exported and instantiated.
 * Full integration tests require a test database setup.
 */

import { describe, it, expect } from 'vitest';
import { conversationService } from '../conversation-service.js';
import { messageService } from '../message-service.js';
import { quickReplyService } from '../quick-reply-service.js';

describe('Messaging Services', () => {
  describe('ConversationService', () => {
    it('should be exported and instantiated', () => {
      expect(conversationService).toBeDefined();
      expect(typeof conversationService).toBe('object');
    });

    it('should have required methods', () => {
      expect(typeof conversationService.createConversation).toBe('function');
      expect(typeof conversationService.getConversationById).toBe('function');
      expect(typeof conversationService.getUserConversations).toBe('function');
      expect(typeof conversationService.getBusinessConversations).toBe('function');
      expect(typeof conversationService.archiveConversation).toBe('function');
      expect(typeof conversationService.unarchiveConversation).toBe('function');
      expect(typeof conversationService.blockConversation).toBe('function');
      expect(typeof conversationService.unblockConversation).toBe('function');
      expect(typeof conversationService.reportConversation).toBe('function');
      expect(typeof conversationService.getUnreadCount).toBe('function');
    });
  });

  describe('MessageService', () => {
    it('should be exported and instantiated', () => {
      expect(messageService).toBeDefined();
      expect(typeof messageService).toBe('object');
    });

    it('should have required methods', () => {
      expect(typeof messageService.getMessages).toBe('function');
      expect(typeof messageService.sendMessage).toBe('function');
      expect(typeof messageService.deleteMessage).toBe('function');
      expect(typeof messageService.markAsRead).toBe('function');
    });
  });

  describe('QuickReplyService', () => {
    it('should be exported and instantiated', () => {
      expect(quickReplyService).toBeDefined();
      expect(typeof quickReplyService).toBe('object');
    });

    it('should have required methods', () => {
      expect(typeof quickReplyService.createTemplate).toBe('function');
      expect(typeof quickReplyService.getTemplates).toBe('function');
      expect(typeof quickReplyService.getTemplateById).toBe('function');
      expect(typeof quickReplyService.updateTemplate).toBe('function');
      expect(typeof quickReplyService.deleteTemplate).toBe('function');
      expect(typeof quickReplyService.reorderTemplates).toBe('function');
    });
  });
});
