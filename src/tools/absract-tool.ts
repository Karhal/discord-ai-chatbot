import { ToolType } from '../types/types';
import ConfigManager from '../configManager';

export default abstract class AbstractTool implements ToolType {
  abstract toolName: string;
  public isActivated = false;
  abstract description: string;
  abstract parameters: { type: string; properties: object };
  public abstract execute: (...args: string[]) => Promise<any>;
  config = ConfigManager.getConfig();

  buildTool = () => {
    console.log(this.execute);
    return {
      type: 'function',
      name: this.toolName,
      input_schema: this.parameters,
      description: this.description,
      function: {
        name: this.toolName,
        function: this.execute,
        description: this.description,
        parameters: this.parameters
      }
    };
  };
}
