import dbConnect from "@/lib/mongodb";
import Lawyer, { ILawyer } from "@/models/Lawyer";

export async function GET() {
  try {
    await dbConnect();
    const lawyers = await Lawyer.find().sort({ createdAt: -1 });
    return new Response(JSON.stringify(lawyers), { status: 200 });
  } catch (err: unknown) {
    console.error("❌ GET /api/lawyers failed:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body: ILawyer = await req.json();
    const lawyer = await Lawyer.create(body);
    return new Response(JSON.stringify(lawyer), { status: 201 });
  } catch (err: unknown) {
    console.error("❌ POST /api/lawyers failed:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400 }
    );
  }
}
