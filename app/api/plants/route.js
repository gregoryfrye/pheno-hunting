import { getPlants } from "@/lib/grow-notion";

export async function GET() {
  try {
    const plants = await getPlants();
    return Response.json(plants);
  } catch (e) {
    console.error("[/api/plants GET] ERROR:", e.code, e.status, e.message);
    return Response.json({ error: e.message, code: e.code, status: e.status }, { status: 500 });
  }
}
