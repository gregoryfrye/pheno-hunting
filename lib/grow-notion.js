import { Client } from "@notionhq/client";

const notion = process.env.NOTION_SECRET
  ? new Client({ auth: process.env.NOTION_SECRET })
  : null;

const LOGS_DB    = process.env.NOTION_LOGS_DB_ID;
const PLANTS_DB  = process.env.NOTION_PLANTS_DB_ID;
const GROWS_DB   = process.env.NOTION_GROWS_DB_ID;
const STRAINS_DB = process.env.NOTION_STRAINS_DB_ID;

// ─── Property helpers ─────────────────────────────────────────────────────────

function title(prop) {
  return prop?.title?.[0]?.plain_text ?? "";
}
function text(prop) {
  return prop?.rich_text?.[0]?.plain_text ?? "";
}
function sel(prop) {
  return prop?.select?.name ?? "";
}
function multiSel(prop) {
  return prop?.multi_select?.map(s => s.name).join(", ") ?? "";
}
function num(prop) {
  return prop?.number ?? null;
}
function dateStr(prop) {
  return prop?.date?.start ?? "";
}
function relationId(prop) {
  return prop?.relation?.[0]?.id ?? null;
}

// ─── Grows ────────────────────────────────────────────────────────────────────

export async function getGrows() {
  if (!notion || !GROWS_DB) return [];
  const res = await notion.databases.query({ database_id: GROWS_DB });
  return res.results.map(p => ({
    notionId:    p.id,
    name:        title(p.properties["Name"]),
    status:      sel(p.properties["Status"]),
    startDate:   dateStr(p.properties["Start Date"]),
    endDate:     dateStr(p.properties["End Date"]),
    environment: sel(p.properties["Environment"]),
    location:    text(p.properties["Location"]),
    medium:      text(p.properties["Medium"]),
    container:   text(p.properties["Container"]),
    setup:       sel(p.properties["Setup"]),
    notes:       text(p.properties["Notes"]),
  }));
}

// ─── Plants ───────────────────────────────────────────────────────────────────

