"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { Transaction } from "@demox-labs/miden-wallet-adapter";

interface SwapListing {
  id: number;
  note_id: string;
  note_type: "public" | "private";
  creator_account: string;
  offering_asset: string;
  offering_amount: string;
  requesting_asset: string;
  requesting_amount: string;
  status: string;
  created_at: string;
}

interface SwapBoardProps {
  accountId: string | null;
}

export default function SwapBoard({ accountId }: SwapBoardProps) {
  const { address, connected, requestTransaction } = useWallet();
  const [swaps, setSwaps] = useState<SwapListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFulfilling, setIsFulfilling] = useState<string | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);

  const isDemoWallet = accountId?.startsWith("miden1sim") ?? false;

  async function fetchSwaps() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/swaps");
      if (res.ok) {
        const data = await res.json();
        setSwaps(data.swaps || []);
        setBoardError(null);
      } else {
        const data = await res.json().catch(() => null);
        setSwaps([]);
        setBoardError(data?.error || "Failed to load swap registry.");
      }
    } catch (err) {
      console.error("Failed to fetch swaps:", err);
      setBoardError("Failed to reach swap registry.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSwaps();
    const interval = setInterval(fetchSwaps, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleTakeTrade(swap: SwapListing) {
    setIsFulfilling(swap.note_id);
    setBoardError(null);

    try {
      let transactionId: string | null = null;

      if (isDemoWallet) {
        if (!window.confirm(`Mark demo listing ${swap.note_id} as fulfilled?`)) {
          throw new Error("User rejected the transaction.");
        }
        transactionId = `demo-${crypto.randomUUID()}`;
      } else {
        if (!connected || !address || !requestTransaction) {
          throw new Error("Connect the Miden Wallet extension to consume this note.");
        }
        if (swap.note_type === "private") {
          throw new Error("Private note import is not wired in this Vercel demo.");
        }

        const amount = Number(swap.offering_amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Swap listing has an invalid amount.");
        }

        const transaction = Transaction.createConsumeTransaction(
          swap.offering_asset,
          swap.note_id,
          "public",
          amount,
        );
        transactionId = await requestTransaction(transaction);
      }

      const res = await fetch("/api/swaps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note_id: swap.note_id,
          fulfilled_tx_id: transactionId,
          fulfilled_by: address || accountId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update swap listing.");
      }
    } catch (err) {
      console.error(err);
      setBoardError(err instanceof Error ? err.message : "Error fulfilling swap note.");
    } finally {
      setIsFulfilling(null);
      fetchSwaps();
    }
  }

  function formatAccountId(id: string) {
    if (id.length <= 12) return id;
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  }

  return (
    <section className="h-full rounded-xl border p-6 flex flex-col transition-colors border-emerald-500/20 bg-zinc-900/50 shadow-[0_0_30px_rgba(16,185,129,0.03)] light:bg-white light:border-emerald-600/20 light:shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-emerald-500/10 pb-5 light:border-emerald-600/15">
        <div>
          <h2 className="text-xl font-bold text-emerald-300 light:text-emerald-800">Open Swaps</h2>
          <p className="mt-1 text-xs font-medium text-zinc-400 light:text-zinc-500">Signed public-note registry</p>
        </div>
        <button 
          onClick={fetchSwaps}
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition bg-zinc-900 text-emerald-500 hover:bg-zinc-800 light:bg-emerald-50 light:text-emerald-700 light:hover:bg-emerald-100"
        >
          Refresh
        </button>
      </div>

      {boardError && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-950/30 p-3 text-sm font-medium text-red-200 light:bg-red-50 light:text-red-700 light:border-red-300/40">
          {boardError}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading && swaps.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 text-emerald-500 light:text-emerald-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading Board...</span>
          </div>
        ) : swaps.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm font-medium text-zinc-500 light:text-zinc-400">
            No active swaps available.
          </div>
        ) : (
          swaps.map((swap) => (
            <div 
              key={swap.note_id}
              className="flex flex-col gap-4 rounded-lg border p-4 transition border-emerald-500/10 bg-zinc-900/50 hover:border-emerald-500/30 light:bg-zinc-50 light:border-emerald-600/10 light:hover:border-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 light:text-zinc-500">
                  {formatAccountId(swap.creator_account)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/50 light:text-emerald-600/60">
                  Active
                </span>
              </div>
              
              <div className="flex items-center justify-between rounded-md p-3 shadow-sm bg-zinc-950 light:bg-emerald-50/50 light:shadow-none light:border light:border-emerald-500/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 light:text-zinc-500">Offering</span>
                  <div className="font-bold text-emerald-400 light:text-emerald-700">
                    {swap.offering_amount} {swap.offering_asset}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-emerald-800 mx-4 shrink-0 light:text-emerald-400" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold uppercase text-zinc-400 light:text-zinc-500">Asking</span>
                  <div className="font-bold text-emerald-400 light:text-emerald-700">
                    {swap.requesting_amount} {swap.requesting_asset}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTakeTrade(swap)}
                disabled={isFulfilling === swap.note_id}
                className="mt-1 w-full inline-flex min-h-[36px] items-center justify-center rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-500/20 light:bg-emerald-50 light:border-emerald-500/30 light:text-emerald-700 light:hover:bg-emerald-100"
              >
                {isFulfilling === swap.note_id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : null}
                {isFulfilling === swap.note_id ? "Consuming Note..." : "Consume & Mark Filled"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
