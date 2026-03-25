/**
 * GBP Claim Verification Tests
 *
 * Tests the Google Business Profile ownership verification flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
vi.mock('../../../db/index.js', () => ({
  prisma: {
    social_accounts: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    business_claim_requests: { create: (...args: unknown[]) => mockCreate(...args) },
    businesses: { update: (...args: unknown[]) => mockUpdate(...args) },
  },
}));

// Mock audit logger
const mockCreateAuditLog = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../utils/audit-logger.js', () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { initiateGoogleBusinessVerification } from '../../../services/claim/document-verification.js';

const auditContext = {
  actorId: 'user-1',
  actorRole: 'USER',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

describe('initiateGoogleBusinessVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if no GBP account is connected', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      initiateGoogleBusinessVerification(
        { businessId: 'biz-1', verificationMethod: 'GOOGLE_BUSINESS' },
        'user-1',
        auditContext,
      ),
    ).rejects.toThrow('Connect your Google Business Profile account');
  });

  it('auto-approves when GBP account is connected', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'social-1',
      platform_account_id: 'accounts/123/locations/456',
      platform_account_name: 'My Business',
    });

    mockCreate.mockResolvedValue({
      id: 'claim-1',
      business_id: 'biz-1',
      verification_method: 'GOOGLE_BUSINESS',
      verification_status: 'VERIFIED',
      claim_status: 'APPROVED',
    });

    mockUpdate.mockResolvedValue({});

    const result = await initiateGoogleBusinessVerification(
      { businessId: 'biz-1', verificationMethod: 'GOOGLE_BUSINESS' },
      'user-1',
      auditContext,
    );

    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.claimStatus).toBe('APPROVED');
    expect(result.verificationMethod).toBe('GOOGLE_BUSINESS');
    expect(result.message).toContain('verified through Google Business Profile');
  });

  it('creates claim request with APPROVED status', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'social-1',
      platform_account_id: 'accounts/123/locations/456',
      platform_account_name: 'My Business',
    });

    mockCreate.mockResolvedValue({ id: 'claim-1' });
    mockUpdate.mockResolvedValue({});

    await initiateGoogleBusinessVerification(
      { businessId: 'biz-1', verificationMethod: 'GOOGLE_BUSINESS' },
      'user-1',
      auditContext,
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verification_method: 'GOOGLE_BUSINESS',
          verification_status: 'VERIFIED',
          claim_status: 'APPROVED',
          google_business_id: 'accounts/123/locations/456',
        }),
      }),
    );
  });

  it('updates business as claimed', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'social-1',
      platform_account_id: 'accounts/123/locations/456',
      platform_account_name: 'My Business',
    });

    mockCreate.mockResolvedValue({ id: 'claim-1' });
    mockUpdate.mockResolvedValue({});

    await initiateGoogleBusinessVerification(
      { businessId: 'biz-1', verificationMethod: 'GOOGLE_BUSINESS' },
      'user-1',
      auditContext,
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'biz-1' },
        data: expect.objectContaining({
          claimed: true,
          claimed_by: 'user-1',
        }),
      }),
    );
  });

  it('creates audit log entry', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'social-1',
      platform_account_id: 'accounts/123/locations/456',
      platform_account_name: 'My Business',
    });

    mockCreate.mockResolvedValue({ id: 'claim-1' });
    mockUpdate.mockResolvedValue({});

    await initiateGoogleBusinessVerification(
      { businessId: 'biz-1', verificationMethod: 'GOOGLE_BUSINESS' },
      'user-1',
      auditContext,
    );

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CLAIM_APPROVED_GBP',
        targetType: 'BusinessClaimRequest',
        newValue: expect.objectContaining({
          method: 'GOOGLE_BUSINESS',
          googleBusinessId: 'accounts/123/locations/456',
        }),
      }),
    );
  });

  it('only finds accounts connected by the requesting user', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      initiateGoogleBusinessVerification(
        { businessId: 'biz-1', verificationMethod: 'GOOGLE_BUSINESS' },
        'user-1',
        auditContext,
      ),
    ).rejects.toThrow();

    // Verify the query filters by connected_by = userId
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          connected_by: 'user-1',
        }),
      }),
    );
  });
});
