import { BadRequestException } from '@nestjs/common';

export function imageUploadOptions(maxMb = 5) {
  return {
    limits: {
      fileSize: maxMb * 1024 * 1024,
    },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!file.mimetype.startsWith('image/')) {
        return callback(
          new BadRequestException('Only image files are allowed'),
          false,
        );
      }

      callback(null, true);
    },
  };
}
