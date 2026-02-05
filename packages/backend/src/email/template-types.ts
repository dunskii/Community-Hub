/**
 * Spec Appendix A.19: EmailTemplate model
 * Template keys must match database template_key column.
 */
export type EmailTemplateKey =
  | 'email_verification'
  | 'password_reset';
  // Future templates (Phase 2+):
  // | 'welcome'
  // | 'password_changed'
  // | 'business_claim_notification'
  // | 'claim_approved'
  // | 'claim_rejected'
  // | 'new_message'
  // | 'new_review'
  // | 'event_reminder'
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
}

/**
 * Supported languages (from platform.json multilingual.supportedLanguages)
 */
export type LanguageCode = 'en' | 'ar' | 'zh-CN' | 'zh-TW' | 'vi' | 'hi' | 'ur' | 'ko' | 'el' | 'it';
