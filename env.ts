import {z} from 'zod';  

const envSchema = z.object({
  AUTH_SECRET_KEY: z.string(),
  DATABASE_URL: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_ID_WEB_PRD: z.string(),
  GITHUB_CLIENT_ID_WEB_DEV: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CLIENT_SECRET_WEB_PRD: z.string(),
  GITHUB_CLIENT_SECRET_WEB_DEV: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_REDIRECT_URI: z.url(),
  GOOGLE_SECRET: z.string(),
});

export const envs = envSchema.parse(process.env);