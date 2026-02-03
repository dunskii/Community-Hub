export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError('VALIDATION_ERROR', message, 400, details);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError('NOT_FOUND', message, 404);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message = 'Insufficient permissions'): ApiError {
    return new ApiError('FORBIDDEN', message, 403);
  }

  static conflict(message: string): ApiError {
    return new ApiError('ALREADY_EXISTS', message, 409);
  }

  static rateLimited(message = 'Too many requests'): ApiError {
    return new ApiError('RATE_LIMITED', message, 429);
  }

  static internal(message = 'An unexpected error occurred'): ApiError {
    return new ApiError('SERVER_ERROR', message, 500);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): ApiError {
    return new ApiError('SERVICE_UNAVAILABLE', message, 503);
  }
}
