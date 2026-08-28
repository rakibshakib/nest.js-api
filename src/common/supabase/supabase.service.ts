import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  get storage() {
    return this.client.storage;
  }

  async testConnection() {
    const { data, error } = await this.client.storage.from('media').list();

    if (error) {
      throw error;
    }

    return data;
  }

  async uploadFile(file: Express.Multer.File, filePath: string) {
    const { data, error } = await this.client.storage
      .from('media')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `File upload failed: ${error.message}`,
      );
    }

    return data;
  }

  getPublicUrl(filePath: string) {
    const { data } = this.client.storage.from('media').getPublicUrl(filePath);

    return data.publicUrl;
  }

  async deleteFile(filePath: string) {
    const { error } = await this.client.storage
      .from('media')
      .remove([filePath]);

    if (error) {
      throw new InternalServerErrorException(
        `File deletion failed: ${error.message}`,
      );
    }

    return true;
  }
}
