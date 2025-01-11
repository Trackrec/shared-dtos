import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { SensitiveDataSanitizer } from '../utils/sensitive_data_sanitizer';
import { AppLoggerService } from 'src/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, params, query, body } = req;
    const sanitizedBody = SensitiveDataSanitizer.sanitize(body);

    const start = Date.now();

    // ✅ Log the incoming HTTP request
    this.logger.http(`Incoming Request: ${method} ${url} - Params: ${JSON.stringify(params)} - Query: ${JSON.stringify(query)} - Body: ${JSON.stringify(sanitizedBody)}`);

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - start;

        // ✅ Log the HTTP response
        this.logger.http(`Response: ${method} ${url} - ${duration}ms - ${JSON.stringify(response)}`);
      }),
      catchError((error) => {
        const duration = Date.now() - start;

        // ✅ Log errors at the 'error' level
        this.logger.error(`Error in ${method} ${url} - ${duration}ms - ${error.message}`);
        throw error;
      })
    );
  }
}
