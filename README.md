# Miden OTC Swap Board

**Live Demo:** https://miden-otc-swap-board.vercel.app  
**GitHub:** https://github.com/the1zinc/miden-otc-swap-board

A Next.js 14 dApp demonstrating trustless, Peer-to-Peer atomic swaps natively on the Miden Testnet. Instead of relying on complex, heavy smart contracts (like Uniswap on EVM), this app leverages Miden's Actor-Model and Note-based architecture to execute decentralized trades directly between users.

## How It Works

1. **Wallet Connection:** Users connect their Miden Wallet Extension.
2. **Create Swap Note:** A user creates a "Swap Note" specifying what they are offering (e.g., 100 TokenA) and the script requires what they want in return (e.g., 50 TokenB).
3. **Database Registry:** The unique `note_id` and trade details are stored in Neon Postgres.
4. **Consume Note:** Another user browses the Swap Board, sees the offer, and clicks "Take Trade". Their wallet extension consumes the Note, granting them TokenA and automatically firing a new Note containing TokenB back to the creator.

## Why This Architecture?

On traditional blockchains, an atomic swap requires an Escrow Smart Contract to hold both parties' funds. On Miden, the execution logic is embedded directly into the **Note**. When User B consumes the Note, the Miden VM strictly enforces the Note's script. If User B's transaction does not simultaneously create the payment note back to User A, the entire transaction is invalid and reverted. This enables completely decentralized, local OTC trading without liquidity pools or smart contract risk.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required environment variables (`.env.local`):

```bash
DATABASE_URL=your_neon_connection_string_here
```

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
