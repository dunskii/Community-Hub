/**
 * Spec Appendix A.19: EmailTemplate model
 * Template keys must match database template_key column.
 */
export type EmailTemplateKey =
  | 'email_verification'
  | 'password_reset'
  | 'welcome'
  | 'password_changed'
  | 'event_cancellation'
  | 'event_reminder_24h'
  | 'event_reminder_1h'
  | 'event_update';
  // Future templates:
  // | 'business_claim_notification'
  // | 'claim_approved'
  // | 'claim_rejected'
  // | 'new_message'
  // | 'new_review'
  // | 'deal_alert'
  // | 'emergency_alert';

/**
 * Variables for each template.
 * Used for validation and type-safe variable substitution.
 */
export interface TemplateVariables {
  email_verification: {
    userName: string;
    verificationLink: string;
    expiryHours: number; // 24
  };
  password_reset: {
    userName: string;
    resetLink: string;
    expiryMinutes: number; // 60
    ipAddress: string;
    timestamp: string;
  };
  welcome: {
    userName: string;
  };
  password_changed: {
    userName: string;
  };
  event_cancellation: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    organizerName: string;
    rsvpStatus: string;
  };
  event_reminder_24h: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    onlineUrl: string;
    organizerName: string;
  };
  event_reminder_1h: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    onlineUrl: string;
    organizerName: string;
  };
  event_update: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    organizerName: string;
    changes: string;
  };
}

/**
 * Supported languages (from platform.json multilingual.supportedLanguages)
 */
export type LanguageCode = 'en' | 'ar' | 'zh-CN' | 'zh-TW' | 'vi' | 'hi' | 'ur' | 'ko' | 'el' | 'it';
