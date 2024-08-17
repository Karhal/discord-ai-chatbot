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
  function: Function;
};

type InputSchema = {
  type: 'object';
  properties: {
    location: {
      type: 'string';
      description: string;
    };
  };
};

type AITool = {
  type: string;
  name: string;
  description: string;
  input_schema: InputSchema;
  function: AIToolFunction;
};

type MessageInput = {
  role: string;
  content: string;
  channelId?: string;
};

interface ToolType {
  toolName: string;
  buildTool: () => AITool;
  execute: (...args: string[]) => Promise<any>;
  isActivated: boolean;
  parameters: {
    type: string;
    properties: object;
  };
}

export {
  AIToolFunction,
  AIToolParameters,
  AIToolParameter,
  AITool,
  MessageInput,
  ToolType
};
