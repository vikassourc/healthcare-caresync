import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/healthcare'),
  JWT_SECRET: z.string().default('super_secret_jwt_key_for_development_purposes_12345'),
  JWT_REFRESH_SECRET: z.string().default('super_secret_jwt_refresh_key_for_dev_67890'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Open-Source LLM Configuration
  LLM_PROVIDER: z.enum(['ollama', 'groq', 'huggingface', 'local']).default('local'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2'),
  OPENSOURCE_API_KEY: z.string().optional(),
  OPENSOURCE_MODEL: z.string().default('llama-3.1-8b-instant'),
  
  // Google OAuth Credentials
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:5000/api/calendar/callback'),
  
  // Real Email SMTP & SendGrid Configuration
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('465').transform((val) => parseInt(val, 10)),
  SMTP_SECURE: z.string().default('true').transform((val) => val === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@healthcareapp.com')
});

export const env = envSchema.parse(process.env);
