type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private logLevel: LogLevel = 'info'; // Default log level

  constructor(level: LogLevel = 'info') {
    this.logLevel = level;
  }

  private getLogLevelPriority(level: LogLevel): number {
    const priorities: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return priorities[level];
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return this.getLogLevelPriority(messageLevel) >= this.getLogLevelPriority(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
} 