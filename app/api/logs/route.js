import { getLogs, saveLog } from "@/lib/grow-notion";

export async function GET() {
  try {
    const logs = await getLogs();
    return Response.json(logs);
  } catch (e) {
    console.error("[/api/logs GET] ERROR:", e.code, e.status, e.message);
    return Response.json({ error: e.message, code: e.code, status: e.status }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const log = await saveLog(data);
    return Response.json(log ?? { saved: false });
  } catch (e) {
    console.error("[/api/logs POST] ERROR:", e.code, e.status, e.message);
    return Response.json({ error: e.message, code: e.code, status: e.status }, { status: 500 });
  }
}