export async function getPlants() {
  if (!notion || !PLANTS_DB) return [];

  // Fetch all three DBs in parallel — avoids N+1 per plant
  const [plantsRes, strainsRes, growsRes] = await Promise.all([
    notion.databases.query({ database_id: PLANTS_DB }),
    STRAINS_DB
      ? notion.databases.query({ database_id: STRAINS_DB })
      : Promise.resolve({ results: [] }),
    notion.databases.query({ database_id: GROWS_DB }),
  ]);

  const strainsById = {};
  for (const s of strainsRes.results) {
    strainsById[s.id] = {
      name:     title(s.properties["Name"]),
      genetics: text(s.properties["Genetics"]),
      type:     sel(s.properties["Type"]),
      ratio:    text(s.properties["Ratio"]),
      category: sel(s.properties["Category"]),
    };
  }

  const growsById = {};
  for (const g of growsRes.results) {
    growsById[g.id] = title(g.properties["Name"]);
  }

  return plantsRes.results.map(p => {
    const strainRelId = relationId(p.properties["🧬 Strain"]);
    const growRelId   = relationId(p.properties["Grow"]);
    const plantName   = title(p.properties["Name"]);

    return {
      notionId: p.id,
      id:       plantName.toLowerCase(),
      name:     plantName,
      status:   sel(p.properties["Status"]),
      potSize:  sel(p.properties["Pot Size"]),
      color:    sel(p.properties["Color"]),
      emoji:    sel(p.properties["Emoji"]),
      sprouted: dateStr(p.properties["Sprouted"]),
      topped:   dateStr(p.properties["Topped"]),
      notes:    text(p.properties["Notes"]),
      strain:   strainRelId ? (strainsById[strainRelId] ?? null) : null,
      grow:     growRelId   ? (growsById[growRelId] ?? null)     : null,
    };
  });
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function getLogs() {
  if (!notion || !LOGS_DB) return [];

  const res = await notion.databases.query({
    database_id: LOGS_DB,
    sorts: [{ property: "Date", direction: "ascending" }],
  });

  // Collect unique plant page IDs from the relation
  const relationIds = new Set(
    res.results
      .map(p => relationId(p.properties["Plant"]))
      .filter(Boolean)
  );

  // Resolve plant page IDs → plant Name (the identifier, e.g. "M1")
  const plantNameById = {};
  if (relationIds.size > 0 && PLANTS_DB) {
    const plantsRes = await notion.databases.query({ database_id: PLANTS_DB });
    for (const plant of plantsRes.results) {
      const plantName = title(plant.properties["Name"]);
      plantNameById[plant.id] = plantName;
    }
  }

  return res.results.map(p => {
    const relId     = relationId(p.properties["Plant"]);
    const plantName = relId ? (plantNameById[relId] ?? "") : "";

    return {
      id:        p.id,
      plantId:   plantName.toLowerCase(),   // matches getPlants() id
      plantName,
      height:    num(p.properties["Height"])?.toString() ?? "",
      health:    sel(p.properties["Health"]),
      watering:  num(p.properties["Waters"])?.toString() ?? "",
      leafColor: sel(p.properties["Color"]),
      issues:    multiSel(p.properties["Concern"]),
      cta:       multiSel(p.properties["CTA"]),
      notes:     text(p.properties["Notes"]),
      savedAt:   dateStr(p.properties["Date"]) || p.created_time,
    };
  });
}

// ─── Plant page ID cache (populated once per process, reused for batch writes) ─

let plantPageIdCache = null;

async function resolvePlantPageId(plantName) {
  if (!plantPageIdCache) {
    const res = await notion.databases.query({ database_id: PLANTS_DB });
    plantPageIdCache = {};
    for (const p of res.results) {
      const name = title(p.properties["Name"]);
      plantPageIdCache[name] = p.id;
    }
  }
  return plantPageIdCache[plantName] ?? null;
}

// ─── Save Log ─────────────────────────────────────────────────────────────────

export async function saveLog(data) {
  if (!notion || !LOGS_DB) return null;

  const date = data.savedAt
    ? data.savedAt.split("T")[0]
    : new Date().toISOString().split("T")[0];

  const logTitle = `${data.plantName || "Plant"} — ${new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const plantPageId = data.plantName
    ? await resolvePlantPageId(data.plantName)
    : null;

  const page = await notion.pages.create({
    parent: { database_id: LOGS_DB },
    properties: {
      Name:  { title: [{ text: { content: logTitle } }] },
      Date:  { date: { start: date } },
      ...(plantPageId  ? { Plant:   { relation: [{ id: plantPageId }] } }              : {}),
      ...(data.height    ? { Height: { number: parseFloat(data.height) } }             : {}),
      ...(data.health    ? { Health: { select: { name: data.health } } }               : {}),
      ...(data.watering  ? { Waters: { number: parseFloat(data.watering) } }           : {}),
      ...(data.leafColor ? { Color:  { select: { name: data.leafColor } } }            : {}),
      ...(data.issues    ? { Concern: { multi_select: data.issues.split(",").map(s => s.trim()).filter(Boolean).map(s => ({ name: s })) } } : {}),
      ...(data.notes     ? { Notes:  { rich_text: [{ text: { content: data.notes } }] } } : {}),
    },
  });

  return { ...data, id: page.id };
}

/*
// ─── FALLBACK: hardcoded grows (remove once Notion fetch confirmed) ────────────
const GROWS = {
  "winter-2025": {
    name: "Winter 2025",
    plants: {
      ts1: { id: "ts1", name: "TS1", strain: "Tropicana Sherbet", type: "Hybrid", genetics: "...", emoji: "🍊", color: "#FF8C00" },
      ps1: { id: "ps1", name: "PS1", strain: "Purple Sherbet",    type: "Hybrid", genetics: "...", emoji: "🍇", color: "#800080" },
      m1:  { id: "m1",  name: "M1",  strain: "Marrakesh",         type: "Sativa", genetics: "...", emoji: "🌿", color: "#228B22" },
    },
  },
};
*/
