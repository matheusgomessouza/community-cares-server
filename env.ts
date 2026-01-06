import {z} from 'zod';
import {config} from 'dotenv';
import path from 'path';

const environment = process.env.NODE_ENV || 'local';
const envFile = environment === 'production' ? '.env.prod' : '.env.local';

// Load the environment-specific .env file
config({ path: path.resolve(process.cwd(), envFile) });

const baseSchema = z.object({
  AUTH_SECRET_KEY: z.string(),
  DATABASE_URL: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_REDIRECT_URI: z.url(),
  GOOGLE_SECRET: z.string(),
});

const envSchema = environment === 'production'
  ? baseSchema.extend({
      GITHUB_CLIENT_ID_WEB_PRD: z.string(),
      GITHUB_CLIENT_SECRET_WEB_PRD: z.string(),
    })
  : baseSchema.extend({
      GITHUB_CLIENT_ID_WEB_DEV: z.string(),
      GITHUB_CLIENT_SECRET_WEB_DEV: z.string(),
    });

export const envs = envSchema.parse(process.env);
