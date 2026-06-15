import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  const { prompt, max_tokens = 1000 } = await request.json();

  if (!prompt) {
    return Response.json({ error: "prompt required" }, { status: 400 });
  }

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content.find(b => b.type === "text")?.text || "";
  return Response.json({ text });
}
