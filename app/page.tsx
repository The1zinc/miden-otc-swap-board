"use client";

import { useState } from "react";
import CreateSwap from "@/components/CreateSwap";
import SwapBoard from "@/components/SwapBoard";
import WalletConnect from "@/components/WalletConnect";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const [accountId, setAccountId] = useState<string | null>(null);

  return (
    <main className="min-h-screen px-4 py-8 font-mono sm:px-6 lg:px-8 bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between border-b border-emerald-500/20 pb-6 light:border-emerald-600/20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-500/80 light:text-emerald-700/70">
              miden testnet dapp
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-emerald-300 sm:text-5xl light:text-emerald-800">
              MIDEN OTC SWAP BOARD
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base light:text-zinc-500">
              Connect your Miden Wallet to create trustless, P2P atomic swaps using Miden Notes.
              No smart contracts required. Trades settle natively on the Miden Testnet.
            </p>
          </div>

          {/* Theme toggle top-right */}
          <div className="flex shrink-0 items-start pt-1">
            <ThemeToggle />
          </div>
        </header>

        {/* ── Wallet Banner ──────────────────────────────────────── */}
        <WalletConnect onConnect={setAccountId} />

        {/* ── Main Panels ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.5fr]">
          <div className="h-full">
            <CreateSwap accountId={accountId} />
          </div>
          <div className="h-full">
            <SwapBoard accountId={accountId} />
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer className="mt-8 border-t border-emerald-500/20 py-8 text-center text-xs uppercase tracking-[0.18em] text-emerald-500/40 light:border-emerald-600/20 light:text-emerald-700/40">
          Powered by Miden · Atomic Swap Notes · Neon DB
        </footer>
      </div>
    </main>
  );
}
