/* eslint-disable no-undef */

import ClaudeClient from '../../../src/clients/ai-clients/claude-client';

//mock config
jest.mock('./../../../src/config', () => {
  return {
    discord: {
      lang: 'fr',
      token: '<discord Token>',
      maxHistory: 10
    },
    aiClient: 'openAI',
    AIPrompt: 'You are a nice assistant in a discord server',
    openAI: {
      apiKey: '<openAiKey>',
      model: 'gpt-4o',
      summaryModel: 'gpt-4o-mini'
    },
    claude: {
      apiKey: '<claudeKey>',
      model: 'claude-2.1',
      summaryModel: 'claude-3-5-sonnet-20240620'
    },
    dune: {
      active: false,
      apiKey: ''
    },
    serp: {
      active: false,
      apiKey: '',
      lang: ''
    },
    braveSearch: {
      active: false,
      apiKey: '',
      lang: ''
    },
    coin: {
      active: false,
      apiKey: '',
      defaulAsset: 'USD'
    },
    googleLighthouse: {
      active: false,
      apiKey: ''
    },
    fluxApi: {
      active: false,
      apiKey: ''
    },
    dallE: {
      active: false,
      apiKey: ''
    },
    googleSearch: {
      active: false,
      apiKey: '',
      cx: ''
    },
    tmpFolder: {
      path: 'tmp_test'
    }
  };
});

describe('ClaudeClient', () => {
  let claudeClient;

  beforeEach(() => {
    claudeClient = new ClaudeClient();
  });

  describe('handleSimpleTextResponse', () => {
    it('should return parsed JSON content when input is valid JSON', () => {
      const message = {
        content: [{ text: '{"content": "Parsed JSON content"}' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('Parsed JSON content');
    });

    it('should return original content when input is not JSON', () => {
      const message = {
        content: [{ text: 'Plain text content' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('Plain text content');
    });

    it('should return original content when JSON parsing fails', () => {
      const message = {
        content: [{ text: '{invalid JSON}' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('{invalid JSON}');
    });

    it('should return empty string when parsed JSON has no content property', () => {
      const message = {
        content: [{ text: '{"someOtherProperty": "value"}' }]
      };

      const result = claudeClient.handleSimpleTextResponse(message);
      expect(result).toBe('');
    });
  });
});