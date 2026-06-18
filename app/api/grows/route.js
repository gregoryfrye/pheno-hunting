import { getGrows } from "@/lib/grow-notion";

export async function GET() {
  try {
    const grows = await getGrows();
    return Response.json(grows);
  } catch (e) {
    console.error("[/api/grows GET] ERROR:", e.code, e.status, e.message);
    return Response.json({ error: e.message, code: e.code, status: e.status }, { status: 500 });
  }
}
