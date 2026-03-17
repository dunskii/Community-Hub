/**
 * API Error Handler
 *
 * [UI/UX Spec v2.2 §8.2 - Network Error Handler]
 *
 * Centralized API error handling with retry logic, network failure detection,
 * and offline queue integration.
 */

export type ApiErrorType =
  | 'network'
  | 'timeout'
  | 'server'
  | 'client'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'rateLimit'
  | 'unknown';

export interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  originalError?: Error;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay in milliseconds */
  baseDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Error types that should trigger retry */
  retryableTypes?: ApiErrorType[];
  /** Callback called before each retry */
  onRetry?: (attempt: number, error: ApiError) => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableTypes: ['network', 'timeout', 'server'],
  onRetry: () => {},
};

/**
 * Classify an error into a known type
 */
export function classifyError(error: unknown): ApiError {
  // Network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
      retryable: true,
      originalError: error,
    };
  }

  // AbortError (timeout)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      retryable: true,
      originalError: error,
    };
  }

  // Response errors with status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    const message = (error as { message?: string }).message || '';
    const code = (error as { code?: string }).code;

    // Rate limiting
    if (status === 429) {
      return {
        type: 'rateLimit',
        message: 'Too many requests. Please wait and try again.',
        status,
        code,
        retryable: true,
      };
    }

    // Unauthorized
    if (status === 401) {
      return {
        type: 'unauthorized',
        message: 'Your session has expired. Please log in again.',
        status,
        code,
        retryable: false,
      };
    }

    // Forbidden
    if (status === 403) {
      return {
        type: 'forbidden',
        message: 'You do not have permission to perform this action.',
        status,
        code,
        retryable: false,
      };
    }

    // Not found
    if (status === 404) {
      return {
        type: 'notFound',
        message: 'The requested resource was not found.',
        status,
        code,
        retryable: false,
      };
    }

    // Validation errors
    if (status === 400 || status === 422) {
      return {
        type: 'validation',
        message: message || 'Invalid request. Please check your input.',
        status,
        code,
        details: (error as { details?: Record<string, unknown> }).details,
        retryable: false,
      };
    }

    // Server errors (5xx)
    if (status >= 500) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        status,
        code,
        retryable: true,
      };
    }

    // Other client errors
    if (status >= 400) {
      return {
        type: 'client',
        message: message || 'Request failed.',
        status,
        code,
        retryable: false,
      };
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred.',
      retryable: false,
      originalError: error,
    };
  }

  // Unknown error type
  return {
    type: 'unknown',
    message: 'An unexpected error occurred.',
    retryable: false,
  };
}

/**
 * Calculate delay for retry attempt using exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: Required<RetryConfig>
): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  );
  // Add jitter (0-25% random variation) to prevent thundering herd
  const jitter = delay * 0.25 * Math.random();
  return Math.floor(delay + jitter);
}

/**
 * Check if an error should be retried
 */
export function shouldRetry(error: ApiError, config: Required<RetryConfig>): boolean {
  return error.retryable && config.retryableTypes.includes(error.type);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig: Required<RetryConfig> = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= mergedConfig.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = classifyError(error);

      // Don't retry if error is not retryable or we've exhausted retries
      if (!shouldRetry(lastError, mergedConfig) || attempt > mergedConfig.maxRetries) {
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt, mergedConfig);
      mergedConfig.onRetry(attempt, lastError);
      await sleep(delay);
    }
  }

  // Should not reach here, but throw last error if we do
  throw lastError || new Error('Retry failed');
}

/**
 * Create an API error handler for use with fetch
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }

    throw {
      status: response.status,
      message: (errorData as { message?: string }).message || response.statusText,
      code: (errorData as { code?: string }).code,
      details: (errorData as { details?: Record<string, unknown> }).details,
    };
  }

  return response.json();
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Queue an action for offline execution
 * Returns a promise that resolves when action is queued
 */
export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = 'community-hub-offline-queue';

export function getOfflineQueue(): QueuedAction[] {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): string {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const queuedAction: QueuedAction = {
    ...action,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };

  const queue = getOfflineQueue();
  queue.push(queuedAction);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

  return id;
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue().filter((action) => action.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

/**
 * Hook to use API error handling in components
 * Returns error state and handlers
 */
export interface UseApiErrorReturn {
  error: ApiError | null;
  isError: boolean;
  clearError: () => void;
  setError: (error: unknown) => void;
}

// Note: This is a plain function, not a hook
// Use it with useState in your component:
// const [error, setError] = useState<ApiError | null>(null);
// Then: setError(classifyError(caughtError));
