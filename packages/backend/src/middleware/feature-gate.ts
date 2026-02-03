import { isFeatureEnabled } from '@community-hub/shared';
import type { FeatureFlag, FeaturesConfig } from '@community-hub/shared';
import type { Request, Response, NextFunction } from 'express';

import { sendError } from '../utils/api-response.js';

/**
 * Express middleware that returns 404 if a feature is disabled.
 * Use on route groups to gate entire feature areas.
 *
 * @example
 * router.use('/deals', featureGate('dealsHub', () => config.features), dealsRouter);
 */
export function featureGate(
  flag: FeatureFlag,
  getFeatures: () => FeaturesConfig,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isFeatureEnabled(getFeatures(), flag)) {
      sendError(res, 'NOT_FOUND', 'This feature is not available.', 404, req.requestId);
      return;
    }
    next();
  };
}
