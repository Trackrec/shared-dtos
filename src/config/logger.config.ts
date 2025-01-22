import * as winston from 'winston';
import * as path from 'path';
import { mkdirSync } from 'fs';
import { ClsServiceManager } from 'nestjs-cls';
import { configurations } from '../config/env.config';

const { nodeEnv } = configurations;
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
      winston.format.json(),
    ),
  });

const requestIdFormat = winston.format((info) => {
  const cls = ClsServiceManager.getClsService();
  const requestId = cls.get('requestId') || 'N/A';
  info.requestId = requestId;
  return info;
});

const transports: winston.transport[] = [];
// eslint-disable-next-line @typescript-eslint/naming-convention

if (nodeEnv === 'development') {
  // In development, log to the console
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: 'debug',
    }),
  );
} else {
  // In production, log to files only
  transports.push(
    createFileTransport('request/requestData', 'http', 'http'),
    createFileTransport('application/logger', 'debug'),
    createFileTransport('error/error', 'error', 'error'),
  );
}

export const loggerConfig = winston.createLogger({
  levels: customLevels,
  level: 'debug',
  format: winston.format.combine(
    requestIdFormat(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports,
});
