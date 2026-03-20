/**
 * API Client
 *
 * Base HTTP client for making requests to the backend API.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      const value = valueParts.join('='); // Handle values with '=' in them
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class HttpError extends Error {
  constructor(
    public status: number,
    public error: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Make HTTP request to API
 *
 * Tokens are sent automatically via HttpOnly cookies.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Build headers with CSRF token for non-GET requests
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase() || 'GET';
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    } else {
      // CSRF token not found - this will likely fail
      // Log for debugging in development
      if (import.meta.env.DEV) {
        console.warn('[API] CSRF token not found in cookies. State-changing request may fail.');
        console.warn('[API] Available cookies:', document.cookie);
      }
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Send cookies (access_token and refresh_token)
  };

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new HttpError(
          response.status,
          'HTTP_ERROR',
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new HttpError(
        response.status,
        data.error || 'UNKNOWN_ERROR',
        data.message || 'An error occurred',
        data.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    // Network error or JSON parse error
    throw new HttpError(0, 'NETWORK_ERROR', 'Network request failed');
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

/**
 * PATCH request
 */
export async function patch<T>(endpoint: string, data?: unknown): Promise<T> {
  return request<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export { HttpError };

/**
 * API client object for object-oriented access
 */
export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
};
