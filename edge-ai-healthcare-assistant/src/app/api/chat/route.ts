import { chatWithHealthContext } from "@/lib/openai";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message, history, context } = (await req.json()) as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      context: string;
    };
    if (!message) return Response.json({ error: "message is required" }, { status: 400 });

    const reply = await chatWithHealthContext({ message, history: history ?? [], context: context ?? "" });
    return Response.json({ reply });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to generate a reply" }, { status: 500 });
  }
}
