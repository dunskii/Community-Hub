/**
 * Claim Queries
 *
 * Read-only queries for business claim status and ownership.
 * Spec §13.1: Business Claim & Verification
 */

import { prisma } from '../../db/index.js';
import {
  ClaimStatus,
  type VerificationMethod,
  type ClaimVerificationStatus,
} from '../../generated/prisma/index.js';

/**
 * Get claim status
 */
export async function getClaimStatus(businessId: string, userId: string): Promise<{
  hasClaim: boolean;
  claim?: {
    id: string;
    verificationMethod: VerificationMethod;
    verificationStatus: ClaimVerificationStatus;
    claimStatus: ClaimStatus;
    createdAt: Date;
    rejectionReason?: string | null;
  };
}> {
  const claim = await prisma.business_claim_requests.findUnique({
    where: {
      business_id_user_id: {
        business_id: businessId,
        user_id: userId,
      },
    },
    select: {
      id: true,
      verification_method: true,
      verification_status: true,
      claim_status: true,
      created_at: true,
      rejection_reason: true,
    },
  });

  if (!claim) {
    return { hasClaim: false };
  }

  return {
    hasClaim: true,
    claim: {
      id: claim.id,
      verificationMethod: claim.verification_method,
      verificationStatus: claim.verification_status,
      claimStatus: claim.claim_status,
      createdAt: claim.created_at,
      rejectionReason: claim.rejection_reason,
    },
  };
}

/**
 * Get businesses owned by a user (via approved claims)
 *
 * @param userId - User ID
 * @returns Array of owned businesses
 */
export async function getOwnedBusinesses(userId: string) {
  const approvedClaims = await prisma.business_claim_requests.findMany({
    where: {
      user_id: userId,
      claim_status: ClaimStatus.APPROVED,
    },
    include: {
      businesses: {
        include: {
          categories: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  });

  return approvedClaims.map((claim) => {
    const business = claim.businesses;
    const gallery = business.gallery as Array<string | { url: string }> | null;
    const coverPhoto = business.cover_photo as string | null;

    // Extract photo URLs from gallery (handles both string[] and {url}[] formats)
    const galleryPhotos = gallery?.map(item =>
      typeof item === 'string' ? item : item?.url
    ).filter(Boolean).slice(0, 3) || [];

    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status,
      claimed: business.claimed,
      verifiedAt: claim.decision_at?.toISOString() || null,
      rating: null,
      reviewCount: business._count.reviews,
      followerCount: 0,
      photos: coverPhoto ? [coverPhoto, ...galleryPhotos] : galleryPhotos,
    };
  });
}
