const FileManager = require('../handlers/FileHandler.js');

async function writeMemory(memory) {

    try {
      data = JSON.parse(memory);
      console.log(data);
      
      const fileManager = new FileManager('./');
      fileManager.appendToFile('memory.txt', data.memoryString + '\n');
      const lines = fileManager.readFile('memory.txt');

      if (lines.split('\n').length > 10) {
        const lastTenLines = lines.slice(-10);
        fileManager.writeFile('memory.txt', lastTenLines.join('\n'));
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }
  
const writeMemoryTool = {
    type: 'function',
    function: {
      function: writeMemory,
      description: "Use this tool when the user asks you to remember something. Remember only what the user says from the last message and nothing else, one information at time. Use the same language used by the user. Example : Hey <bot>, remember that I like to eat pizza. Send to the function '<user> like to eat pizza'",
      parameters: {
        type: 'object',
        properties: {
            memoryString: { type: 'string' },
        },
      },
    },
  }

  module.exports = writeMemoryTool;