"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@demox-labs/miden-wallet-adapter-reactui";
import { useWallet } from "@demox-labs/miden-wallet-adapter-react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface WalletConnectProps {
  onConnect(accountId: string | null): void;
}

function truncateId(id: string): string {
  if (id.length <= 20) return id;
  return `${id.slice(0, 12)}...${id.slice(-6)}`;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const { connected, address, connecting } = useWallet();
  const [demoAddress, setDemoAddress] = useState<string | null>(null);

  // Sync wallet state to parent whenever it changes
  useEffect(() => {
    if (connected && address) {
      setDemoAddress(null);
      onConnect(address);
    } else if (demoAddress) {
      onConnect(demoAddress);
    } else {
      onConnect(null);
    }
  }, [connected, address, demoAddress, onConnect]);

  function useDemoWallet() {
    const id = `miden1sim${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    setDemoAddress(id);
  }

  function clearDemo() {
    setDemoAddress(null);
  }

  const activeAddress = demoAddress || (connected ? address : null);

  return (
    <section className="w-full rounded-xl border border-emerald-500/20 bg-zinc-900 p-6 shadow-[0_0_40px_rgba(16,185,129,0.06)] light:bg-white light:border-emerald-600/20">

      {/* Override adapter button styles to match dark theme */}
      <style>{`
        .wallet-adapter-button {
          background: #10b981 !important;
          color: #09090b !important;
          font-weight: 700 !important;
          font-size: 0.875rem !important;
          border-radius: 0.375rem !important;
          padding: 0.5rem 1.25rem !important;
          height: 2.5rem !important;
          border: none !important;
          font-family: inherit !important;
          letter-spacing: 0.01em !important;
          transition: background 0.15s !important;
        }
        .wallet-adapter-button:hover:not([disabled]) {
          background: #34d399 !important;
        }
        .wallet-adapter-button-trigger {
          background: #10b981 !important;
        }
        .wallet-adapter-modal-wrapper {
          background: #18181b !important;
          border: 1px solid rgba(16,185,129,0.2) !important;
          border-radius: 0.75rem !important;
        }
        .wallet-adapter-modal-title {
          color: #34d399 !important;
        }
        .wallet-adapter-modal-list li {
          background: #27272a !important;
          border-radius: 0.5rem !important;
        }
        .wallet-adapter-modal-list li:hover {
          background: #3f3f46 !important;
        }
        .wallet-adapter-modal-list-more {
          color: #34d399 !important;
        }
        .wallet-adapter-modal-button-close {
          background: #27272a !important;
        }
        .wallet-adapter-modal-button-close svg { fill: #a1a1aa !important; }
      `}</style>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-400/60 light:text-emerald-700/60">
            wallet connection
          </p>
          <h2 className="mt-1.5 text-lg font-semibold text-emerald-300 light:text-emerald-800">
            {activeAddress ? "Wallet Connected" : "Connect Your Miden Wallet"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {demoAddress ? (
            /* Demo mode active */
            <>
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 light:text-emerald-800 light:bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-mono text-xs">{truncateId(demoAddress)}</span>
                <span className="text-[10px] text-emerald-400/60">(demo)</span>
              </div>
              <button
                onClick={clearDemo}
                className="rounded-md border border-zinc-700 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 transition hover:border-red-500/40 hover:text-red-400"
              >
                Clear
              </button>
            </>
          ) : (
            /* Real wallet button from adapter + Demo fallback */
            <div className="flex items-center gap-2">
              {connecting && (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              )}
              {/* Official adapter button connects to the real Miden extension. */}
              <WalletMultiButton />
              <button
                onClick={useDemoWallet}
                className="inline-flex h-10 items-center rounded-md border border-zinc-700 px-4 text-xs font-bold uppercase tracking-wider text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-400 light:border-zinc-300 light:text-zinc-500 light:hover:text-emerald-700"
              >
                Demo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Show info banner only when nothing connected and not in demo */}
      {!activeAddress && !connecting && (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-500/20 bg-amber-950/10 p-3 text-xs text-amber-300/80 light:bg-amber-50 light:border-amber-400/30 light:text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            No Miden extension detected. Install the{" "}
            <a
              href="https://chromewebstore.google.com/detail/miden-wallet/ablmompanofnodfdkgchkpmphailefpb"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Miden Browser Wallet
            </a>{" "}
            or use <button onClick={useDemoWallet} className="underline font-bold hover:no-underline">Demo mode</button> to test.
          </span>
        </div>
      )}
    </section>
  );
}
