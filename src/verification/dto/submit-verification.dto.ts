import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class SubmitVerificationDto {
  // The session ID returned from POST /verify/session
  // Must be a valid UUID — AWS Rekognition session IDs are always UUIDs
  @IsString()
  @IsNotEmpty({ message: 'Liveness session ID is required' })
  @IsUUID('4', { message: 'Invalid liveness session ID format' })
  livenessSessionId: string | undefined;
}
