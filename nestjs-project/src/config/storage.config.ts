import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  minioEndpoint: process.env.MINIO_ENDPOINT || 'localhost',
  minioPort: parseInt(process.env.MINIO_PORT || '9000', 10),
  minioAccessKey: process.env.MINIO_ACCESS_KEY!,
  minioSecretKey: process.env.MINIO_SECRET_KEY!,
  minioBucket: process.env.MINIO_BUCKET || 'videos',
}));
