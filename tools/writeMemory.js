const fs = require('fs');
const path = require('path');

async function writeMemory(memory) {

    memory = JSON.parse(memory).memoryString;
    const filePath = path.join(__dirname, 'memory.txt');
    let facts = [];
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf8');
    }
    const data = fs.readFileSync(filePath, 'utf8');
    facts = data.split('\n').filter(line => line.trim() !== '');
  
    console.log("Memory: " + memory);
    facts.push(memory);
  
    if (facts.length > 10) {
        facts = facts.slice(facts.length - 10);
    }
  
    fs.writeFileSync(filePath, facts.join('\n'), 'utf8');
  }
  
const writeMemoryTool = {
    type: 'function',
    function: {
      function: writeMemory,
      description: "Use this tool when the user is asking to you to remember an information. Store only what the user says and nothing else.",
      parameters: {
        type: 'object',
        properties: {
            memoryString: { type: 'string' },
        },
      },
    },
  }

  module.exports = writeMemoryTool;