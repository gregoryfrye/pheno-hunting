import { getPlants } from "@/lib/grow-notion";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const growSlug = searchParams.get("growSlug") ?? undefined;
  const plants = await getPlants(growSlug);
  return Response.json(plants);
}
