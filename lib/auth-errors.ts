/**
 * lib/auth-errors.ts
 *
 * Normalises raw Supabase Auth error messages into user-friendly strings.
 * Rate limit errors get a special structured response so the UI can show
 * a countdown / retry timer.
 */

export interface AuthErrorResult {
  /** Human-readable message to display */
  message: string;
  /** True when this is specifically an email rate-limit error */
  isRateLimit: boolean;
  /** How many seconds the user should wait before retrying (when isRateLimit=true) */
  retryAfterSeconds: number;
}

const RATE_LIMIT_PHRASES = [
  "email rate limit exceeded",
  "rate limit",
  "too many requests",
  "over_email_send_rate_limit",
  "429",
];

/** Parse optional `retry_after` seconds from the error body if Supabase returns it */
function parseRetryAfter(raw?: string): number {
  if (!raw) return 60;
  const match = raw.match(/(\d+)\s*(second|minute)/i);
  if (!match) return 60;
  const val = parseInt(match[1], 10);
  return match[2].toLowerCase().startsWith("minute") ? val * 60 : val;
}

/**
 * Normalise any error thrown by a Supabase Auth call into a friendly result.
 *
 * @param err - The raw error from supabase.auth.*
 */
export function normaliseAuthError(err: unknown): AuthErrorResult {
  const raw =
    (err as any)?.message ??
    (err as any)?.error_description ??
    String(err ?? "Unknown error");

  const lower = raw.toLowerCase();
  const isRateLimit = RATE_LIMIT_PHRASES.some((p) => lower.includes(p));

  if (isRateLimit) {
    const retryAfterSeconds = parseRetryAfter(raw);
    return {
      message: `Too many emails sent. Please wait ${retryAfterSeconds >= 60 ? `${Math.ceil(retryAfterSeconds / 60)} minute(s)` : `${retryAfterSeconds} seconds`} before trying again.`,
      isRateLimit: true,
      retryAfterSeconds,
    };
  }

  // Map other common raw messages to friendlier ones
  const FRIENDLY: Record<string, string> = {
    "invalid login credentials": "Incorrect email or password. Please try again.",
    "email not confirmed": "Please check your inbox and confirm your email before signing in.",
    "user already registered": "An account with this email already exists. Try signing in instead.",
    "password should be at least 6 characters": "Password must be at least 6 characters.",
    "invalid otp": "The code you entered is incorrect or expired. Please request a new one.",
    "token has expired or is invalid": "Your verification code has expired. Please request a new one.",
    "signup is disabled": "New sign-ups are temporarily disabled. Please contact support.",
    "email link is invalid or has expired": "This link has expired. Please request a new one.",
  };

  const friendly = Object.entries(FRIENDLY).find(([key]) => lower.includes(key));

  return {
    message: friendly ? friendly[1] : raw,
    isRateLimit: false,
    retryAfterSeconds: 0,
  };
}
