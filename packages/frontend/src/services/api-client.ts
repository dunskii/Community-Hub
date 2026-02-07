/**
 * API Client
 *
 * Base HTTP client for making requests to the backend API.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

export interface ApiError {
  error: string;
  message: string;
  details?: any;
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
    public details?: any
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

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
export async function post<T>(endpoint: string, data?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, data?: any): Promise<T> {
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

export { HttpError };
