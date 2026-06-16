import { getLogs, saveLog } from "@/lib/grow-notion";

export async function GET() {
  const logs = await getLogs();
  return Response.json(logs);
}

export async function POST(request) {
  const data = await request.json();
  const log = await saveLog(data);
  return Response.json(log ?? { saved: false });
}
