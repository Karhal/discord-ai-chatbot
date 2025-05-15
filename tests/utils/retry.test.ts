import { withRetry } from '../../src/utils/retry';

// Helper to flush all pending promises
const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('withRetry', () => {
  // Increase timeout for all tests in this suite
  jest.setTimeout(10000);

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance'] });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const resultPromise = withRetry(mockFn);
    await flushPromises();
    await expect(resultPromise).resolves.toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce('success');

    // Use reduced delay for faster tests
    const resultPromise = withRetry(mockFn, {
      maxRetries: 3,
      initialDelay: 100,
      backoffFactor: 2
    });

    // First attempt fails immediately
    await flushPromises();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Second attempt after delay
    jest.advanceTimersByTime(100);
    await flushPromises();
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Third attempt after delay
    jest.advanceTimersByTime(200);
    await flushPromises();
    expect(mockFn).toHaveBeenCalledTimes(3);

    // Verify final result
    await expect(resultPromise).resolves.toBe('success');
  });

  it('should stop retrying after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

    // Use reduced delay for faster tests
    const resultPromise = withRetry(mockFn, {
      maxRetries: 2,
      initialDelay: 100
    });

    // First attempt fails immediately
    await flushPromises();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Second attempt after delay
    jest.advanceTimersByTime(100);
    await flushPromises();
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Third attempt after delay
    jest.advanceTimersByTime(100);
    await flushPromises();
    expect(mockFn).toHaveBeenCalledTimes(3);

    await expect(resultPromise).rejects.toThrow('Persistent error');
  });

  it('should respect shouldRetry function', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Fatal error'));

    // Use reduced delay for faster tests
    const resultPromise = withRetry(mockFn, {
      maxRetries: 2,
      initialDelay: 100,
      shouldRetry: (error) => error instanceof Error && !error.message.includes('Fatal')
    });

    // First attempt fails with fatal error
    await flushPromises();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Should not retry because error is fatal
    await expect(resultPromise).rejects.toThrow('Fatal error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
}); 