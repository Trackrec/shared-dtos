import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class AppLoggerService implements LoggerService {
    constructor(
        @Inject('WINSTON_LOGGER')  
        private readonly logger: Logger
      ) {}

  log(message: string, context?: string) {
    this.logger.info({ context, message });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, message, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context, message });
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context, message });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose({ context, message });
  }

  http(message: string, context?: string) {
    this.logger.log('http', { context, message });
  }
}
