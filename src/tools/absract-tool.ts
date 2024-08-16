import { ToolType } from '../types/types';

export default abstract class AbstractTool implements ToolType {
  abstract toolName: string;
  public isActivated = false;
  abstract description: string;
  abstract parameters: { type: string; properties: object };
  public abstract execute: (...args: string[]) => Promise<any>;

  buildTool = () => {
    console.log(this.execute);
    return {
      type: 'function',
      name: this.toolName,
      function: {
        name: this.toolName,
        function: this.execute,
        description: this.description,
        parameters: this.parameters
      }
    };
  };
}
