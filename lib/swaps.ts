import sql from "@/lib/db";

export type NoteType = "public" | "private";

export interface SwapListingInput {
  note_id: string;
  note_type: NoteType;
  creator_account: string;
  offering_asset: string;
  offering_amount: string;
  requesting_asset: string;
  requesting_amount: string;
  approval_signature: string | null;
}

interface DemoSwapListing extends SwapListingInput {
  id: number;
  status: "open" | "fulfilled";
  fulfilled_tx_id: string | null;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  created_at: string;
}

type DemoRegistryGlobal = typeof globalThis & {
  __midenDemoSwaps?: DemoSwapListing[];
  __midenDemoSwapId?: number;
};

const demoRegistry = globalThis as DemoRegistryGlobal;

function getDemoSwaps() {
  demoRegistry.__midenDemoSwaps ??= [];
  return demoRegistry.__midenDemoSwaps;
}

function getNextDemoSwapId() {
  demoRegistry.__midenDemoSwapId = (demoRegistry.__midenDemoSwapId ?? 0) + 1;
  return demoRegistry.__midenDemoSwapId;
}

export async function ensureSwapRegistry() {
  await sql`
    CREATE TABLE IF NOT EXISTS active_swaps (
      id SERIAL PRIMARY KEY,
      note_id VARCHAR(255) UNIQUE NOT NULL,
      creator_account VARCHAR(255) NOT NULL,
      offering_asset VARCHAR(100) NOT NULL,
      offering_amount NUMERIC NOT NULL,
      requesting_asset VARCHAR(100) NOT NULL,
      requesting_amount NUMERIC NOT NULL,
      status VARCHAR(50) DEFAULT 'open',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    ALTER TABLE active_swaps
    ADD COLUMN IF NOT EXISTS note_type VARCHAR(20) DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS approval_signature TEXT,
    ADD COLUMN IF NOT EXISTS fulfilled_tx_id TEXT,
    ADD COLUMN IF NOT EXISTS fulfilled_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP WITH TIME ZONE
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_swaps_status ON active_swaps(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_swaps_creator ON active_swaps(creator_account)`;
}

export function isRegistryConfigError(error: unknown) {
  return error instanceof Error && error.message.includes("DATABASE_URL");
}

export function isDemoRegistryListing(
  listing: Pick<SwapListingInput, "note_id" | "creator_account">,
) {
  return (
    listing.note_id.startsWith("demo-") ||
    listing.creator_account.startsWith("miden1sim")
  );
}

export function listDemoOpenSwaps() {
  return getDemoSwaps()
    .filter((swap) => swap.status === "open")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((swap) => ({ ...swap }));
}

export function createDemoSwap(listing: SwapListingInput) {
  const swaps = getDemoSwaps();

  if (swaps.some((swap) => swap.note_id === listing.note_id)) {
    return;
  }

  swaps.push({
    ...listing,
    id: getNextDemoSwapId(),
    status: "open",
    fulfilled_tx_id: null,
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: new Date().toISOString(),
  });
}

export function fulfillDemoSwap(
  noteId: string,
  fulfilledTxId: string | null,
  fulfilledBy: string | null,
) {
  const swap = getDemoSwaps().find(
    (demoSwap) => demoSwap.note_id === noteId && demoSwap.status === "open",
  );

  if (!swap) return false;

  swap.status = "fulfilled";
  swap.fulfilled_tx_id = fulfilledTxId;
  swap.fulfilled_by = fulfilledBy;
  swap.fulfilled_at = new Date().toISOString();
  return true;
}

export function parsePositiveAmount(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return normalized;
}

export function parseSafeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}
