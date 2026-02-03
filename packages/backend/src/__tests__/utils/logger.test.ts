import { describe, it, expect } from 'vitest';

import { logger } from '../../utils/logger.js';

describe('logger', () => {
  it('should be a pino logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should have a valid log level', () => {
    expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(logger.level);
  });
});
