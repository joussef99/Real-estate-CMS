/**
 * Environment variable validation and documentation.
 * This runs at module load time before the app starts.
 */

export interface ValidatedEnv {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  adminPassword: string;
  nodeEnv: "development" | "production";
  corsOrigin: string[];
  backendUrl?: string;
}

/**
 * Required variables that must be set.
 */
const REQUIRED_VARS = ["DATABASE_URL", "JWT_SECRET"] as const;
const REQUIRED_UPLOAD_VARS = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;

/**
 * Variables with defaults and descriptions.
 */
const VAR_DESCRIPTIONS: Record<string, { default?: string; description: string; required: boolean }> = {
  PORT: {
    default: "5000",
    description: "HTTP port the server listens on (Railway sets this automatically in production)",
    required: false,
  },
  DATABASE_URL: {
    description:
      "PostgreSQL connection string. Example: postgresql://user:password@host:5432/dbname or postgres://... (Railway provides this)",
    required: true,
  },
  JWT_SECRET: {
    description:
      "256-bit hex string used to sign auth tokens. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    required: true,
  },
  ADMIN_INITIAL_PASSWORD: {
    default: "admin123",
    description: "Password for the initial admin user (ignored if admin already exists). Change after first login",
    required: false,
  },
  NODE_ENV: {
    default: "development",
    description: "Set to 'production' in Railway. Affects logging and error handling",
    required: false,
  },
  CORS_ORIGIN: {
    default: "http://localhost:5173,http://localhost:3000",
    description:
      "Comma-separated list of frontend origins allowed to call the API. Example: https://yourdomain.com,https://www.yourdomain.com (or leave empty to allow all)",
    required: false,
  },
  BACKEND_URL: {
    description:
      "Optional absolute backend URL for generating image URLs across domains. Example: https://api.yourdomain.com or https://backend.up.railway.app",
    required: false,
  },
  CLOUDINARY_CLOUD_NAME: {
    description: "Cloudinary cloud name for image uploads. Example: demo-cloud",
    required: true,
  },
  CLOUDINARY_API_KEY: {
    description: "Cloudinary API key for authenticated uploads",
    required: true,
  },
  CLOUDINARY_API_SECRET: {
    description: "Cloudinary API secret for authenticated uploads",
    required: true,
  },
};

/**
 * Validate all required environment variables at startup.
 * Throws an error if required vars are missing.
 * Logs a summary of configuration for debugging.
 */
export function validateEnv(): ValidatedEnv {
  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      const desc = VAR_DESCRIPTIONS[varName];
      const hint = desc
        ? `\n   ${desc.description}`
        : "";
      errors.push(
        `  - ${varName}: Missing (required in ${isProduction ? "production" : "all environments"})${hint}`
      );
    } else if (varName === "JWT_SECRET" && value.length < 32) {
      errors.push(
        `  - JWT_SECRET: Too short (${value.length} chars, minimum 32 required). Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
      );
    }
  }

  for (const varName of REQUIRED_UPLOAD_VARS) {
    const value = process.env[varName];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      const desc = VAR_DESCRIPTIONS[varName];
      const hint = desc
        ? `\n   ${desc.description}`
        : "";
      errors.push(
        `  - ${varName}: Missing (required for Cloudinary image uploads)${hint}`
      );
    }
  }

  if (errors.length > 0) {
    const env = isProduction ? "Railway" : "your local environment";
    const errorMsg = `\n${"━".repeat(80)}\n[FATAL] Missing or invalid required environment variables in ${env}:\n\n${errors.join("\n")}\n\n${"━".repeat(80)}\n\nTo fix this:\n\n${isProduction ? "  1. Go to your Railway project dashboard\n  2. Navigate to Variables\n  3. Add each missing variable from the list above\n  4. Redeploy the service\n" : "  1. Create a .env file in the server/ directory (or copy .env.example)\n  2. Fill in the missing variables\n  3. Restart the app with: npm run dev\n"}\n`;

    process.stderr.write(errorMsg);
    process.exit(1);
  }

  // Parse and validate optional variables
  const port = Number(process.env.PORT || VAR_DESCRIPTIONS.PORT.default);
  if (isNaN(port) || port < 1 || port > 65535) {
    process.stderr.write(`[ERROR] PORT must be a valid port number (1-65535), got: ${process.env.PORT}\n`);
    process.exit(1);
  }

  const nodeEnv: "development" | "production" = process.env.NODE_ENV === "production" ? "production" : "development";

  const corsOriginString = process.env.CORS_ORIGIN ?? VAR_DESCRIPTIONS.CORS_ORIGIN.default ?? "";
  const corsOrigin = corsOriginString
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // Log validated configuration at startup
  process.stdout.write(
    `\n[STARTUP] Environment configuration validated:\n` +
      `  NODE_ENV: ${nodeEnv}\n` +
      `  PORT: ${port}\n` +
      `  DATABASE: ${maskConnectionString(process.env.DATABASE_URL!)}\n` +
      `  JWT_SECRET: ${maskSecret(process.env.JWT_SECRET!)}\n` +
      `  CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || "(not set)"}\n` +
      `  CLOUDINARY_API_KEY: ${maskSecret(process.env.CLOUDINARY_API_KEY || "")}\n` +
      `  CLOUDINARY_API_SECRET: ${maskSecret(process.env.CLOUDINARY_API_SECRET || "")}\n` +
      `  CORS_ORIGIN: ${corsOrigin.length > 0 ? corsOrigin.join(", ") : "(default development origins)"}\n` +
      `  BACKEND_URL: ${process.env.BACKEND_URL || "(not set, will use request headers)"}\n\n`
  );

  return {
    port,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    adminPassword: process.env.ADMIN_INITIAL_PASSWORD || VAR_DESCRIPTIONS.ADMIN_INITIAL_PASSWORD.default!,
    nodeEnv,
    corsOrigin,
    backendUrl: process.env.BACKEND_URL || undefined,
  };
}

/**
 * Mask sensitive parts of connection string for logs
 */
function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    return `postgresql://${parsed.hostname}:${parsed.port || 5432}${parsed.pathname}`;
  } catch {
    return "postgresql://<invalid-url>";
  }
}

/**
 * Mask secret for logs (show only first and last 4 chars)
 */
function maskSecret(secret: string): string {
  if (secret.length <= 8) return "****";
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

/**
 * Print a formatted help message with all available environment variables
 */
export function printEnvHelp(): void {
  const help =
    "\n" +
    "═".repeat(80) +
    "\n" +
    "Environment Configuration Reference\n" +
    "═".repeat(80) +
    "\n\n";

  let output = help;

  for (const [varName, config] of Object.entries(VAR_DESCRIPTIONS)) {
    const requiredLabel = config.required ? "[REQUIRED]" : "[optional]";
    const defaultLabel = config.default ? ` (default: ${config.default})` : "";
    output += `${varName} ${requiredLabel}${defaultLabel}\n`;
    output += `  ${config.description}\n\n`;
  }

  output += "═".repeat(80) + "\n";
  process.stdout.write(output);
}

/**
 * Get a single env variable with fallback and validation
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${name} is not set and no default provided`);
  }
  return value;
}
