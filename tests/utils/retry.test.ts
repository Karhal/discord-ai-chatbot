import { withRetry } from '../../src/utils/retry';

// Helper to flush all pending promises
const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('withRetry', () => {
  let originalSetTimeout: typeof setTimeout;

  beforeEach(() => {
    originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn() as unknown as typeof setTimeout;
    jest.mocked(global.setTimeout).mockImplementation((callback: (...args: any[]) => void) => {
      callback();
      return {} as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
  });

  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(mockFn);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(mockFn, {
      maxRetries: 3,
      initialDelay: 100,
      backoffFactor: 2
    });

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should stop retrying after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

    await expect(withRetry(mockFn, {
      maxRetries: 2,
      initialDelay: 100
    })).rejects.toThrow('Persistent error');

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should respect shouldRetry function', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Fatal error'));

    await expect(withRetry(mockFn, {
      maxRetries: 2,
      initialDelay: 100,
      shouldRetry: (error) => error instanceof Error && !error.message.includes('Fatal')
    })).rejects.toThrow('Fatal error');

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
}); 