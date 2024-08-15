type ToolsAI = {
  type: string;
  function: {
    function: Function;
    description: string;
    parameters: {
      type: string;
      properties: object;
    };
  };
};

type MessageInput = {
  role: string;
  content: string;
  channelId?: string;
};

interface ToolType {
  toolName: string;
  buildTool: () => ToolsAI;
  execute: (...args: string[]) => Promise<any>;
  description: string;
  isActivated: boolean;
  parameters: {
    type: string;
    properties: object;
  };
}

export { ToolsAI, MessageInput, ToolType };
