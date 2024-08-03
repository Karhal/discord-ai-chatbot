import FileManager from "../handlers/file-handler";

const writeMemory = async (memory: string) => {
  try {
    const data = JSON.parse(memory);
    console.log(data);

    const fileManager = new FileManager("./");
    await fileManager.appendToFile("memory.txt", `${data.memoryString}\n`);
    const lines = await fileManager.readFile("memory.txt");

    if (lines && lines.split("\n").length > 10) {
      const lastTenLines = lines.split("\n").slice(-10);
      await fileManager.writeFile("memory.txt", lastTenLines.join("\n"));
    }
  } catch (error) {
    console.error("Error reading file:", error);
  }
};

const writeMemoryTool = {
  type: "function",
  function: {
    function: writeMemory,
    description:
      "Use this tool when the user asks you to remember something. Remember only what the user says from the last message and nothing else, one information at time. Use the same language used by the user. Example : Hey <bot>, remember that I like to eat pizza. Send to the function '<user> like to eat pizza'",
    parameters: {
      type: "object",
      properties: {
        memoryString: { type: "string" },
      },
    },
  },
};

export default writeMemoryTool;
