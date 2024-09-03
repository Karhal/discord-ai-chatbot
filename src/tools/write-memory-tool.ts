import FileHandler from '../handlers/file-handler';
import AbstractTool from './absract-tool';

export default class WriteMemoryTool extends AbstractTool {
  readonly toolName = WriteMemoryTool.name;
  public static readonly MEMORY_FILE = 'memory.txt';
  public isActivated = true;

  readonly description =
    'Use this tool only when the user explicitely asks you to remember something. Remember only what the user says from the last message and nothing else, one information at time. Use the same language used by the user. Example : Hey <bot>, remember that I like to eat pizza. Send to the function \'<user> like to eat pizza\'';

  readonly parameters = {
    type: 'object',
    properties: {
      memoryString: {
        type: 'string',
        description: 'The memory string to remember.'
      }
    }
  };

  readonly execute = async (memory: string) => {
    console.log('MEMORY USAGE');
    try {
      const data = JSON.parse(memory);
      console.log(data);

      const fileHandler = new FileHandler();
      await fileHandler.appendToFile('./', WriteMemoryTool.MEMORY_FILE, `${data.memoryString}\n`);
      const lines = await fileHandler.readFile('./', WriteMemoryTool.MEMORY_FILE);

      if (lines && lines.split('\n').length > 10) {
        const lastTenLines = lines.split('\n').slice(-10);
        await fileHandler.writeFile('./', WriteMemoryTool.MEMORY_FILE, lastTenLines.join('\n'));
      }
      return JSON.stringify({ memory_tool_success: true, info: 'Memory has been successfully written' });
    }
    catch (error) {
      console.error('Error reading file:', error);
    }
  };
}
