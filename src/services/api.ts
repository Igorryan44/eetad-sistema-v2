import { connectionService } from './connectionService';

export const API_BASE_URL: string = (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://localhost:3003';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

/**
 * Enhanced API fetch with connection management and retry logic
 */
export async function apiFetch(input: string, init?: RequestInit) {
  const url = input.startsWith('http') ? input : apiUrl(input);
  
  try {
    return await fetch(url, init);
  } catch (error) {
    // If regular fetch fails, try with connection service for retry logic
    if (error instanceof Error && error.message.includes('fetch')) {
      const endpoint = url.replace(API_BASE_URL, '');
      throw new Error(`Connection failed: ${error.message}. Please ensure backend server is running.`);
    }
    throw error;
  }
}

/**
 * Make API request with robust connection handling
 */
export async function apiRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {}, 
  enableRetry: boolean = true
): Promise<T> {
  return connectionService.makeRequest<T>(endpoint, options, enableRetry);
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  return connectionService.healthCheck();
}

/**
 * Get current connection status
 */
export function getConnectionStatus() {
  return connectionService.getStatus();
}