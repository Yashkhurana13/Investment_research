import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  FMP_API_KEY: z.string().min(1),
  FINNHUB_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment variables are missing or invalid. Check your .env file.');
}

export const env = parsedEnv.success ? parsedEnv.data : (process.env as any);

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.format()
    };
  }
  return { isValid: true };
}
