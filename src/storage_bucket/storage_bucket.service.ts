import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4 for generating random image names

@Injectable()
export class S3UploadService {
  private s3: AWS.S3;
  private bucketName: string = 'trackrec';
  private folderName: string = 'profile_images';

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.DIGITAL_OCEAN_ENDPOINT,
      accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY_ID,
      secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_ACCESS_KEY
    });
  }

  async uploadNewImage(imageBuffer: Buffer): Promise<any> {
    const randomImageName = `${Date.now()}-${uuidv4()}.jpg`;

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: `${this.folderName}/${randomImageName}`,
      Body: imageBuffer,
      ACL: 'public-read', // Set appropriate ACL
    };

    try {
      await this.s3.upload(uploadParams).promise();
      return randomImageName;
    } catch (error) {
      console.error('Upload error:', error);
      throw false;
    }
  }

  async deleteImage(previousImageName: string): Promise<{ error: boolean; message: string }> {
    try {
      // Delete previous image
      await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: `${this.folderName}/${previousImageName}`,
        })
        .promise();

      return { error: false, message: 'Image deleted successfully.' };
    } catch (error) {
      console.error('Delete error:', error);
      return { error: true, message: 'Failed to delete image.' };
    }
  }

  async uploadImageFromURL(imageUrl: string): Promise<any> {
    try {
      // Download image from URL
      const imageBuffer = await this.downloadImageFromURL(imageUrl);

      // Generate a random image name
      const randomImageName = `${Date.now()}-${uuidv4()}.jpg`;

      // Upload image to S3 with the random image name
      await this.uploadNewImage(imageBuffer);

      return randomImageName;
    } catch (error) {
      console.error('Upload from URL error:', error);
      return false;
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
