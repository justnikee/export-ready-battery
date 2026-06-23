import { NextRequest, NextResponse } from "next/server";

export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  inquiryType: string;
  message: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactFormData;

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.email?.trim() || !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // TODO: Wire to email service (e.g., Resend, SendGrid, or backend API)
    // For now, log the inquiry and return success so the UI shows confirmation.
    console.log("[Contact Form] Inquiry received:", {
      name: body.name,
      email: body.email,
      company: body.company,
      phone: body.phone,
      inquiryType: body.inquiryType,
      message: body.message.slice(0, 200),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
