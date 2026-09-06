import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, company, topic, message, position } = await req.json();

    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof message !== "string" || !message.trim()) {
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

    const roles: Record<string, string> = { j1: "Sales Development Representative (SDR)", j2: "Account Executive", j3: "AI Engineer" };
    if (position && (typeof position !== "string" || !Object.hasOwn(roles, position))) {
      return NextResponse.json({ error: "Invalid position." }, { status: 400 });
    }
    const subject = position ? `Prijava za posao: ${roles[position]} - ${name}` : `MojFlow inquiry: ${topic}: ${name}${company ? ` (${company})` : ""}`;

    const result = await resend.emails.send({
      from: "MojFlow Website <noreply@mojflow.com>",
      to: "contact@mojflow.com",
      replyTo: email,
      subject,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "-"}`,
        `Topic: ${topic || "-"}`,
        ...(position ? [`Position: ${roles[position]}`] : []),
        "",
        message,
      ].join("\n"),
    });

    if (result.error) {
      console.error("Contact delivery failed:", result.error.name);
      return NextResponse.json({ error: "Email delivery failed." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    );
  }
}
