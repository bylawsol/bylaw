// Central Solana network config. Kept free of @solana/web3.js imports so it can
// be used from both server components (landing) and client components (app).
// Flip NEXT_PUBLIC_SOLANA_NETWORK to switch the whole app's target cluster.

export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export const SOLANA_NETWORK: SolanaCluster = ((): SolanaCluster => {
  const v = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet").toLowerCase();
  if (v === "testnet" || v === "mainnet-beta") return v;
  return "devnet";
})();

/** Human label, e.g. "Testnet". */
export const NETWORK_LABEL =
  SOLANA_NETWORK === "mainnet-beta"
    ? "Mainnet"
    : SOLANA_NETWORK === "testnet"
      ? "Testnet"
      : "Devnet";

/** Lower-case label for prose, e.g. "testnet". */
export const NETWORK_LABEL_LOWER = NETWORK_LABEL.toLowerCase();

/** Public RPC endpoint for the configured cluster. */
export function rpcEndpoint(): string {
  switch (SOLANA_NETWORK) {
    case "testnet":
      return "https://api.testnet.solana.com";
    case "mainnet-beta":
      return "https://api.mainnet-beta.solana.com";
    default:
      return "https://api.devnet.solana.com";
  }
}

/** Solana Explorer `?cluster=` value. Devnet/testnet map directly; mainnet omits. */
export const EXPLORER_CLUSTER =
  SOLANA_NETWORK === "mainnet-beta" ? "" : SOLANA_NETWORK;
