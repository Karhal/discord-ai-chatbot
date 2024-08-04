type ToolsAI = {
  type: string;
  function: {
    function: Function;
    description: string;
    parameters: {
      type: string;
      properties: Object;
    };
  };
};

export { ToolsAI };
