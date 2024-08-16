/* eslint-disable no-undef */
import transformOpenAIToolToClaudeTool from '../../src/handlers/tools-handler';

describe('transformOpenAIToolToClaudeTool', () => {
  it('should transform OpenAI tool to Claude tool correctly', () => {
    const openAIToolExample = {
      type: 'function',
      function: {
        name: 'generate_image',
        description: 'Lorem Ipsum',
        parameters: {
          type: 'object',
          properties: {
            imagePrompt: {
              type: 'string',
              description: 'The prompt for generating the image'
            }
          }
        }
      }
    };

    const expectedClaudeTool = {
      name: 'generate_image',
      description: 'Lorem Ipsum',
      input_schema: {
        type: 'object',
        properties: {
          imagePrompt: {
            type: 'string',
            description: 'The prompt for generating the image'
          }
        },
        required: []
      }
    };

    const result = transformOpenAIToolToClaudeTool(openAIToolExample);
    expect(result).toEqual(expectedClaudeTool);
  });
});
