import fs from 'fs';
import writeMemoryTool from './tools/write-memory';
import generateImageTool from './tools/generate-image';
import getCryptoPriceTool from './tools/crypto-price-tracker';
import getLastNewsTool from './tools/brave-search';
import { ToolsAI } from './types/types';
import fetchDuneDataTool from './tools/dune';

const tools: ToolsAI[] = [];

tools.push(writeMemoryTool);
tools.push(generateImageTool);
tools.push(getCryptoPriceTool);
tools.push(fetchDuneDataTool);
tools.push(getLastNewsTool);

const readMemory = () => {
  const memoryFilePath = './memory.txt';
  if (!fs.existsSync(memoryFilePath)) {
    fs.writeFileSync(memoryFilePath, '', 'utf8');
  }
  const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
  return memoryData;
};

export { tools, readMemory };
