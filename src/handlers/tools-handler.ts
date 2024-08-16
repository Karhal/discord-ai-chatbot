import { AITool, AIToolParameter } from './../types/types';

type ClaudeToolInputSchema = {
  type: string;
  properties: {
    [key: string]: AIToolParameter;
  };
  required: string[];
};

type ClaudeToolFunction = {
  name: string;
  description: string;
  input_schema: ClaudeToolInputSchema;
};

export default transformOpenAIToolToClaudeTool;
