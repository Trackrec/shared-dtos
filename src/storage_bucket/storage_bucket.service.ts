import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3UploadService {
  private s3: S3Client;
  private bucketName: string = 'trackrec';

  constructor() {
    this.s3 = new S3Client({
      region: "us-east-1",
      endpoint: process.env.DIGITAL_OCEAN_ENDPOINT,
      credentials: {
        accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY_ID,
        secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_ACCESS_KEY
      },
    });
  }

  async uploadNewImage(imageBuffer: Buffer, folderName: string): Promise<string> {
    const randomImageName = `${Date.now()}-${uuidv4()}.jpg`;

    const uploadParams: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: `${folderName}/${randomImageName}`,
      Body: imageBuffer,
      ACL: 'public-read' as const, // Specify the ACL as one of the predefined values
    };

    try {
      await this.s3.send(new PutObjectCommand(uploadParams));
      return randomImageName;
    } catch (error) {
      console.error('Upload error:', error);
      throw false;
    }
  }

  async deleteImage(previousImageName: string, folderName: string): Promise<{ error: boolean; message: string }> {
    try {
      // Delete previous image
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: `${folderName}/${previousImageName}`,
      }));

      return { error: false, message: 'Image deleted successfully.' };
    } catch (error) {
      console.error('Delete error:', error);
      return { error: true, message: 'Failed to delete image.' };
    }
  }

  async uploadImageFromURL(imageUrl: string): Promise<string> {
    try {
      // Download image from URL
      const imageBuffer = await this.downloadImageFromURL(imageUrl);

      // Upload image to S3 with the random image name
      const imageName = await this.uploadNewImage(imageBuffer, "profile_images");

      return imageName;
    } catch (error) {
      console.error('Upload from URL error:', error);
      return '';
    }
  }

  private async downloadImageFromURL(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
}
