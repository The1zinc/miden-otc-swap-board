import { NextResponse } from "next/server";
import { ensureSwapRegistry } from "@/lib/swaps";

export async function GET() {
  return NextResponse.json(
    { error: "Use POST /api/init-db to initialize the swap registry." },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  try {
    const secret = process.env.INIT_DB_SECRET;
    const provided = request.headers.get("x-init-secret");

    if (secret && provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSwapRegistry();

    return NextResponse.json({ message: "Swap registry initialized." });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return NextResponse.json(
      { error: "Failed to initialize database", details: String(error) },
      { status: 500 }
    );
  }
}
