import Anthropic from "@anthropic-ai/sdk";
import { getPlants } from "@/lib/grow-notion.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HEALTH_VALUES = ["Excellent", "Good", "Fair", "Poor", "Critical"];
const COLOR_VALUES  = ["Light Green", "Green", "Dark Green"];

function median(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mostCommon(arr) {
  if (!arr.length) return null;
  const counts = {};
  for (const v of arr) counts[v] = (counts[v] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

async function analyzeImage(file, plantNames) {
  try {
    const buffer   = Buffer.from(await file.arrayBuffer());
    const base64   = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = `You are analyzing a photo of a cannabis plant in a grow operation.
Valid plant tags — use exactly one of these or null if you cannot identify the plant: ${plantNames.join(", ")}
Color must be exactly one of: ${COLOR_VALUES.join(", ")}
Health must be exactly one of: ${HEALTH_VALUES.join(", ")}

Reply with ONLY valid JSON, no markdown fences, no extra text:
{"plantTag":null,"heightInches":null,"color":"Green","health":"Good","concern":null,"confidence":0.8}

Fields:
- plantTag: one of the valid tags above, or null
- heightInches: estimated plant height as a number, or null
- color: one of the three valid color values above
- health: one of the five valid health values above
- concern: a short string describing any issue, or null if none
- confidence: your confidence in this assessment, 0–1`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
          ],
        },
      ],
    });

    const raw = response.content[0]?.text ?? "";
    const parsed = JSON.parse(raw.trim());

    return {
      plantTag:     plantNames.includes(parsed.plantTag) ? parsed.plantTag : null,
      heightInches: typeof parsed.heightInches === "number" ? parsed.heightInches : null,
      color:        COLOR_VALUES.includes(parsed.color)   ? parsed.color   : "Green",
      health:       HEALTH_VALUES.includes(parsed.health) ? parsed.health  : "Good",
      concern:      typeof parsed.concern === "string" && parsed.concern ? parsed.concern : null,
      confidence:   typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  } catch (e) {
    console.error("[analyzeImage] failed for", file.name, e.message);
    return null;
  }
}

function groupByPlant(analyses) {
  const groups = {};
  for (const a of analyses) {
    const key = a.plantTag ?? "__unknown__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  return Object.entries(groups).map(([tag, items]) => ({
    plantTag:     tag === "__unknown__" ? null : tag,
    photoCount:   items.length,
    heightInches: median(items.map(i => i.heightInches).filter(h => h != null)),
    color:        mostCommon(items.map(i => i.color)),
    health:       mostCommon(items.map(i => i.health)),
    concerns:     [...new Set(items.map(i => i.concern).filter(Boolean))],
    confidence:   Math.round(avg(items.map(i => i.confidence)) * 100) / 100,
  }));
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files    = formData.getAll("images");

    console.log(`[/api/batch-analyze] received ${files.length} file(s):`, files.map(f => ({ name: f.name, size: f.size })));

    const plants     = await getPlants();
    const plantNames = plants.map(p => p.name);

    const results  = await Promise.all(files.map(f => analyzeImage(f, plantNames)));
    const analyses = results.filter(Boolean);
    const failed   = results.length - analyses.length;

    const grouped = groupByPlant(analyses);

    console.log(`[/api/batch-analyze] analyzed ${analyses.length}, failed ${failed}, plants:`, grouped.map(p => p.plantTag));

    return Response.json({ analyzed: analyses.length, failed, plants: grouped });
  } catch (e) {
    console.error("[/api/batch-analyze POST] ERROR:", e.code, e.status, e.message);
    return Response.json({ error: e.message, code: e.code, status: e.status }, { status: 500 });
  }
}
