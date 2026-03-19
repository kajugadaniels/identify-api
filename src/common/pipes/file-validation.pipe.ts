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
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    files: Express.Multer.File | Express.Multer.File[],
    _metadata: ArgumentMetadata,
  ) {
    // Handle both single file and array of files
    const fileArray = Array.isArray(files) ? files : [files];

    for (const file of fileArray) {
      // Check file was actually uploaded
      if (!file) {
        throw new BadRequestException('Image file is required');
      }

      // Validate MIME type — prevents non-image uploads
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Invalid file type: ${file.mimetype}. Only JPEG and PNG are allowed`,
        );
      }

      // Validate file size — prevent large file attacks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `File ${file.originalname} exceeds 5MB limit`,
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return files;
  }
}
