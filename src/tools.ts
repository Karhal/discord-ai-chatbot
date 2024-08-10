import fs from 'fs';
import writeMemoryTool from './tools/write-memory';
import generateImageTool from './tools/generate-image';
import getCryptoPriceTool from './tools/crypto-price-tracker';
import getBraveSearchTool from './tools/brave-search';
import { ToolsAI } from './types/types';
import fetchDuneDataTool from './tools/dune';
import ConfigManager from './configManager';
import getGoogleSearchTool from './tools/google-search';
import getSerpNewsTool from './tools/serp-seach';

const config = ConfigManager.getConfig();
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
if (config.serp.active) {
  tools.push(getSerpNewsTool);
}
if (config.googleSearch.active) {
  tools.push(getGoogleSearchTool);
}
// if (
//   ((config.serp.apiKey || process.env.SERP_API_KEY) &&
//     config.serp.google_domain) ||
//   process.env.SERP_GOOGLE_DOMAIN
// ) {
//   tools.push(getSerpNewsTool);
// }

// if (
//   (config.googleSearch.apiKey || process.env.GOOGLE_SEARCH_API_KEY) &&
//   (config.googleSearch.cx || process.env.GOOGLE_SEARCH_CX)
// ) {
//   tools.push(getGoogleSearchTool);
// }

const readMemory = () => {
  const memoryFilePath = './memory.txt';
  if (!fs.existsSync(memoryFilePath)) {
    fs.writeFileSync(memoryFilePath, '', 'utf8');
  }
  const memoryData = fs.readFileSync(memoryFilePath, 'utf8');
  return memoryData;
};

export { tools, readMemory };
