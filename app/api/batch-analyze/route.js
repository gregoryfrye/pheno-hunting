export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images");

    const fileInfo = files.map(f => ({ name: f.name, size: f.size }));
    console.log(`[/api/batch-analyze] received ${files.length} file(s):`, fileInfo);

    return Response.json({ received: files.length, files: fileInfo });
  } catch (e) {
    console.error("[/api/batch-analyze POST] ERROR:", e.code, e.status, e.message);
    return Response.json({ error: e.message, code: e.code, status: e.status }, { status: 500 });
  }
}
