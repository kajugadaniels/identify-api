import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    // Record when the request arrived
    const startTime = Date.now();

    return next.handle().pipe(
      // tap() runs after the handler resolves — like a "finally" for observables
      tap(() => {
        const responseTime = Date.now() - startTime;

        // Log format: [HTTP] GET /api/v1/verify — 342ms
        this.logger.log(`${method} ${url} — ${responseTime}ms`);
      }),
    );
  }
}
