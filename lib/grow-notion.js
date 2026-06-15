import { Client } from "@notionhq/client";

const notion = process.env.NOTION_SECRET
  ? new Client({ auth: process.env.NOTION_SECRET })
  : null;

const LOGS_DB = process.env.NOTION_LOGS_DB_ID;
const PLANTS_DB = process.env.NOTION_PLANTS_DB_ID;
const GROWS_DB = process.env.NOTION_GROWS_DB_ID;

function text(prop) {
  return prop?.rich_text?.[0]?.plain_text ?? prop?.title?.[0]?.plain_text ?? "";
}
function select(prop) {
  return prop?.select?.name ?? "";
}
function num(prop) {
  return prop?.number ?? null;
}
function dateStr(prop) {
  return prop?.date?.start ?? "";
}

// ─── Grows ────────────────────────────────────────────────────────────────────

export async function getGrows() {
  if (!notion || !GROWS_DB) return [];
  const res = await notion.databases.query({ database_id: GROWS_DB });
  return res.results.map(p => ({
    notionId: p.id,
    name: text(p.properties["Name"]),
    slug: text(p.properties["Slug"]),
    status: select(p.properties["Status"]),
    medium: text(p.properties["Medium"]),
    location: text(p.properties["Location"]),
  }));
}

// ─── Plants ───────────────────────────────────────────────────────────────────

export async function getPlants(growSlug) {
  if (!notion || !PLANTS_DB) return [];
  const filter = growSlug
    ? { property: "Grow Slug", rich_text: { equals: growSlug } }
    : undefined;
  const res = await notion.databases.query({
    database_id: PLANTS_DB,
    ...(filter ? { filter } : {}),
  });
  return res.results.map(p => ({
    notionId: p.id,
    id: text(p.properties["Slug"]),
    name: text(p.properties["Name"]),
    strain: text(p.properties["Strain"]),
    type: select(p.properties["Type"]),
    genetics: text(p.properties["Genetics"]),
    breeder: text(p.properties["Breeder"]),
    pot: text(p.properties["Pot"]),
    growSlug: text(p.properties["Grow Slug"]),
    status: select(p.properties["Status"]),
    emoji: text(p.properties["Emoji"]),
    color: text(p.properties["Color"]),
  }));
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function getLogs({ plantId, growId } = {}) {
  if (!notion || !LOGS_DB) return [];
  const filters = [];
  if (plantId) filters.push({ property: "Plant ID", rich_text: { equals: plantId } });
  if (growId) filters.push({ property: "Grow ID", rich_text: { equals: growId } });

  const res = await notion.databases.query({
    database_id: LOGS_DB,
    ...(filters.length === 1
      ? { filter: filters[0] }
      : filters.length > 1
      ? { filter: { and: filters } }
      : {}),
    sorts: [{ property: "Date", direction: "ascending" }],
  });

  return res.results.map(p => ({
    id: p.id,
    plantId: text(p.properties["Plant ID"]),
    plantName: text(p.properties["Plant Name"]),
    growId: text(p.properties["Grow ID"]),
    height: num(p.properties["Height"])?.toString() ?? "",
    health: select(p.properties["Health"]),
    watering: num(p.properties["Watering"])?.toString() ?? "",
    leafColor: text(p.properties["Leaf Color"]),
    issues: text(p.properties["Issues"]),
    notes: text(p.properties["Notes"]),
    savedAt: dateStr(p.properties["Date"]) || p.created_time,
  }));
}

export async function saveLog(data) {
  if (!notion || !LOGS_DB) return null;

  const date = data.savedAt
    ? data.savedAt.split("T")[0]
    : new Date().toISOString().split("T")[0];

  const title = `${data.plantName || "Plant"} — ${new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const page = await notion.pages.create({
    parent: { database_id: LOGS_DB },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      "Plant ID": { rich_text: [{ text: { content: data.plantId ?? "" } }] },
      "Plant Name": { rich_text: [{ text: { content: data.plantName ?? "" } }] },
      "Grow ID": { rich_text: [{ text: { content: data.growId ?? "" } }] },
      Date: { date: { start: date } },
      ...(data.height ? { Height: { number: parseFloat(data.height) } } : {}),
      ...(data.health ? { Health: { select: { name: data.health } } } : {}),
      ...(data.watering ? { Watering: { number: parseFloat(data.watering) } } : {}),
      ...(data.leafColor ? { "Leaf Color": { rich_text: [{ text: { content: data.leafColor } }] } } : {}),
      ...(data.issues ? { Issues: { rich_text: [{ text: { content: data.issues } }] } } : {}),
      ...(data.notes ? { Notes: { rich_text: [{ text: { content: data.notes } }] } } : {}),
    },
  });

  return { ...data, id: page.id };
}
