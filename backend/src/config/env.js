import { z } from "zod";

const parsed = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z
      .string()
      .optional()
      .transform((value) => (value === undefined ? 5000 : Number(value)))
      .pipe(z.number().int().min(1).max(65535)),

    FRONTEND_URL: z.string().url().optional(),
  })
  .safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    "Invalid backend environment configuration. Check backend/.env.example."
  );
}

const environment = parsed.data;
const isProduction = environment.NODE_ENV === "production";

if (isProduction) {
  if (!environment.FRONTEND_URL) {
    throw new Error("FRONTEND_URL must be set when NODE_ENV=production.");
  }

  const url = new URL(environment.FRONTEND_URL);

  const isOriginOnly =
    url.origin === environment.FRONTEND_URL.replace(/\/$/, "");

  if (
    url.protocol !== "https:" ||
    !isOriginOnly ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "FRONTEND_URL must be a valid HTTPS origin when NODE_ENV=production."
    );
  }
}

export const config = {
  nodeEnv: environment.NODE_ENV,
  isProduction,
  port: environment.PORT,
  frontendUrl: environment.FRONTEND_URL,
};