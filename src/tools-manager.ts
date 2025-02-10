import { AITool } from './types/types';
import toolList from './tools/index';

const tools: AITool[] = [];

toolList.forEach((toolClass) => {
  const instance = new toolClass();
  if (instance.isActivated) {
    tools.push(instance.buildTool());
  }
});

export { tools };
