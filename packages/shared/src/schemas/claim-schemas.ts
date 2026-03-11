import { z } from 'zod';

/**
 * Business Claim validation schemas
 * Phase 7: Business Owner Features
 *
 * Spec §13.1: Business Claim & Verification
 */

// Verification methods enum
export const verificationMethodSchema = z.enum(['PHONE', 'EMAIL', 'DOCUMENT', 'GOOGLE_BUSINESS'], {
  errorMap: () => ({ message: 'Invalid verification method' }),
});

// Phone number validation (E.164 format)
const phoneNumberSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, {
  message: 'Phone number must be in E.164 format (e.g., +61412345678)',
});

// Email validation
const businessEmailSchema = z.string().email({ message: 'Invalid email address' });

// Document types
const documentTypeSchema = z.enum(['abn', 'utility_bill', 'business_registration'], {
  errorMap: () => ({ message: 'Invalid document type' }),
});

/**
 * Claim initiation schema
 */
export const claimInitiateSchema = z
  .object({
    verificationMethod: verificationMethodSchema,

    // Phone verification
    phoneNumber: phoneNumberSchema.optional(),

    // Email verification
    businessEmail: businessEmailSchema.optional(),

    // Document verification
    documentType: documentTypeSchema.optional(),
    documentUrls: z
      .array(z.string().url({ message: 'Invalid document URL' }))
      .max(3, { message: 'Maximum 3 documents allowed' })
      .optional(),

    // Google Business verification
    googleAuthCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate required fields based on verification method
    switch (data.verificationMethod) {
      case 'PHONE':
        if (!data.phoneNumber) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Phone number is required for phone verification',
            path: ['phoneNumber'],
          });
        }
        break;
      case 'EMAIL':
        if (!data.businessEmail) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Business email is required for email verification',
            path: ['businessEmail'],
          });
        }
        break;
      case 'DOCUMENT':
        if (!data.documentType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Document type is required for document verification',
            path: ['documentType'],
          });
        }
        if (!data.documentUrls || data.documentUrls.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'At least one document is required',
            path: ['documentUrls'],
          });
        }
        break;
      case 'GOOGLE_BUSINESS':
        if (!data.googleAuthCode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Google authorization code is required',
            path: ['googleAuthCode'],
          });
        }
        break;
    }
  });

/**
 * Phone PIN verification schema
 */
export const verifyPhonePINSchema = z.object({
  pin: z
    .string()
    .length(6, { message: 'PIN must be 6 digits' })
    .regex(/^\d{6}$/, { message: 'PIN must contain only numbers' }),
});

/**
 * Claim appeal schema
 */
export const claimAppealSchema = z.object({
  reason: z
    .string()
    .min(50, { message: 'Appeal reason must be at least 50 characters' })
    .max(1000, { message: 'Appeal reason cannot exceed 1000 characters' }),
});

/**
 * Claim rejection schema (moderator)
 */
export const claimRejectSchema = z.object({
  reason: z
    .string()
    .min(10, { message: 'Rejection reason must be at least 10 characters' })
    .max(500, { message: 'Rejection reason cannot exceed 500 characters' }),
});

/**
 * Claim approval schema (moderator)
 */
export const claimApproveSchema = z.object({
  notes: z.string().max(500, { message: 'Notes cannot exceed 500 characters' }).optional(),
});

// Export types
export type VerificationMethod = z.infer<typeof verificationMethodSchema>;
export type ClaimInitiateInput = z.infer<typeof claimInitiateSchema>;
export type VerifyPhonePINInput = z.infer<typeof verifyPhonePINSchema>;
export type ClaimAppealInput = z.infer<typeof claimAppealSchema>;
export type ClaimRejectInput = z.infer<typeof claimRejectSchema>;
export type ClaimApproveInput = z.infer<typeof claimApproveSchema>;
