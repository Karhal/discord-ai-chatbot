import { AITool } from './types/types';
import toolList from './tools/index';

const tools: AITool[] = [];

toolList.forEach((toolClass) => {
  const instance = new toolClass();
  if (instance.isActivated) {
    const built = instance.buildTool();
    const originalFn = built.function.function;
    built.function.function = async (...args: any[]) => {
      try {
        const result = await originalFn(...args);
        if (typeof result === 'string') return result;
        try {
          return JSON.stringify(result ?? { success: false, error: 'Empty tool result' });
        }
        catch {
          return String(result);
        }
      }
      catch (err: any) {
        return JSON.stringify({ success: false, error: err?.message || 'Tool execution failed' });
      }
    };
    tools.push(built);
  }
});

export { tools };
