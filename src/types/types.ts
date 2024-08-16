type AIToolParameter = {
  type: string;
  description?: string;
};

type AIToolParameters = {
  type: string;
  properties: {
    [key: string]: AIToolParameter;
  };
  required?: string[];
};

type AIToolFunction = {
  name: string;
  description: string;
  parameters: AIToolParameters;
};

type AITool = {
  type: string;
  function: AIToolFunction;
};

type MessageInput = {
  role: string;
  content: string;
  channelId?: string;
};

export {
  AIToolFunction,
  AIToolParameters,
  AIToolParameter,
  AITool,
  MessageInput
};
