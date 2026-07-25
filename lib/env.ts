import { z } from "zod";

/**
 * Environment validation. This checks the *format* of variables that are
 * present and exposes typed accessors. It intentionally does NOT hard-crash the
 * current localStorage ("Local") mode, in which Supabase and server secrets are
 * optional. Production requirements are documented in PRODUCTION.md and enforced
 * by `assertProductionEnv()` (call it from server bootstrap once the server data
 * layer exists).
 */

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SOLANA_NETWORK: z
    .enum(["devnet", "testnet", "mainnet-beta"])
    .default("devnet"),
  NEXT_PUBLIC_SOLANA_EXPLORER_CLUSTER: z
    .enum(["devnet", "testnet", "mainnet-beta", ""])
    .optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
});

const serverSchema = z.object({
  // Required for the (future) server data + auth layer — see PRODUCTION.md.
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),
  SOLANA_RPC_FALLBACK_URL: z.string().url().optional(),
  SOLANA_COMMITMENT: z.enum(["processed", "confirmed", "finalized"]).default("confirmed"),
  SESSION_SECRET: z.string().min(32).optional(),
  AUTH_NONCE_SECRET: z.string().min(32).optional(),
  SENTRY_DSN: z.string().optional(),
});

function readPublic() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    NEXT_PUBLIC_SOLANA_EXPLORER_CLUSTER:
      process.env.NEXT_PUBLIC_SOLANA_EXPLORER_CLUSTER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    // Format errors on public vars are a real misconfiguration — surface them.
    throw new Error(
      "Invalid public environment variables: " +
        JSON.stringify(parsed.error.flatten().fieldErrors),
    );
  }
  return parsed.data;
}

export const publicEnv = readPublic();

export function serverEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Invalid server environment variables: " +
        JSON.stringify(parsed.error.flatten().fieldErrors),
    );
  }
  return parsed.data;
}

/** True when a Supabase project is configured (URL + anon key present). */
export const supabaseConfigured =
  !!publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
  !!publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Fail-fast guard for the production server data/auth layer. Call this from
 * server bootstrap ONCE that layer is implemented (Phase 2). It is not wired in
 * yet because the app currently runs in local mode with no server secrets.
 */
export function assertProductionEnv() {
  const missing: string[] = [];
  const s = process.env;
  if (!s.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!s.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!s.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!s.SOLANA_RPC_URL) missing.push("SOLANA_RPC_URL");
  if (!s.SESSION_SECRET) missing.push("SESSION_SECRET");
  if (!s.AUTH_NONCE_SECRET) missing.push("AUTH_NONCE_SECRET");
  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
}
