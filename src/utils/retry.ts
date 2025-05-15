import { Logger } from './logger';

const logger = new Logger();

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  shouldRetry: () => true
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoffFactor, shouldRetry } = {
    ...defaultOptions,
    ...options
  };

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    }
    catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, { error });
      await new Promise(resolve => setTimeout(resolve, delay));

      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}