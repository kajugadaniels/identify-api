import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// @Catch() with no args catches ALL exceptions — not just HttpExceptions
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // NestJS built-in logger — prefixed with 'ExceptionFilter' in logs
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code:
    // If it's a known HttpException use its code, otherwise 500
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract the message from the exception
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Build a clean, consistent error response shape
    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      // If message is an object (e.g. from ValidationPipe), spread it
      // Otherwise wrap it in a message field
      error: typeof message === 'object' ? message : { message },
    };

    // Log server errors (5xx) with full stack trace
    // Don't log 4xx — those are client mistakes, not ours
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(errorResponse);
  }
}
