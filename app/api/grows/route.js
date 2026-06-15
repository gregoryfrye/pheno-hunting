import { getGrows } from "@/lib/grow-notion";

export async function GET() {
  const grows = await getGrows();
  return Response.json(grows);
}
