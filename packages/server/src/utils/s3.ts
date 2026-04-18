import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';

const s3Client = new S3Client({ region: config.aws.region });

export async function generatePresignedPutUrl(
  key: string,
  contentType: string,
  contentLength: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.aws.s3ImagesBucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export function getCloudFrontUrl(key: string): string {
  return `https://${config.aws.cloudfrontImagesDomain}/${key}`;
}
