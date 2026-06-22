import { getStrains } from "@/lib/grow-notion";

export async function GET() {
  try {
    const strains = await getStrains();
    return Response.json(strains);
  } catch (e) {
    console.error("[/api/strains GET] ERROR:", e.code, e.status, e.message);
    return Response.json({ error: e.message, code: e.code, status: e.status }, { status: 500 });
  }
}
