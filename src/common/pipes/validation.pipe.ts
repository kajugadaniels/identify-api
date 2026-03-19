import { ValidationPipe as NestValidationPipe } from '@nestjs/common';

// Re-export a pre-configured ValidationPipe with our standard settings.
// This ensures every place that needs a ValidationPipe uses the same config
// and we don't accidentally forget whitelist: true somewhere.
export const createValidationPipe = (): NestValidationPipe =>
  new NestValidationPipe({
    // Strip any properties not defined in the DTO — prevents mass assignment attacks
    whitelist: true,

    // Throw an error if the client sends fields not in the DTO
    forbidNonWhitelisted: true,

    // Auto-convert primitive types: e.g. "3001" string → 3001 number
    transform: true,

    // Return ALL validation errors at once, not just the first one
    stopAtFirstError: false,
  });
