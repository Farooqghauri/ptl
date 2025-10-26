import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lawyer, { ILawyer } from "@/models/Lawyer";

/**
 * POST - Create new lawyer
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();
    const body: Partial<ILawyer> = await req.json();

    const { name, email, telephone, licenseNumber } = body;
    if (!name || !email || !telephone || !licenseNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const lawyer = await Lawyer.create(body);
    return NextResponse.json(lawyer, { status: 201 });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unexpected server error";
    console.error("POST /api/lawyers failed:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET - Fetch all lawyers
 */
export async function GET(): Promise<NextResponse> {
  try {
    await dbConnect();
    const lawyers = await Lawyer.find();
    return NextResponse.json(lawyers, { status: 200 });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unexpected server error";
    console.error("GET /api/lawyers failed:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
