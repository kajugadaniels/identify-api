import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import type { SafeUser } from '../users/users.service';
import { memoryStorage } from 'multer';

// All routes require a valid JWT
@UseGuards(JwtAuthGuard)
@Controller('verify')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // POST /api/v1/verify/session
  // Step 1 — call this BEFORE the camera challenge
  // Returns a sessionId that the frontend passes to AWS Amplify
  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@CurrentUser() user: SafeUser) {
    const result = await this.verificationService.createLivenessSession(
      user.id,
    );
    return {
      success: true,
      message: 'Liveness session created. Complete the camera challenge.',
      data: result,
    };
  }

  // POST /api/v1/verify
  // Step 2 — call this AFTER the camera challenge completes
  // Expects multipart/form-data with:
  //   - livenessSessionId (text field)
  //   - idImage (file)
  //   - selfieImage (file)
  @Post()
  @HttpCode(HttpStatus.OK)
  // Accept exactly two file fields — idImage and selfieImage
  // memoryStorage keeps files in RAM as Buffer — no disk writes
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idImage', maxCount: 1 },
        { name: 'selfieImage', maxCount: 1 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async submitVerification(
    @CurrentUser() user: SafeUser,
    @Body() dto: SubmitVerificationDto,
    @UploadedFiles(new FileValidationPipe())
    files: {
      idImage?: Express.Multer.File[];
      selfieImage?: Express.Multer.File[];
    },
  ) {
    // Confirm both files were uploaded
    if (!files?.idImage?.[0] || !files?.selfieImage?.[0]) {
      return {
        success: false,
        message: 'Both idImage and selfieImage files are required',
      };
    }

    const idImage = files.idImage[0];
    const selfieImage = files.selfieImage[0];

    const result = await this.verificationService.submitVerification(
      user.id,
      dto.livenessSessionId,
      idImage.buffer,
      selfieImage.buffer,
      idImage.mimetype,
      selfieImage.mimetype,
    );

    return {
      success: true,
      message: result.message,
      data: result,
    };
  }
}
