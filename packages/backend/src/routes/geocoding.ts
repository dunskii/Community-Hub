import type { Router as ExpressRouter } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { searchRateLimiter } from '../middleware/rate-limiter.js';
import { geocodeAddress } from '../services/maps/geocoding-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

export const geocodingRouter: ExpressRouter = Router();

const geocodeBodySchema = z.object({
  street: z.string().min(1, 'Street is required'),
  suburb: z.string().min(1, 'Suburb is required'),
  postcode: z.string().regex(/^\d{4}$/, 'Postcode must be 4 digits'),
  country: z.string().optional(),
});

/**
 * POST /api/v1/geocode
 * Convert address to coordinates
 * Rate limited: Search tier (30/min per Spec §4.8)
 */
geocodingRouter.post('/geocode', searchRateLimiter, validate({ body: geocodeBodySchema }), async (req, res) => {
  try {
    const result = await geocodeAddress(req.body);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Geocoding failed';
    sendError(res, 'GEOCODING_FAILED', message, 400);
  }
});
