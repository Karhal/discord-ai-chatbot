import FlowiseClient from '../../../src/clients/ai-clients/flowise-client';
import { MessageInput } from '../../../src/types/types';
import ConfigManager from '../../../src/configManager';

jest.mock('../../../src/configManager', () => ({
  config: {
    flowise: {
      apiUrl: 'http://flowise.example.com',
      flowId: 'test-flow-id',
      apiKey: 'test-api-key'
    },
    discord: {
      botName: 'TestBot'
    },
    AIPrompt: 'Test system prompt'
  }
}));

jest.mock('node-fetch', () => jest.fn());

describe('FlowiseClient', () => {
  let client: FlowiseClient;
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    client = new FlowiseClient();
  });

  describe('message', () => {
    const mockMessages: MessageInput[] = [
      {
        id: '1',
        content: 'Hello',
        role: 'user',
        channelId: '123'
      }
    ];

    it('should retry on network error and eventually succeed', async () => {
      // Mock fetch to fail twice then succeed
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error('Network error'));
        if (callCount === 2) return Promise.reject(new Error('Timeout'));
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            text: 'Success response',
            agentReasoning: []
          })
        });
      });

      const result = await client.getAiCompletion('system prompt', mockMessages, []);

      expect(result).toBe('Success response');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on server error (5xx) and eventually succeed', async () => {
      // Mock fetch to return 500 twice then succeed
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          });
        }
        if (callCount === 2) {
          return Promise.resolve({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable'
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            text: 'Success response',
            agentReasoning: []
          })
        });
      });

      const result = await client.getAiCompletion('system prompt', mockMessages, []);

      expect(result).toBe('Success response');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client error (4xx)', async () => {
      // Mock fetch to return 400
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        });
      });

      await expect(client.getAiCompletion('system prompt', mockMessages, []))
        .rejects.toThrow('HTTP error! status: 400');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying after max attempts', async () => {
      // Mock fetch to always fail
      mockFetch.mockImplementation(() => {
        return Promise.reject(new Error('Persistent network error'));
      });

      await expect(client.getAiCompletion('system prompt', mockMessages, []))
        .rejects.toThrow('Persistent network error');

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});