import { getLogs, saveLog } from "@/lib/grow-notion";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const plantId = searchParams.get("plantId") ?? undefined;
  const growId = searchParams.get("growId") ?? undefined;
  const logs = await getLogs({ plantId, growId });
  return Response.json(logs);
}

export async function POST(request) {
  const data = await request.json();
  const log = await saveLog(data);
  return Response.json(log ?? { saved: false });
}
