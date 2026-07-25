import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import {
  EXPLORER_CLUSTER,
  NETWORK_LABEL,
  NETWORK_LABEL_LOWER,
  rpcEndpoint,
  SOLANA_NETWORK,
} from "./network";

export { SOLANA_NETWORK, NETWORK_LABEL, NETWORK_LABEL_LOWER };

export function getRpcEndpoint(): string {
  return rpcEndpoint();
}

export function getConnection(): Connection {
  return new Connection(getRpcEndpoint(), "confirmed");
}

const CLUSTER_QS = EXPLORER_CLUSTER ? `?cluster=${EXPLORER_CLUSTER}` : "";

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}${CLUSTER_QS}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}${CLUSTER_QS}`;
}

/** Build the canonical approval message a wallet signs. */
export function buildApprovalMessage(params: {
  payoutId: string;
  amountSol: number;
  recipient: string;
  treasuryName: string;
  timestamp: string;
}): string {
  return `Approve Bylaw payout ${params.payoutId} for ${params.amountSol} SOL to ${params.recipient} from treasury ${params.treasuryName} at ${params.timestamp}.`;
}

/** Fetch a wallet's balance in SOL on the configured cluster. Null on failure. */
export async function getBalanceSol(address: string): Promise<number | null> {
  try {
    const conn = getConnection();
    const lamports = await conn.getBalance(new PublicKey(address));
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return null;
  }
}

/**
 * Execute a SOL transfer on the configured cluster from the connected wallet.
 * Returns the confirmed transaction signature. Throws on any failure with a
 * user-understandable message.
 */
export async function executeTransfer(
  wallet: WalletContextState,
  recipient: string,
  amountSol: number,
): Promise<string> {
  if (!wallet.publicKey || !wallet.sendTransaction) {
    throw new Error("Wallet is not connected.");
  }

  let toPubkey: PublicKey;
  try {
    toPubkey = new PublicKey(recipient);
  } catch {
    throw new Error("Recipient is not a valid Solana address.");
  }

  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
  if (lamports <= 0) throw new Error("Amount must be greater than 0.");

  const connection = getConnection();

  const balance = await connection.getBalance(wallet.publicKey);
  if (balance < lamports) {
    throw new Error(
      `Insufficient ${NETWORK_LABEL_LOWER} balance. Use a ${NETWORK_LABEL_LOWER} faucet to fund the connected wallet.`,
    );
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({
    feePayer: wallet.publicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey,
      lamports,
    }),
  );

  const signature = await wallet.sendTransaction(tx, connection);
  const confirmation = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  if (confirmation.value.err) {
    throw new Error(`Transaction failed to confirm on ${NETWORK_LABEL_LOWER}.`);
  }

  return signature;
}
