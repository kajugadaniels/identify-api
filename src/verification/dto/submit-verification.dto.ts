import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SubmitVerificationDto {
  // Optional: the liveness session ID created by POST /verify/session.
  // When omitted, the FastAPI engine bypasses the liveness check.
  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'Invalid liveness session ID format' })
  livenessSessionId?: string;
}
