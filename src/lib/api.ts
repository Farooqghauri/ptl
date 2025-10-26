// API utility functions

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Generic API call function with error handling
 */
export async function apiCall<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * POST request helper
 */
export async function post<T = unknown>(
  endpoint: string,
  data: unknown
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * GET request helper
 */
export async function get<T = unknown>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    method: "GET",
  });
}

/**
 * PUT request helper
 */
export async function put<T = unknown>(
  endpoint: string,
  data: unknown
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function del<T = unknown>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    method: "DELETE",
  });
}
