import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, company, topic, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 },
      );
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const subject = `MojFlow inquiry: ${topic}: ${name}${company ? ` (${company})` : ""}`;

    await resend.emails.send({
      from: "MojFlow Website <noreply@mojflow.com>",
      to: "contact@mojflow.com",
      replyTo: email,
      subject,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "—"}`,
        `Topic: ${topic || "—"}`,
        "",
        message,
      ].join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    );
  }
}
