import Anthropic from "@anthropic-ai/sdk";
import { getPlants } from "@/lib/grow-notion.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HEALTH_VALUES  = ["Excellent", "Good", "Fair", "Poor", "Critical"];
const COLOR_VALUES   = ["White Spots", "Dark Green", "Green", "Light Green", "Yellow", "Light Yellow", "Yellow Spots", "Brown"];
const CONCERN_VALUES = ["None", "Signs of pests", "Tag illegible", "Stretching tall", "Skinny stems", "Condensed structure", "Sparse foliage", "Leaf droop", "Leaf yellowing", "Leaf loss"];
const CTA_VALUES     = ["Defoliate", "Feed", "Clone", "Water", "Harvest", "Top", "Train", "Monitor", "Hold", "Repot"];

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

Valid plant tags — use exactly one or null if unidentifiable: ${plantNames.join(", ")}
Color — use exactly one: ${COLOR_VALUES.join(", ")}
Health — use exactly one: ${HEALTH_VALUES.join(", ")}
Concerns — use zero or more from this list (empty array if none): ${CONCERN_VALUES.filter(v => v !== "None").join(", ")}
CTA — suggest zero or more actions from this list: ${CTA_VALUES.join(", ")}

Reply with ONLY valid JSON, no markdown fences, no extra text:
{"plantTag":null,"heightInches":null,"color":"Green","health":"Good","concerns":[],"cta":[],"notes":null,"confidence":0.8}

Fields:
- plantTag: one valid tag or null
- heightInches: estimated plant height as a number, or null
- color: exactly one value from the Color list
- health: exactly one value from the Health list
- concerns: array of zero or more values from the Concerns list
- cta: array of zero or more values from the CTA list
- notes: one sentence of prose observations, or null
- confidence: your overall confidence 0–1`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
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

    const raw    = response.content[0]?.text ?? "";
    const parsed = JSON.parse(raw.trim());

    const concerns = Array.isArray(parsed.concerns)
      ? parsed.concerns.filter(c => CONCERN_VALUES.includes(c) && c !== "None")
      : [];
    const cta = Array.isArray(parsed.cta)
      ? parsed.cta.filter(c => CTA_VALUES.includes(c))
      : [];

    return {
      plantTag:     plantNames.includes(parsed.plantTag) ? parsed.plantTag : null,
      heightInches: typeof parsed.heightInches === "number" ? parsed.heightInches : null,
      color:        COLOR_VALUES.includes(parsed.color)    ? parsed.color    : "Green",
      health:       HEALTH_VALUES.includes(parsed.health)  ? parsed.health   : "Good",
      concerns,
      cta,
      notes:        typeof parsed.notes === "string" && parsed.notes ? parsed.notes : null,
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
    concerns:     [...new Set(items.flatMap(i => i.concerns))],
    cta:          [...new Set(items.flatMap(i => i.cta))],
    notes:        items.map(i => i.notes).filter(Boolean).join(" "),
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
