type TypeLogger = 'VERBOSE' | 'INFOS' | 'CALL' | 'ERROR';

class ConsoleLogger {
  static states: TypeLogger[] = ['INFOS'];

  static log(typeLogger: TypeLogger, ...msg: any) {
    if (ConsoleLogger.states.includes(typeLogger)) {
      console.log(...msg);
    }
  }
}

export { TypeLogger, ConsoleLogger };
