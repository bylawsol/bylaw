import { NextResponse } from "next/server";
import { publicEnv, supabaseConfigured } from "@/lib/env";
import { rpcEndpoint } from "@/lib/network";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

async function checkRpc(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const res = await withTimeout(
      fetch(rpcEndpoint(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
        cache: "no-store",
      }),
      3000,
    );
    return { ok: res.ok };
  } catch (e) {
    return { ok: false, detail: (e as Error).message };
  }
}

async function checkDb(): Promise<{ ok: boolean; configured: boolean; detail?: string }> {
  if (!supabaseConfigured) return { ok: true, configured: false };
  try {
    const url = `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`;
    const res = await withTimeout(
      fetch(url, {
        headers: { apikey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY as string },
        cache: "no-store",
      }),
      3000,
    );
    return { ok: res.status < 500, configured: true };
  } catch (e) {
    return { ok: false, configured: true, detail: (e as Error).message };
  }
}

export async function GET() {
  const [rpc, db] = await Promise.all([checkRpc(), checkDb()]);
  const healthy = rpc.ok && db.ok;
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      app: "ok",
      network: publicEnv.NEXT_PUBLIC_SOLANA_NETWORK,
      rpc,
      database: db,
      // No secrets are exposed here.
      time: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
