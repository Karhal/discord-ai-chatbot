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

function transformOpenAIToolToClaudeTool(
  openAITool: AITool
): ClaudeToolFunction {
  const tool = openAITool;

  const input_schema: ClaudeToolInputSchema = {
    type: tool.function.parameters.type,
    properties: tool.function.parameters.properties,
    required: tool.function.parameters.required || []
  };

  return {
    name: tool.function.name,
    description: tool.function.description,
    input_schema
  };
}

export default transformOpenAIToolToClaudeTool;
