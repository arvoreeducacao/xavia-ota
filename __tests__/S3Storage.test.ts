import { S3Client } from '@aws-sdk/client-s3';

import { S3Storage } from '../apiUtils/storage/S3Storage';

const resolveCredentials = (storage: S3Storage) =>
  (storage as unknown as { client: S3Client }).client.config.credentials();

describe('S3Storage credentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      S3_BUCKET_NAME: 'updates',
      S3_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'chain-access-key-id',
      AWS_SECRET_ACCESS_KEY: 'chain-secret-access-key',
    };
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses the static key pair when both variables are set', async () => {
    process.env.S3_ACCESS_KEY_ID = 'static-access-key-id';
    process.env.S3_SECRET_ACCESS_KEY = 'static-secret-access-key';

    const credentials = await resolveCredentials(new S3Storage());

    expect(credentials.accessKeyId).toBe('static-access-key-id');
    expect(credentials.secretAccessKey).toBe('static-secret-access-key');
  });

  it('resolves credentials from the AWS SDK default chain when neither variable is set', async () => {
    const credentials = await resolveCredentials(new S3Storage());

    expect(credentials.accessKeyId).toBe('chain-access-key-id');
    expect(credentials.secretAccessKey).toBe('chain-secret-access-key');
  });

  it.each(['S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'])('rejects %s set alone', (variable) => {
    process.env[variable] = 'only-one-half';

    expect(() => new S3Storage()).toThrow('S3 credentials not configured');
  });

  it('requires the bucket name', () => {
    delete process.env.S3_BUCKET_NAME;

    expect(() => new S3Storage()).toThrow('S3 bucket name not configured');
  });
});
