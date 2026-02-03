import pino from 'pino';

const level = process.env['LOG_LEVEL'] ?? 'info';
const isDev = (process.env['NODE_ENV'] ?? 'development') !== 'production';

export const logger = pino({
  name: 'community-hub',
  level,
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});
