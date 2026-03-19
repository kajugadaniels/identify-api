import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

// Allowed MIME types — only JPEG and PNG
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// 5MB in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(
    files:
      | Record<string, Express.Multer.File[]>
      | Express.Multer.File[]
      | Express.Multer.File,
    _metadata: ArgumentMetadata,
  ) {
    // FileFieldsInterceptor delivers { fieldname: File[] }.
    // FileInterceptor delivers a single File or File[].
    // Flatten everything into one array before validating.
    let fileArray: Express.Multer.File[];

    if (Array.isArray(files)) {
      fileArray = files;
    } else if (
      files &&
      typeof files === 'object' &&
      !Buffer.isBuffer((files as Express.Multer.File).buffer)
    ) {
      // Record<string, File[]> from FileFieldsInterceptor
      fileArray = Object.values(
        files as Record<string, Express.Multer.File[]>,
      ).flat();
    } else {
      fileArray = [files as Express.Multer.File];
    }

    for (const file of fileArray) {
      if (!file) {
        throw new BadRequestException('Image file is required');
      }

      // Validate MIME type — prevents non-image uploads
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.mimetype}. Only JPEG and PNG are allowed`,
        );
      }

      // Validate file size — prevent large file attacks
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds 5MB limit`,
        );
      }
    }

    return files;
  }
}
