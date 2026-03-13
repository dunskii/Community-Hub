/**
 * Messaging Components
 * Phase 9: Messaging System
 * Exports all messaging-related components
 */

export { MessageBubble } from './MessageBubble';
export type { MessageBubbleProps, MessageAttachment } from './MessageBubble';

export { MessageInput } from './MessageInput';
export type { MessageInputProps } from './MessageInput';

export { ConversationList } from './ConversationList';
export type { ConversationListProps, ConversationSummary } from './ConversationList';

export { ConversationView } from './ConversationView';
export type {
  ConversationViewProps,
  ConversationDetails,
  Message,
  QuickReplyTemplate,
} from './ConversationView';

export { NewConversationForm } from './NewConversationForm';
export type { NewConversationFormProps, BusinessInfo } from './NewConversationForm';
