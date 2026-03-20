import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SESSION_SECRET: z.string().min(32),
    OPENAI_API_KEY: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    /** Relative to process.cwd(); audio uploads stored here */
    UPLOAD_DIR: z.string().optional().default("storage/uploads"),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    UPLOAD_DIR: process.env.UPLOAD_DIR,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
