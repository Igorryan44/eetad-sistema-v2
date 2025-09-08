/**
 * Connection Service - Robust backend connectivity management
 * Handles retries, health checks, and connection validation
 */

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  retryCount: number;
  error?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

class ConnectionService {
  private baseUrl: string;
  private status: ConnectionStatus;
  private retryConfig: RetryConfig;
  private isHealthChecking: boolean = false;

  constructor() {
    this.baseUrl = this.getBaseUrl();
    this.status = {
      isConnected: false,
      lastChecked: new Date(0), // Force initial check
      retryCount: 0
    };
    this.retryConfig = {
      maxRetries: 5,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2
    };
  }

  private getBaseUrl(): string {
    // Check for environment variable first
    const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl;
    }

    // Default to localhost
    return 'http://localhost:3003';
  }

  /**
   * Perform health check with retry logic
   */
  public async healthCheck(forceCheck: boolean = false): Promise<boolean> {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.status.lastChecked.getTime();
    
    // Use cached result if recent (within 30 seconds) and not forced
    if (!forceCheck && timeSinceLastCheck < 30000 && this.status.isConnected) {
      return this.status.isConnected;
    }

    // Prevent multiple simultaneous health checks
    if (this.isHealthChecking) {
      return this.status.isConnected;
    }

    this.isHealthChecking = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.status = {
          isConnected: true,
          lastChecked: now,
          retryCount: 0
        };
        console.log('✅ Backend connection healthy');
        return true;
      } else {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
    } catch (error) {
      this.status = {
        isConnected: false,
        lastChecked: now,
        retryCount: this.status.retryCount + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      console.error('❌ Backend health check failed:', error);
      return false;
    } finally {
      this.isHealthChecking = false;
    }
  }

  /**
   * Calculate delay for retry with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelay
    );
    // Add some jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Wait for specified delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make API request with retry logic
   */
  public async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    enableRetry: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error;

    // Ensure backend is healthy before making request
    const isHealthy = await this.healthCheck();
    if (!isHealthy && enableRetry) {
      throw new Error('Backend server is not accessible. Please ensure the server is running on port 3003.');
    }

    const maxAttempts = enableRetry ? this.retryConfig.maxRetries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        // Reset retry count on successful request
        if (this.status.retryCount > 0) {
          this.status.retryCount = 0;
          this.status.isConnected = true;
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`❌ Request attempt ${attempt + 1} failed:`, lastError.message);

        // Don't retry on the last attempt
        if (attempt === maxAttempts - 1) {
          break;
        }

        // Check if this is a network error that might benefit from retry
        const isRetryableError = 
          lastError.message.includes('Failed to fetch') ||
          lastError.message.includes('NetworkError') ||
          lastError.message.includes('AbortError') ||
          lastError.message.includes('timeout');

        if (!isRetryableError) {
          break; // Don't retry non-network errors
        }

        // Calculate delay and wait before retry
        const delayMs = this.calculateRetryDelay(attempt);
        console.log(`⏳ Retrying in ${Math.round(delayMs / 1000)}s...`);
        await this.delay(delayMs);

        // Update health status
        await this.healthCheck(true);
      }
    }

    // Update status on final failure
    this.status.isConnected = false;
    this.status.error = lastError.message;

    throw new Error(
      `Failed to connect to backend after ${maxAttempts} attempts. ` +
      `Last error: ${lastError.message}. ` +
      `Please ensure the server is running on port 3003.`
    );
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Check if backend is likely to be available
   */
  public isLikelyAvailable(): boolean {
    const timeSinceLastCheck = Date.now() - this.status.lastChecked.getTime();
    return this.status.isConnected && timeSinceLastCheck < 60000; // 1 minute
  }

  /**
   * Start automatic server if not running (development helper)
   */
  public async ensureServerRunning(): Promise<boolean> {
    const isHealthy = await this.healthCheck(true);
    
    if (!isHealthy) {
      console.warn('🔧 Backend server appears to be down. Please start it manually:');
      console.warn('   cd local-server');
      console.warn('   npm start');
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const connectionService = new ConnectionService();
export default connectionService;