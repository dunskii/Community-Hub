/**
 * Claim Service Barrel
 *
 * Re-exports all public API from the claim service modules.
 */

export { ClaimService, claimService } from './claim-service.js';
export { getOwnedBusinesses } from './claim-queries.js';
export type { ClaimInitiateInput, ClaimResult, AuditContext } from './claim-types.js';
