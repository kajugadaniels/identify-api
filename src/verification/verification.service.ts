import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
} from '@aws-sdk/client-rekognition';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { PrismaService } from '../prisma/prisma.service';

// Shape of the response we expect back from FastAPI
interface FastApiVerificationResult {
  composite_score: number;
  passed: boolean;
  breakdown: {
    liveness_score: number;
    face_match_score: number;
    ocr_passed: boolean;
  };
  extracted_name: string | null;
  extracted_dob: string | null;
  message: string;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly rekognitionClient: RekognitionClient;
  private readonly fastApiClient: AxiosInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // ── AWS Rekognition client ─────────────────────
    // Used only for creating liveness sessions
    // All other Rekognition calls happen inside FastAPI
    this.rekognitionClient = new RekognitionClient({
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
      region: this.config.get<string>('AWS_REGION', 'eu-west-1'),
    });

    // ── Internal FastAPI HTTP client ───────────────
    // Pre-configured axios instance for all calls to the engine
    // Includes the internal API key on every request automatically
    this.fastApiClient = axios.create({
      baseURL: this.config.get<string>('FASTAPI_ENGINE_URL'),
      timeout: 30000, // 30 seconds — Rekognition can be slow
      headers: {
        // This key is checked by FastAPI's security.py middleware
        'X-Internal-API-Key': this.config.get<string>('INTERNAL_API_KEY'),
      },
    });
  }

  // ── Create liveness session ──────────────────────
  // Called before the user starts the camera challenge
  // Returns a session ID that the frontend passes to Amplify
  async createLivenessSession(userId: string): Promise<{ sessionId: string }> {
    try {
      const command = new CreateFaceLivenessSessionCommand({
        // Tag the session with the userId for audit purposes
        // This doesn't affect functionality but helps with debugging
        ClientRequestToken: `user-${userId}-${Date.now()}`,
        Settings: {
          // How many audit frames to capture during the check
          // These are used for human review if needed
          AuditImagesLimit: 2,
        },
      });

      const response = await this.rekognitionClient.send(command);
      this.logger.log(
        `Liveness session created for user ${userId}: ${response.SessionId}`,
      );

      return { sessionId: response.SessionId! };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Failed to create liveness session: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to create liveness session. Please try again.',
      );
    }
  }

  // ── Submit verification ──────────────────────────
  // Called after the liveness challenge is complete
  // Sends images to FastAPI, saves result to DB, returns score
  async submitVerification(
    userId: string,
    livenessSessionId: string,
    idImageBuffer: Buffer,
    selfieBuffer: Buffer,
    idImageMimetype: string,
    selfieMimetype: string,
  ) {
    // ── Build multipart form for FastAPI ───────────
    // FastAPI expects multipart/form-data with both images + session ID
    const form = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    form.append('liveness_session_id', livenessSessionId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    form.append('id_image', idImageBuffer, {
      filename: 'id_image.jpg',
      contentType: idImageMimetype,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    form.append('selfie_image', selfieBuffer, {
      filename: 'selfie.jpg',
      contentType: selfieMimetype,
    });

    // ── Call FastAPI engine ────────────────────────
    let engineResult: FastApiVerificationResult;

    try {
      this.logger.log(
        `Sending verification request to FastAPI for user ${userId}`,
      );
      const response = await this.fastApiClient.post<FastApiVerificationResult>(
        '/api/v1/verify',
        form,
        // FormData sets its own Content-Type with boundary — must use its headers
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        { headers: form.getHeaders() },
      );
      engineResult = response.data;
    } catch (error) {
      // Handle errors from FastAPI specifically
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const detail = error.response?.data?.detail;

        // 422 means bad images — pass the message back to the user
        if (status === 422) {
          throw new BadRequestException(
            detail || 'Invalid images provided. Please try again.',
          );
        }

        // 404 means the liveness session expired
        if (status === 404) {
          throw new BadRequestException(
            'Liveness session has expired. Please complete the camera challenge again.',
          );
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`FastAPI engine error: ${error.message}`);
      throw new InternalServerErrorException(
        'Verification engine failed. Please try again.',
      );
    }

    // ── Save result to Postgres via Prisma ─────────
    // We save every attempt — both passed and failed
    // This gives users a history and helps with fraud detection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const verification = await this.prisma.verification.create({
      data: {
        userId,
        livenessScore: engineResult.breakdown.liveness_score,
        faceMatchScore: engineResult.breakdown.face_match_score,
        ocrPassed: engineResult.breakdown.ocr_passed,
        compositeScore: engineResult.composite_score,
        passed: engineResult.passed,
      },
    });

    this.logger.log(
      `Verification saved for user ${userId} — score: ${engineResult.composite_score}, passed: ${engineResult.passed}`,
    );

    // ── Build the final response ───────────────────
    // Return everything the frontend needs to display the result
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      verificationId: verification.id,
      compositeScore: engineResult.composite_score,
      passed: engineResult.passed,
      message: engineResult.message,
      breakdown: engineResult.breakdown,
      // Only return extracted ID data if OCR succeeded
      extractedData: engineResult.breakdown.ocr_passed
        ? {
            name: engineResult.extracted_name,
            dateOfBirth: engineResult.extracted_dob,
          }
        : null,
    };
  }
}
