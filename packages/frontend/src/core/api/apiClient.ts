// packages/frontend/src/core/api/apiClient.ts
// Utility to handle API calls with proper base URL configuration

// Determine the API base URL
// In development, API calls are proxied to the backend
// In production, API calls should go to the same origin
const getApiBaseUrl = (): string => {
  // In development, use relative URLs which will be proxied
  if (import.meta.env.DEV) {
    return '';
  }
  
  // In production, API is on the same origin
  return '';
};

// Create the full API URL
export const createApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${getApiBaseUrl()}/${cleanEndpoint}`;
};

// Wrapper for fetch that handles API calls properly
export const apiFetch = (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = createApiUrl(endpoint);
  return fetch(url, options);
};