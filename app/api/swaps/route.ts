import { NextResponse } from "next/server";
import sql from "@/lib/db";
import {
  createDemoSwap,
  ensureSwapRegistry,
  fulfillDemoSwap,
  isDemoRegistryListing,
  isRegistryConfigError,
  listDemoOpenSwaps,
  parsePositiveAmount,
  parseSafeString,
  SwapListingInput,
} from "@/lib/swaps";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSwapRegistry();

    const swaps = await sql`
      SELECT 
        id, 
        note_id, 
        note_type,
        creator_account, 
        offering_asset, 
        offering_amount, 
        requesting_asset, 
        requesting_amount, 
        status, 
        created_at
      FROM active_swaps
      WHERE status = 'open'
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ swaps });
  } catch (error) {
    if (isRegistryConfigError(error)) {
      return NextResponse.json({ swaps: listDemoOpenSwaps(), demo: true });
    }

    console.error("Database error:", error);

    return NextResponse.json(
      { error: "Failed to fetch open swaps" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let swapInput: SwapListingInput | null = null;

  try {
    const body = await request.json();
    const {
      note_id,
      note_type,
      creator_account,
      offering_asset,
      offering_amount,
      requesting_asset,
      requesting_amount,
      approval_signature,
    } = body;

    const noteId = parseSafeString(note_id, 255);
    const creatorAccount = parseSafeString(creator_account, 255);
    const offeringAsset = parseSafeString(offering_asset, 100);
    const requestingAsset = parseSafeString(requesting_asset, 100);
    const offeringAmount = parsePositiveAmount(offering_amount);
    const requestingAmount = parsePositiveAmount(requesting_amount);
    const noteType = note_type === "private" ? "private" : "public";
    const approvalSignature = parseSafeString(approval_signature, 2048);

    if (
      !noteId ||
      !creatorAccount ||
      !offeringAsset ||
      !offeringAmount ||
      !requestingAsset ||
      !requestingAmount
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields for swap listing" },
        { status: 400 }
      );
    }

    swapInput = {
      note_id: noteId,
      note_type: noteType,
      creator_account: creatorAccount,
      offering_asset: offeringAsset,
      offering_amount: offeringAmount,
      requesting_asset: requestingAsset,
      requesting_amount: requestingAmount,
      approval_signature: approvalSignature,
    };

    await ensureSwapRegistry();

    await sql`
      INSERT INTO active_swaps (
        note_id, 
        note_type,
        creator_account, 
        offering_asset, 
        offering_amount, 
        requesting_asset, 
        requesting_amount,
        approval_signature
      ) 
      VALUES (
        ${swapInput.note_id},
        ${swapInput.note_type},
        ${swapInput.creator_account},
        ${swapInput.offering_asset},
        ${swapInput.offering_amount},
        ${swapInput.requesting_asset},
        ${swapInput.requesting_amount},
        ${swapInput.approval_signature}
      )
      ON CONFLICT (note_id) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRegistryConfigError(error)) {
      if (swapInput && isDemoRegistryListing(swapInput)) {
        createDemoSwap(swapInput);
        return NextResponse.json({ success: true, demo: true });
      }

      return NextResponse.json(
        { error: "Swap registry database is not configured." },
        { status: 503 }
      );
    }

    console.error("Swap creation error:", error);

    return NextResponse.json(
      { error: "Failed to create swap listing" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  let noteId: string | null = null;
  let fulfilledTxId: string | null = null;
  let fulfilledBy: string | null = null;

  try {
    const { note_id, fulfilled_tx_id, fulfilled_by } = await request.json();
    noteId = parseSafeString(note_id, 255);
    fulfilledTxId = parseSafeString(fulfilled_tx_id, 255);
    fulfilledBy = parseSafeString(fulfilled_by, 255);
    
    if (!noteId) {
      return NextResponse.json({ error: "Missing note_id" }, { status: 400 });
    }

    await ensureSwapRegistry();

    const result = (await sql`
      UPDATE active_swaps 
      SET
        status = 'fulfilled',
        fulfilled_tx_id = ${fulfilledTxId},
        fulfilled_by = ${fulfilledBy},
        fulfilled_at = CURRENT_TIMESTAMP
      WHERE note_id = ${noteId}
        AND status = 'open'
      RETURNING id
    `) as Array<{ id: number }>;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Open swap listing was not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isRegistryConfigError(error)) {
      if (noteId && fulfillDemoSwap(noteId, fulfilledTxId, fulfilledBy)) {
        return NextResponse.json({ success: true, demo: true });
      }

      if (noteId) {
        return NextResponse.json(
          { error: "Open swap listing was not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Swap registry database is not configured." },
        { status: 503 }
      );
    }

    console.error("Failed to fulfill swap:", error);

    return NextResponse.json(
      { error: "Failed to update swap status" },
      { status: 500 }
    );
  }
}
