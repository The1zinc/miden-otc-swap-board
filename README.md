# Miden OTC Swap Board

**Live Demo:** https://miden-otc-swap-board.vercel.app  
**GitHub:** https://github.com/the1zinc/miden-otc-swap-board

A Next.js 14 dApp prototype for a Miden Testnet OTC swap board. Vercel hosts the UI and a Neon-backed registry of signed note listings; Miden wallet actions stay client-side in the browser extension.

## How It Works

1. **Wallet Connection:** Users connect their Miden Wallet Extension.
2. **Publish Listing:** A user pastes an existing Miden note ID, signs the listing, and publishes the trade details.
3. **Database Registry:** The `note_id`, trade details, and optional approval signature are stored in Neon Postgres.
4. **Consume Note:** Another user browses the Swap Board and asks the wallet extension to consume the public note. After the wallet returns a transaction ID, the registry marks the listing fulfilled.

## Why This Architecture?

On traditional blockchains, an atomic swap requires an escrow smart contract to hold both parties' funds. On Miden, execution logic can live directly in a **Note**. This prototype keeps the deployable Vercel surface small: the app is a listing registry plus wallet handoff, while note scripting and settlement remain in the user's Miden wallet flow.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Environment variables for a persistent registry (`.env.local`):

```bash
DATABASE_URL=your_neon_connection_string_here
NEXT_PUBLIC_MIDEN_RPC=https://rpc.testnet.miden.io:443
```

Without `DATABASE_URL`, Demo mode uses an in-memory registry for local testing.

## Neon Setup

1. Create a Neon project.
2. Copy the pooled connection string into `.env.local` as `DATABASE_URL`.
3. Open the Neon SQL editor and run `database.sql` to generate the `active_swaps` table.

## Tech Stack

- Next.js 14 App Router
- TypeScript strict mode
- Tailwind CSS terminal UI
- Miden Wallet Extension integration
- Neon serverless Postgres via `@neondatabase/serverless`
- `lucide-react` icons
