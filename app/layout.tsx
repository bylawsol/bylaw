import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { NETWORK_LABEL } from "@/lib/network";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bylaw — Policy-bound payouts for onchain teams",
  description:
    `Create treasury rules, submit payout requests, collect wallet-signed approvals, and execute payments with a clean audit trail. Solana ${NETWORK_LABEL} MVP.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-background font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
