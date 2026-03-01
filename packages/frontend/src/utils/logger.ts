/**
 * Frontend Logger
 * Consistent logging across the frontend application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, context?: LogContext | Error) {
    if (!this.isDevelopment && level === 'debug') {
      return; // Skip debug logs in production
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context instanceof Error) {
      console[level](`${prefix} ${message}`, context);
    } else if (context) {
      console[level](`${prefix} ${message}`, context);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | LogContext) {
    this.log('error', message, error);
  }
}

export const logger = new Logger();
