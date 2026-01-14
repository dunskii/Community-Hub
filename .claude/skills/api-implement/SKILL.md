---
name: api-implement
description: Implements RESTful API endpoints following the Community Hub specification patterns. Use when creating new endpoints, including validation, error handling, rate limiting, authentication, and response formatting according to the platform standards.
---

# API Implementation Skill

You are an API implementation expert for the Community Hub platform. Your role is to help create consistent, secure, and well-structured API endpoints following the platform specification.

## API Standards

### Base URL Structure
```
/api/v1/{resource}
```

### HTTP Methods
- `GET` - Retrieve resources (idempotent)
- `POST` - Create new resources
- `PUT` - Update entire resources
- `PATCH` - Partial updates
- `DELETE` - Remove resources

### Authentication
All endpoints except public ones require JWT authentication via HTTP-only cookies.

```typescript
// Middleware pattern
import { authMiddleware } from '@/middleware/auth';
import { requireRole } from '@/middleware/roles';

// Public endpoint
router.get('/businesses', businessController.list);

// Authenticated endpoint
router.get('/users/me', authMiddleware, userController.getProfile);

// Role-restricted endpoint
router.post('/admin/users', authMiddleware, requireRole('Admin'), adminController.createUser);
```

## Request/Response Patterns

### Success Response (Single Resource)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Business Name",
    ...
  }
}
```

### Success Response (Collection)
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized for action)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Validation Patterns

### Input Validation with Zod
```typescript
import { z } from 'zod';

const createBusinessSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/),
  categoryId: z.string().uuid(),
  address: z.object({
    street: z.string().min(1),
    suburb: z.string().min(1),
    postcode: z.string().regex(/^\d{4}$/),
    state: z.string().min(1),
  }),
});

// In controller
const validated = createBusinessSchema.parse(req.body);
```

### Validation Error Handler
```typescript
import { ZodError } from 'zod';

export function validationErrorHandler(error: ZodError) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    },
  };
}
```

## Rate Limiting

### Standard Limits (from Spec §4.3)
- General API: 100 requests/minute per IP
- Authentication: 5 attempts/15 minutes per IP
- Search: 30 requests/minute per user
- Message sending: 10 new conversations/day per user
- Review submission: 1 per business per user per 24 hours

### Implementation
```typescript
import rateLimit from 'express-rate-limit';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Auth limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts, please try again in 15 minutes',
    },
  },
});
```

## Controller Pattern

```typescript
// controllers/business.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BusinessService } from '@/services/business.service';
import { createBusinessSchema, updateBusinessSchema } from '@/validators/business';
import { AppError } from '@/utils/errors';

export class BusinessController {
  constructor(private businessService: BusinessService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, category, search } = req.query;

      const result = await this.businessService.findAll({
        page: Number(page),
        limit: Math.min(Number(limit), 100), // Cap at 100
        category: category as string,
        search: search as string,
      });

      res.json({
        success: true,
        data: result.businesses,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const business = await this.businessService.findById(id);

      if (!business) {
        throw new AppError('Business not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createBusinessSchema.parse(req.body);
      const business = await this.businessService.create(validated, req.user.id);

      res.status(201).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

## API Endpoint Reference

The full API is defined in Appendix B of the specification. Key endpoint groups:

### Authentication `/auth/*`
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/logout` - User logout
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Complete password reset
- POST `/auth/verify-email` - Verify email address
- GET `/auth/me` - Get current user

### Businesses `/businesses/*`
- GET `/businesses` - List businesses (paginated, filterable)
- GET `/businesses/:id` - Get business details
- POST `/businesses` - Create business (admin)
- PUT `/businesses/:id` - Update business
- DELETE `/businesses/:id` - Delete business (admin)
- POST `/businesses/:id/claim` - Claim business ownership
- GET `/businesses/:id/analytics` - Business analytics (owner)
- GET `/businesses/:id/reviews` - Business reviews
- PUT `/businesses/:id/emergency-status` - Update emergency status

### Events `/events/*`
- GET `/events` - List events (paginated, filterable)
- GET `/events/:id` - Get event details
- POST `/events` - Create event
- PUT `/events/:id` - Update event
- DELETE `/events/:id` - Delete event
- POST `/events/:id/rsvp` - RSVP to event

### Users `/users/*`
- GET `/users/:id` - Get user profile
- PUT `/users/:id` - Update user profile
- GET `/users/:id/saved` - Get saved businesses
- POST `/users/:id/saved` - Save a business
- DELETE `/users/:id/saved/:businessId` - Unsave business

### Search `/search/*`
- GET `/search/businesses` - Search businesses
- GET `/search/events` - Search events
- GET `/search/suggestions` - Autocomplete suggestions

### Conversations `/conversations/*`
- GET `/conversations` - List user's conversations
- GET `/conversations/:id` - Get conversation with messages
- POST `/conversations` - Start new conversation
- POST `/conversations/:id/messages` - Send message
- PUT `/conversations/:id/read` - Mark as read

### Deals `/deals/*`
- GET `/deals` - List deals
- GET `/deals/featured` - Featured deals
- GET `/deals/flash` - Active flash deals
- GET `/deals/:id` - Deal details
- POST `/deals` - Create deal
- POST `/deals/:id/redeem` - Redeem deal

### Alerts `/alerts/*`
- GET `/alerts/active` - Active emergency alerts
- GET `/alerts/:id` - Alert details
- POST `/alerts` - Create alert (admin)
- POST `/alerts/:id/check-in` - Safety check-in

## Security Requirements

Every endpoint must:
1. Validate all input (never trust client data)
2. Check authentication where required
3. Check authorization (user has permission)
4. Sanitize output (prevent XSS)
5. Log security-relevant events
6. Handle errors gracefully (no stack traces in production)

Refer to the security-review skill for detailed security patterns.
