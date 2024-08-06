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

type Completion = {
  author: string;
  content: string;
  dateTime: Date;
};

type MessageInput = {
  role: string;
  content: string;
  channelId?: string;
};

export { ToolsAI, Completion, MessageInput };
