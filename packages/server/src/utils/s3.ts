import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
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

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.aws.s3ImagesBucket,
    Key: key,
  });
  await s3Client.send(command);
}

export function getCloudFrontUrl(key: string): string {
  return `https://${config.aws.cloudfrontImagesDomain}/${key}`;
}

export function extractS3KeyFromUrl(url: string): string | null {
  const prefix = `https://${config.aws.cloudfrontImagesDomain}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
