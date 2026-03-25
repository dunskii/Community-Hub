/**
 * Claim Service — Backward-compatibility shim
 *
 * Re-exports from the decomposed claim/ directory.
 * Existing consumers can continue importing from this path.
 */

export { ClaimService, claimService, getOwnedBusinesses } from './claim/index.js';
export type { ClaimInitiateInput, ClaimResult, AuditContext } from './claim/index.js';
