function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: Number(optional('PORT', '3001')),
  nodeEnv: required('NODE_ENV'),
  clientUrl: required('CLIENT_URL'),
  serverUrl: required('SERVER_URL'),
  google: {
    clientId: required('GOOGLE_CLIENT_ID'),
  },
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: '1h',
    refreshExpiresIn: '14d',
    refreshMaxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in ms
  },
  aws: {
    region: optional('AWS_REGION', 'ap-northeast-2'),
    s3ImagesBucket: required('S3_IMAGES_BUCKET'),
    cloudfrontImagesDomain: required('CLOUDFRONT_IMAGES_DOMAIN'),
  },
} as const;
