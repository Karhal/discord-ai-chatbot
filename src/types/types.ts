type ToolsAI = {
  type: string;
  function: {
    name: string;
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

export { ToolsAI, MessageInput };
