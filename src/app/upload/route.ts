import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { data }: { data: string } = await req.json(); // base64 image from frontend

    const uploadResponse = await cloudinary.uploader.upload(data, {
      folder: "ptl-lawyers",
    });

    return NextResponse.json({ url: uploadResponse.secure_url });
  } catch (err: unknown) {
    console.error("❌ Upload failed:", err);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Upload endpoint active" });
}
