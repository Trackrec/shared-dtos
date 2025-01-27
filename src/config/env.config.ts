import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'SECONDARY_LINKEDIN_CLIENT_ID',
  'SECONDARY_LINKEDIN_CLIENT_SECRET',
  'SECONDARY_LINKEDIN_CALLBACK_URL',
  'PRIMARY_LINKEDIN_CLIENT_ID',
  'PRIMARY_LINKEDIN_CLIENT_SECRET',
  'PRIMARY_LINKEDIN_CALLBACK_URL',
  'PRIMARY_RECRUITER_LINKEDIN_CALLBACK_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'PRIMARY_RECRUITER_GOOGLE_CALLBACK_URL',
  'JWT_SECRET',
  'nobellaAccessToken',
  'APOLLO_API_KEY',
  'DIGITAL_OCEAN_ENDPOINT',
  'DIGITAL_OCEAN_ACCESS_KEY_ID',
  'DIGITAL_OCEAN_SECRET_ACCESS_KEY',
  'REACT_APP_URL',
  'ADMIN_PASSWORD',
  'MAILGUN_KEY',
  'MAILGUN_DOMAIN',
  'SENTRY_DNS',
  'OPENAI_API_KEY',
  'NODE_ENV',
];

function validateEnvVars(requiredVars: string[]) {
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

try {
  validateEnvVars(requiredEnvVars);
} catch (error) {
  const logger = new Logger('EnvironmentConfig');
  logger.error(error.message);
  process.exit(1);
}

export const configurations = {
  port: parseInt(process.env.PORT || '4000', 10),
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  linkedin: {
    secondaryClientId: process.env.SECONDARY_LINKEDIN_CLIENT_ID,
    secondaryClientSecret: process.env.SECONDARY_LINKEDIN_CLIENT_SECRET,
    secondaryCallbackUrl: process.env.SECONDARY_LINKEDIN_CALLBACK_URL,
    primaryClientId: process.env.PRIMARY_LINKEDIN_CLIENT_ID,
    primaryClientSecret: process.env.PRIMARY_LINKEDIN_CLIENT_SECRET,
    primaryCallbackUrl: process.env.PRIMARY_LINKEDIN_CALLBACK_URL,
    primaryRecruiterCallbackUrl: process.env.PRIMARY_RECRUITER_LINKEDIN_CALLBACK_URL,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    recruiterCallbackUrl: process.env.PRIMARY_RECRUITER_GOOGLE_CALLBACK_URL,
  },
  jwtSecret: process.env.JWT_SECRET,
  nobellaAccessToken: process.env.nobellaAccessToken,
  apolloApiKey: process.env.APOLLO_API_KEY,
  digitalOcean: {
    endpoint: process.env.DIGITAL_OCEAN_ENDPOINT,
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY_ID,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_ACCESS_KEY,
  },
  reactAppUrl: process.env.REACT_APP_URL,
  adminPassword: process.env.ADMIN_PASSWORD,
  mailgun: {
    key: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_DOMAIN,
  },
  sentryDns: process.env.SENTRY_DNS,
  openAiApiKey: process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};
