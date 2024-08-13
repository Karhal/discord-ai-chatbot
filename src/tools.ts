import fs from 'fs';
import writeMemoryTool from './tools/write-memory';
import generateImageTool from './tools/generate-image';
import getCryptoPriceTool from './tools/crypto-price-tracker';
import getBraveSearchTool from './tools/brave-search';
import { ToolsAI } from './types/types';
import fetchDuneDataTool from './tools/dune';
import ConfigManager from './configManager';
import checkLighthHouse from './tools/google-lighthouse';
import getGoogleSearchTool from './tools/google-search';
import getSerpNewsTool from './tools/serp-search';
import getMapsSearchTool from './tools/maps';

const config = ConfigManager.config;
const tools: ToolsAI[] = [];

tools.push(writeMemoryTool);
tools.push(generateImageTool);

if (config.coin.active) {
  tools.push(getCryptoPriceTool);
}
if (config.dune.active) {
  tools.push(fetchDuneDataTool);
}
if (config.braveSearch.active) {
  tools.push(getBraveSearchTool);
}
if (config.googleLighthouse.active) {
  tools.push(checkLighthHouse);
}
if (config.serp.active) {
  tools.push(getSerpNewsTool);
  tools.push(getMapsSearchTool);
}
if (config.googleSearch.active) {
  tools.push(getGoogleSearchTool);
}

const readMemory = () => {
  const memoryFilePath = './memory.txt';
  if (!fs.existsSync(memoryFilePath)) {
    fs.writeFileSync(memoryFilePath, '', 'utf8');
  }
  const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
  return memoryData;
};

export { tools, readMemory };
