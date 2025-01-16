import * as winston from 'winston';
import * as path from 'path';
import { mkdirSync } from 'fs';

const logDir = path.join(__dirname, '../../logs');

const createLogDir = (dirName: string) => mkdirSync(`${logDir}/${dirName}`, { recursive: true });

['request', 'application', 'error'].forEach(createLogDir);

const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5,
  http: 6,
};

const createFileTransport = (filename: string, level: string, filterLevel: string | null = null) =>
  new winston.transports.File({
    filename: `${logDir}/${filename}-${new Date().toISOString().split('T')[0]}.log`,
    level,
    format: winston.format.combine(
      winston.format((info) => (filterLevel && info.level !== filterLevel ? false : info))(),
      winston.format.timestamp(),
      winston.format.json()
    ),
  });

export const loggerConfig = winston.createLogger({
  levels: customLevels,
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: 'debug',
    }),

    createFileTransport('request/requestData', 'http', 'http'),

    createFileTransport('application/logger', 'debug'),

    createFileTransport('error/error', 'error', 'error'),
  ],
});
