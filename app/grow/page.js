"use client";

import { useState, useEffect, useRef } from "react";

// ─── Phenophase timeline + weekly context (not in Notion) ────────────────────
const SEASON_DATA = {
  "Summer 2026": {
    accentColor: "#5BAD72",
    season: [
      { month: "May",       phase: "Repotting",  done: true  },
      { month: "June",      phase: "Vegging",    done: false, current: true },
      { month: "July",      phase: "Pruning",    done: false },
      { month: "August",    phase: "Flowering",  done: false },
      { month: "September", phase: "Ripening",   done: false },
      { month: "October",   phase: "Harvesting", done: false },
    ],
    weeklyContext: {
      phase: "Vegging",
      focus: [
        "Establish watering rhythm — fabric pots on a deck dry fast",
        "Watch for nitrogen deficiency as Stonington Blend nutrients deplete",
        "Begin LST (low stress training) if plants are vigorous",
        "Note height and node spacing per plant",
      ],
      tip: "Stonington Blend is nutrient-rich — hold off on feeding until you see signs of deficiency or plants slow down.",
    },
  },
  "Winter 2026": {
    accentColor: "#7A9CC4",
    season: [
      { month: "Oct", phase: "Planning",    done: false, current: true },
      { month: "Nov", phase: "Germination", done: false },
      { month: "Dec", phase: "Seedling",    done: false },
      { month: "Jan", phase: "Veg",         done: false },
      { month: "Feb", phase: "Flower",      done: false },
      { month: "Mar", phase: "Harvest",     done: false },
    ],
  },
};

const WINTER_CHECKLIST_INIT = [
  { id: "lights",      label: "Acquire grow lights",         done: false },
  { id: "tent",        label: "Set up grow tent / space",    done: false },
  { id: "medium",      label: "Choose growing medium",       done: false },
  { id: "pots",        label: "Select pot size",             done: false },
  { id: "ventilation", label: "Ventilation & humidity plan", done: false },
  { id: "timer",       label: "Light timer (18/6 schedule)", done: false },
];

/*
// ─── FALLBACK: hardcoded grows — remove once Notion fetch confirmed working ────
const GROWS = {
  summer2026: {
    id: "summer2026",
    label: "Summer 2026",
    sublabel: "Outdoor Deck — Kingston NY",
    status: "active",
    medium: "Stonington Blend / 7-gal Fabric",
    accentColor: "#5BAD72",
    plants: [
      { id: "m1",  name: "Marrakesh #1",    strain: "Marrakesh",   type: "Indica-Leaning Hybrid",    genetics: "Moroccan Peaches × Canal Street Runtz", breeder: "Purple City Genetics", pot: "7gal", emoji: "🟠", color: "#E8874A" },
      { id: "m2",  name: "Marrakesh #2",    strain: "Marrakesh",   type: "Indica-Leaning Hybrid",    genetics: "Moroccan Peaches × Canal Street Runtz", breeder: "Purple City Genetics", pot: "7gal", emoji: "🟠", color: "#E8874A" },
      { id: "m3",  name: "Marrakesh #3",    strain: "Marrakesh",   type: "Indica-Leaning Hybrid",    genetics: "Moroccan Peaches × Canal Street Runtz", breeder: "Purple City Genetics", pot: "7gal", emoji: "🟠", color: "#E8874A" },
      { id: "ps1", name: "Papa Smurf #1",   strain: "Papa Smurf",  type: "Sativa-Dominant Hybrid",   genetics: "Blue Dream × Cotton Candy",             breeder: "Atlas Seeds",          pot: "7gal", emoji: "🟢", color: "#5BAD72" },
      { id: "ps2", name: "Papa Smurf #2",   strain: "Papa Smurf",  type: "Sativa-Dominant Hybrid",   genetics: "Blue Dream × Cotton Candy",             breeder: "Atlas Seeds",          pot: "7gal", emoji: "🟢", color: "#5BAD72" },
      { id: "ts1", name: "Thai Star",        strain: "Thai Star",   type: "THCV Sativa-Dominant",     genetics: "Thai × Caprichosa Thai",                breeder: "Seedsman",             pot: "7gal", emoji: "🔵", color: "#4A8FD4" },
    ],
    season: [
      { month: "May", phase: "Repotting", done: true }, { month: "June", phase: "Vegging", done: false, current: true },
      { month: "July", phase: "Pruning", done: false }, { month: "August", phase: "Flowering", done: false },
      { month: "September", phase: "Ripening", done: false }, { month: "October", phase: "Harvesting", done: false },
    ],
    weeklyContext: {
      phase: "Vegging",
      focus: [
        "Establish watering rhythm — fabric pots on a deck dry fast",
        "Watch for nitrogen deficiency as Stonington Blend nutrients deplete",
        "Begin LST (low stress training) if plants are vigorous",
        "Note height and node spacing per plant",
      ],
      tip: "Stonington Blend is nutrient-rich — hold off on feeding until you see signs of deficiency or plants slow down.",
    },
  },
  winter2026: {
    id: "winter2026",
    label: "Winter 2026",
    sublabel: "Indoor — Planning Stage",
    status: "planning",
    medium: "TBD",
    accentColor: "#7A9CC4",
    plants: [
      { id: "rls1", name: "Razberry Lime Soda #1", strain: "Razberry Lime Soda", type: "Autoflower", genetics: "TBD", breeder: "Purple City Genetics", pot: "TBD", emoji: "🫐", color: "#A07AD4", status: "seed" },
      { id: "rls2", name: "Razberry Lime Soda #2", strain: "Razberry Lime Soda", type: "Autoflower", genetics: "TBD", breeder: "Purple City Genetics", pot: "TBD", emoji: "🫐", color: "#A07AD4", status: "seed" },
      { id: "rls3", name: "Razberry Lime Soda #3", strain: "Razberry Lime Soda", type: "Autoflower", genetics: "TBD", breeder: "Purple City Genetics", pot: "TBD", emoji: "🫐", color: "#A07AD4", status: "seed" },
    ],
    checklist: [
      { id: "lights", label: "Acquire grow lights", done: false },
      { id: "tent", label: "Set up grow tent / space", done: false },
      { id: "medium", label: "Choose growing medium", done: false },
      { id: "pots", label: "Select pot size", done: false },
      { id: "ventilation", label: "Ventilation & humidity plan", done: false },
      { id: "timer", label: "Light timer (18/6 schedule)", done: false },
    ],
    season: [
      { month: "Oct", phase: "Planning", done: false, current: true }, { month: "Nov", phase: "Germination", done: false },
      { month: "Dec", phase: "Seedling", done: false }, { month: "Jan", phase: "Veg", done: false },
      { month: "Feb", phase: "Flower", done: false }, { month: "Mar", phase: "Harvest", done: false },
    ],
    notes: "",
  },
};
*/

const HEALTH_OPTIONS = ["Excellent", "Good", "Fair", "Concern"];
const HEALTH_COLORS = { Excellent: "#5BAD72", Good: "#A8C56A", Fair: "#E8C14A", Concern: "#E8614A" };

function CheckInForm({ plant, grow, onSave, onClose }) {
  const [form, setForm] = useState({ height: "", watering: "", health: "Good", leafColor: "", issues: "", notes: "" });
  const [aiAdvice, setAiAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const getAiAdvice = async () => {
    if (!form.height && !form.notes && !form.issues) return;
    setLoading(true);
    try {
      const prompt = `You are a knowledgeable cannabis cultivation advisor. A grower is doing a weekly check-in on their outdoor plant in Kingston, NY. It's currently June (vegging phase). The plant is in a 7-gallon fabric pot on a deck, using Stonington Blend Coast of Maine soil.

Plant: ${plant.name} — ${plant.type} (${plant.genetics})
Height: ${form.height || "not recorded"}
Health rating: ${form.health}
Leaf color: ${form.leafColor || "not noted"}
Issues observed: ${form.issues || "none noted"}
Grower notes: ${form.notes || "none"}

Give 2-3 specific, actionable observations or recommendations for this plant right now. Be direct and practical. Keep it under 100 words.`;

      const response = await fetch("/api/grow-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setAiAdvice(data.text || "");
    } catch { setAiAdvice("Couldn't load advice right now."); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,10,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div style={{ background: "#111712", border: `1px solid ${plant.color}40`, borderRadius: "12px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "1.1rem", fontFamily: "'Courier New', monospace", color: plant.color, fontWeight: "700", letterSpacing: "0.05em" }}>{plant.emoji} {plant.name}</div>
            <div style={{ fontSize: "0.7rem", color: "#667", fontFamily: "'Courier New', monospace", marginTop: "2px" }}>{plant.type}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#556", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        {[
          { label: "HEIGHT (inches)", key: "height", placeholder: "e.g. 14" },
          { label: "WATERINGS SINCE LAST CHECK", key: "watering", placeholder: "e.g. 3" },
          { label: "LEAF COLOR", key: "leafColor", placeholder: "e.g. Deep green, slight yellowing lower" },
          { label: "ISSUES OBSERVED", key: "issues", placeholder: "e.g. None / spider mite on lower fan leaf" },
          { label: "NOTES", key: "notes", placeholder: "Anything else worth capturing..." },
        ].map(field => (
          <div key={field.key} style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "#667", fontFamily: "'Courier New', monospace", marginBottom: "4px" }}>{field.label}</div>
            {field.key === "notes" || field.key === "issues" ? (
              <textarea value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={2}
                style={{ width: "100%", background: "#0D100D", border: "1px solid #2a3a2a", borderRadius: "6px", color: "#c8d8c4", fontFamily: "'Courier New', monospace", fontSize: "0.8rem", padding: "8px", resize: "none", boxSizing: "border-box" }} />
            ) : (
              <input value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder}
                style={{ width: "100%", background: "#0D100D", border: "1px solid #2a3a2a", borderRadius: "6px", color: "#c8d8c4", fontFamily: "'Courier New', monospace", fontSize: "0.8rem", padding: "8px", boxSizing: "border-box" }} />
            )}
          </div>
        ))}

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "#667", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>OVERALL HEALTH</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {HEALTH_OPTIONS.map(h => (
              <button key={h} onClick={() => setForm(f => ({ ...f, health: h }))}
                style={{ flex: 1, padding: "6px 4px", borderRadius: "6px", border: `1px solid ${form.health === h ? HEALTH_COLORS[h] : "#2a3a2a"}`, background: form.health === h ? `${HEALTH_COLORS[h]}20` : "transparent", color: form.health === h ? HEALTH_COLORS[h] : "#556", fontSize: "0.65rem", fontFamily: "'Courier New', monospace", cursor: "pointer", letterSpacing: "0.05em" }}>
                {h}
              </button>
            ))}
          </div>
        </div>

        <button onClick={getAiAdvice} disabled={loading}
          style={{ width: "100%", padding: "10px", background: `${plant.color}15`, border: `1px solid ${plant.color}50`, borderRadius: "6px", color: plant.color, fontFamily: "'Courier New', monospace", fontSize: "0.72rem", letterSpacing: "0.08em", cursor: "pointer", marginBottom: "1rem" }}>
          {loading ? "CONSULTING..." : "→ GET GROW ADVICE"}
        </button>

        {aiAdvice && (
          <div style={{ background: "#0D100D", border: "1px solid #2a3a2a", borderRadius: "6px", padding: "12px", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.1em", color: "#667", fontFamily: "'Courier New', monospace", marginBottom: "6px" }}>ADVISOR NOTES</div>
            <div style={{ fontSize: "0.78rem", color: "#a8c4a0", fontFamily: "'Courier New', monospace", lineHeight: "1.6" }}>{aiAdvice}</div>
          </div>
        )}

        <button onClick={() => onSave({ ...form, plantId: plant.id, plantName: plant.name, growId: grow.notionId, savedAt: new Date().toISOString() })}
          style={{ width: "100%", padding: "12px", background: plant.color, border: "none", borderRadius: "6px", color: "#0D100D", fontFamily: "'Courier New', monospace", fontSize: "0.8rem", fontWeight: "700", letterSpacing: "0.1em", cursor: "pointer" }}>
          SAVE CHECK-IN
        </button>
      </div>
    </div>
  );
}

function SeedCard({ plant }) {
  return (
    <div style={{ background: "#0D0D12", border: "1px solid #2a2a3a", borderRadius: "10px", padding: "1rem", position: "relative", overflow: "hidden", opacity: 0.85 }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: plant.color, borderRadius: "3px 0 0 3px", opacity: 0.5 }} />
      <div style={{ paddingLeft: "8px" }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.85rem", color: "#b4b4d0", fontWeight: "700", letterSpacing: "0.04em" }}>{plant.emoji} {plant.name}</div>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.62rem", color: "#445", marginTop: "2px", letterSpacing: "0.06em" }}>{plant.type}</div>
        <div style={{ marginTop: "8px", display: "inline-block", padding: "3px 8px", background: "#1a1a2a", border: "1px solid #3a3a5a", borderRadius: "4px" }}>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.58rem", color: "#7A9CC4", letterSpacing: "0.1em" }}>SEED — NOT GERMINATED</span>
        </div>
        <div style={{ marginTop: "6px", fontFamily: "'Courier New', monospace", fontSize: "0.62rem", color: "#445" }}>{plant.breeder}</div>
      </div>
    </div>
  );
}

function PlantCard({ plant, logs, onCheckIn }) {
  const plantLogs = logs.filter(l => l.plantId.toLowerCase() === plant.id.toLowerCase());
  const latest = plantLogs[plantLogs.length - 1];
  const daysSince = latest ? Math.floor((Date.now() - new Date(latest.savedAt)) / 86400000) : null;

  return (
    <div style={{ background: "#0D100D", border: `1px solid ${daysSince === null || daysSince > 6 ? "#E8614A30" : "#1a2a1a"}`, borderRadius: "10px", padding: "1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: plant.color, borderRadius: "3px 0 0 3px" }} />
      <div style={{ paddingLeft: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.85rem", color: "#d4e8d0", fontWeight: "700", letterSpacing: "0.04em" }}>{plant.emoji} {plant.name}</div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.62rem", color: "#556", marginTop: "2px", letterSpacing: "0.06em" }}>{plant.type}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {latest ? (
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.62rem", color: daysSince > 6 ? "#E8614A" : "#5BAD72" }}>
                {daysSince === 0 ? "today" : `${daysSince}d ago`}
              </div>
            ) : (
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.62rem", color: "#E8614A" }}>no logs</div>
            )}
          </div>
        </div>

        {latest && (
          <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {[
              { label: "HEIGHT", value: latest.height ? `${latest.height}"` : "—" },
              { label: "HEALTH", value: latest.health || "—", color: HEALTH_COLORS[latest.health] },
            ].map(stat => (
              <div key={stat.label} style={{ background: "#111712", borderRadius: "5px", padding: "6px 8px" }}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.55rem", color: "#445", letterSpacing: "0.08em" }}>{stat.label}</div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.78rem", color: stat.color || "#a8c4a0", marginTop: "2px" }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {latest?.notes && (
          <div style={{ marginTop: "8px", fontFamily: "'Courier New', monospace", fontSize: "0.68rem", color: "#556", lineHeight: "1.5", borderLeft: "1px solid #1a2a1a", paddingLeft: "8px" }}>
            {latest.notes.length > 80 ? latest.notes.slice(0, 80) + "…" : latest.notes}
          </div>
        )}

        <button onClick={() => onCheckIn(plant)}
          style={{ marginTop: "12px", width: "100%", padding: "8px", background: `${plant.color}12`, border: `1px solid ${plant.color}35`, borderRadius: "5px", color: plant.color, fontFamily: "'Courier New', monospace", fontSize: "0.65rem", letterSpacing: "0.08em", cursor: "pointer" }}>
          + CHECK IN
        </button>
      </div>
    </div>
  );
}

function WinterPlanning({ grow, plants, checklist, onToggle, notes, onNotesChange }) {
  const done = checklist.filter(i => i.done).length;
  const pct = Math.round((done / checklist.length) * 100);

  return (
    <div>
      <WinterAdvisor />

      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "#7A9CC4", marginBottom: "8px" }}>SEEDS IN HAND</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {plants.map(p => <SeedCard key={p.id} plant={p} />)}
        </div>
      </div>

      <div style={{ background: "#0D0D12", border: "1px solid #1a1a2a", borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "#7A9CC4" }}>SETUP CHECKLIST</div>
          <div style={{ fontSize: "0.6rem", color: pct === 100 ? "#5BAD72" : "#445", fontFamily: "'Courier New', monospace" }}>{done}/{checklist.length} DONE</div>
        </div>
        <div style={{ height: "2px", background: "#1a1a2a", borderRadius: "2px", marginBottom: "12px" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#7A9CC4", borderRadius: "2px", transition: "width 0.3s" }} />
        </div>
        {checklist.map(item => (
          <div key={item.id} onClick={() => onToggle(item.id)}
            style={{ display: "flex", gap: "10px", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #111120", cursor: "pointer" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "3px", border: `1px solid ${item.done ? "#7A9CC4" : "#2a2a3a"}`, background: item.done ? "#7A9CC420" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.done && <span style={{ color: "#7A9CC4", fontSize: "0.6rem" }}>✓</span>}
            </div>
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: "0.72rem", color: item.done ? "#445" : "#a0a8c0", textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "#0D0D12", border: "1px solid #1a1a2a", borderRadius: "8px", padding: "1rem" }}>
        <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "#7A9CC4", marginBottom: "8px" }}>PLANNING NOTES</div>
        <textarea value={notes} onChange={e => onNotesChange(e.target.value)} placeholder="Space dimensions, equipment ideas, questions to research..."
          rows={4} style={{ width: "100%", background: "#080810", border: "1px solid #1a1a2a", borderRadius: "6px", color: "#a0a8c0", fontFamily: "'Courier New', monospace", fontSize: "0.75rem", padding: "8px", resize: "none", boxSizing: "border-box", lineHeight: "1.6" }} />
      </div>
    </div>
  );
}

function WinterAdvisor() {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState(false);

  const getAdvice = async () => {
    setLoading(true);
    setAsked(true);
    try {
      const response = await fetch("/api/grow-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are a cannabis cultivation advisor. A first-time indoor grower in Kingston, NY is planning a winter 2026 autoflower grow with 3x Razberry Lime Soda seeds from Purple City Genetics. They have the seeds but haven't bought any equipment yet. Give them a practical, prioritized setup checklist covering: lights (type and wattage recommendation for 3 autos), grow space/tent size, ventilation basics, and medium suggestion. Be specific with product categories or specs, not brand names. Keep it under 150 words, use a direct tone.`,
        }),
      });
      const data = await response.json();
      setAdvice(data.text || "");
    } catch { setAdvice("Couldn't load advice right now."); }
    setLoading(false);
  };

  return (
    <div style={{ background: "#0D0D12", border: "1px solid #2a2a4a", borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "#7A9CC4", marginBottom: "6px" }}>SETUP ADVISOR</div>
      {!asked ? (
        <>
          <div style={{ fontSize: "0.72rem", color: "#556", fontFamily: "'Courier New', monospace", lineHeight: "1.5", marginBottom: "10px" }}>
            Get a tailored equipment checklist for 3 autoflowers indoors.
          </div>
          <button onClick={getAdvice}
            style={{ width: "100%", padding: "9px", background: "#7A9CC415", border: "1px solid #7A9CC450", borderRadius: "6px", color: "#7A9CC4", fontFamily: "'Courier New', monospace", fontSize: "0.68rem", letterSpacing: "0.08em", cursor: "pointer" }}>
            → WHAT DO I NEED TO GET STARTED?
          </button>
        </>
      ) : loading ? (
        <div style={{ fontSize: "0.72rem", color: "#445", fontFamily: "'Courier New', monospace", padding: "8px 0" }}>Consulting...</div>
      ) : (
        <div style={{ fontSize: "0.75rem", color: "#a0b8d0", fontFamily: "'Courier New', monospace", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{advice}</div>
      )}
    </div>
  );
}

async function compressImage(file) {
  let sourceBlob = file;

  const isHeic =
    file.type === "image/heic" || file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");

  if (isHeic) {
    try {
      const heic2any = (await import("heic2any")).default;
      const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      sourceBlob = Array.isArray(result) ? result[0] : result;
    } catch {
      return { blob: file, compressed: false };
    }
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(sourceBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve({ blob: blob ?? file, compressed: !!blob }),
        "image/jpeg",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob: file, compressed: false });
    };

    img.src = url;
  });
}

function BatchUploadPanel({ accentColor, onClose }) {
  const inputRef = useRef(null);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFileChange = async (e) => {
    const selected = Array.from(e.target.files).slice(0, 12);
    setResult(null);
    setError(null);
    setCompressing(true);
    const results = await Promise.all(selected.map(f => compressImage(f)));
    setProcessedFiles(results.map((r, i) => ({
      name: selected[i].name,
      originalSize: selected[i].size,
      compressedSize: r.blob.size,
      blob: r.blob,
      compressed: r.compressed,
    })));
    setCompressing(false);
  };

  const analyze = async () => {
    if (!processedFiles.length) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      processedFiles.forEach(f => fd.append("images", f.blob, f.name));
      const res = await fetch("/api/batch-analyze", { method: "POST", body: fd });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setError(e.message || "Upload failed");
    }
    setLoading(false);
  };

  const hasFiles = processedFiles.length > 0;
  const isReady = hasFiles && !compressing;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,12,10,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div style={{ background: "#111712", border: `1px solid ${accentColor}40`, borderRadius: "12px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "'Courier New', monospace", color: accentColor, fontWeight: "700", letterSpacing: "0.1em" }}>↑ BATCH CHECK-IN</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#556", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
        </div>

        <div style={{ fontSize: "0.65rem", color: "#556", fontFamily: "'Courier New', monospace", marginBottom: "1rem", lineHeight: "1.6" }}>
          Select 1–12 plant photos. Images are compressed in-browser before upload.
        </div>

        <input ref={inputRef} type="file" accept="image/*" multiple onChange={onFileChange} style={{ display: "none" }} />

        <button onClick={() => inputRef.current?.click()} disabled={compressing}
          style={{ width: "100%", padding: "10px", background: "#0D100D", border: `1px solid ${accentColor}50`, borderRadius: "6px", color: accentColor, fontFamily: "'Courier New', monospace", fontSize: "0.7rem", letterSpacing: "0.1em", cursor: compressing ? "default" : "pointer", marginBottom: "1rem", opacity: compressing ? 0.6 : 1 }}>
          {compressing ? "COMPRESSING..." : `SELECT PHOTOS${hasFiles ? ` (${processedFiles.length} SELECTED)` : ""}`}
        </button>

        {compressing && (
          <div style={{ fontSize: "0.65rem", color: "#445", fontFamily: "'Courier New', monospace", textAlign: "center", padding: "8px 0 1rem" }}>
            Resizing and encoding...
          </div>
        )}

        {!compressing && hasFiles && (
          <div style={{ background: "#0D100D", border: "1px solid #1a2a1a", borderRadius: "6px", padding: "10px", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.6rem", color: "#445", fontFamily: "'Courier New', monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>
              {processedFiles.length} FILE{processedFiles.length !== 1 ? "S" : ""} READY
            </div>
            {processedFiles.map((f, i) => (
              <div key={i} style={{ padding: "5px 0", borderBottom: i < processedFiles.length - 1 ? "1px solid #1a2a1a" : "none" }}>
                <div style={{ fontSize: "0.68rem", color: "#a8c4a0", fontFamily: "'Courier New', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  {f.compressed ? (
                    <>
                      <span style={{ fontSize: "0.58rem", color: "#445", fontFamily: "'Courier New', monospace" }}>{(f.originalSize / 1024).toFixed(0)} KB</span>
                      <span style={{ fontSize: "0.58rem", color: "#334" }}>→</span>
                      <span style={{ fontSize: "0.58rem", color: "#5BAD72", fontFamily: "'Courier New', monospace" }}>{(f.compressedSize / 1024).toFixed(0)} KB</span>
                      <span style={{ fontSize: "0.55rem", color: "#445", fontFamily: "'Courier New', monospace" }}>
                        ({Math.round((1 - f.compressedSize / f.originalSize) * 100)}% smaller)
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "0.58rem", color: "#445", fontFamily: "'Courier New', monospace" }}>{(f.originalSize / 1024).toFixed(0)} KB</span>
                      <span style={{ fontSize: "0.58rem", color: "#E8874A", fontFamily: "'Courier New', monospace" }}>[ORIG — not compressed]</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={analyze} disabled={!isReady || loading}
          style={{ width: "100%", padding: "12px", background: isReady ? accentColor : "#1a2a1a", border: "none", borderRadius: "6px", color: isReady ? "#0D100D" : "#334", fontFamily: "'Courier New', monospace", fontSize: "0.78rem", fontWeight: "700", letterSpacing: "0.1em", cursor: isReady ? "pointer" : "default", marginBottom: "1rem", opacity: loading ? 0.7 : 1 }}>
          {loading ? "SENDING..." : "→ ANALYZE"}
        </button>

        {error && (
          <div style={{ background: "#1a0D0D", border: "1px solid #E8614A40", borderRadius: "6px", padding: "10px", fontSize: "0.68rem", color: "#E8614A", fontFamily: "'Courier New', monospace" }}>
            ERROR: {error}
          </div>
        )}

        {result && (
          <div style={{ background: "#0D100D", border: `1px solid ${accentColor}30`, borderRadius: "6px", padding: "12px" }}>
            <div style={{ fontSize: "0.6rem", color: "#445", fontFamily: "'Courier New', monospace", letterSpacing: "0.1em", marginBottom: "8px" }}>SERVER RESPONSE</div>
            <div style={{ fontSize: "0.8rem", color: accentColor, fontFamily: "'Courier New', monospace", fontWeight: "700", marginBottom: "8px" }}>
              RECEIVED: {result.received} FILE{result.received !== 1 ? "S" : ""}
            </div>
            {result.files?.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <div style={{ fontSize: "0.65rem", color: "#8aaa86", fontFamily: "'Courier New', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{f.name}</div>
                <div style={{ fontSize: "0.6rem", color: "#445", fontFamily: "'Courier New', monospace", flexShrink: 0 }}>{(f.size / 1024).toFixed(0)} KB</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GrowTracker() {
  const [grows, setGrows] = useState([]);
  const [plants, setPlants] = useState([]);
  const [activeGrowId, setActiveGrowId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [checkingIn, setCheckingIn] = useState(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [view, setView] = useState("plants");
  const [winterChecklist, setWinterChecklist] = useState(WINTER_CHECKLIST_INIT);
  const [winterNotes, setWinterNotes] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/grows")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        setGrows(data);
        // Default to first active grow, else first in list
        const active = data.find(g => g.status?.toLowerCase() === "active") ?? data[0];
        setActiveGrowId(active.notionId);
      })
      .catch(() => {});

    fetch("/api/plants")
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        // Normalize: add derived type/genetics so PlantCard/SeedCard/CheckInForm need no changes
        setPlants(data.map(p => ({
          ...p,
          type:     p.strain?.category || p.strain?.type || "",
          genetics: p.strain?.genetics || "",
          color:    p.color || "#667",
        })));
      })
      .catch(() => {});

    fetch("/api/logs")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setLogs(data); })
      .catch(() => {});
  }, []);

  // Merge Notion grow data with hardcoded season/context
  const rawGrow = grows.find(g => g.notionId === activeGrowId) ?? null;
  const seasonData = rawGrow ? (SEASON_DATA[rawGrow.name] ?? {}) : {};
  const grow = rawGrow ? {
    ...rawGrow,
    accentColor:   seasonData.accentColor ?? "#5BAD72",
    season:        seasonData.season ?? [],
    weeklyContext: seasonData.weeklyContext ?? null,
  } : null;

  const isPlanning = grow?.status?.toLowerCase() === "planning";
  const growPlants = grow ? plants.filter(p => p.grow === grow.name) : [];
  const growPlantIds = new Set(growPlants.map(p => p.id));
  const growLogs = logs.filter(l => growPlantIds.has(l.plantId));

  const handleSave = async (entry) => {
    setLogs(prev => [...prev, entry]);
    setCheckingIn(null);
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch { /* Notion sync optional — log kept in memory */ }
  };

  const toggleChecklist = (id) => setWinterChecklist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));

  const switchGrow = (id) => { setActiveGrowId(id); setDropdownOpen(false); setView("plants"); };

  if (!grow) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0C0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.7rem", color: "#334", letterSpacing: "0.1em" }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0C0A", color: "#c8d8c4", fontFamily: "'Courier New', monospace" }}>
      <div style={{ borderBottom: `1px solid ${isPlanning ? "#1a1a2a" : "#1a2a1a"}`, padding: "1.25rem 1rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", color: "#334", marginBottom: "3px" }}>GROW TRACKER</div>

            <div style={{ position: "relative", display: "inline-block" }}>
              <button onClick={() => setDropdownOpen(o => !o)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#d4e8d0", letterSpacing: "0.02em" }}>{grow.name}</div>
                  <div style={{ fontSize: "0.7rem", color: grow.accentColor, marginTop: "2px" }}>▾</div>
                </div>
                <div style={{ fontSize: "0.62rem", color: grow.accentColor, letterSpacing: "0.08em", marginTop: "1px" }}>
                  {isPlanning ? "● PLANNING" : "● ACTIVE"}{grow.location ? ` — ${grow.location.toUpperCase()}` : ""}
                </div>
              </button>

              {dropdownOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: "6px", background: "#111712", border: "1px solid #2a3a2a", borderRadius: "8px", overflow: "hidden", zIndex: 50, minWidth: "200px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                  {grows.map(g => {
                    const gAccent = SEASON_DATA[g.name]?.accentColor ?? "#5BAD72";
                    const gPlantCount = plants.filter(p => p.grow === g.name).length;
                    return (
                      <button key={g.notionId} onClick={() => switchGrow(g.notionId)}
                        style={{ display: "block", width: "100%", padding: "10px 14px", background: g.notionId === activeGrowId ? "#1a2a1a" : "transparent", border: "none", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #1a2a1a" }}>
                        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.78rem", color: g.notionId === activeGrowId ? gAccent : "#889", fontWeight: "700" }}>{g.name}</div>
                        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.6rem", color: "#445", marginTop: "2px" }}>{g.status?.toLowerCase() === "planning" ? "Planning" : "Active"} · {gPlantCount} plants</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: "right", paddingTop: "4px" }}>
            <div style={{ fontSize: "0.58rem", color: "#334", letterSpacing: "0.1em" }}>{growPlants.length} PLANTS</div>
            <div style={{ fontSize: "0.58rem", color: "#334", letterSpacing: "0.1em", marginTop: "2px" }}>{grow.medium ? grow.medium.toUpperCase() : ""}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "4px", marginTop: "1rem", overflowX: "auto", paddingBottom: "2px" }}>
          {grow.season.map(s => (
            <div key={s.month} style={{ flex: "0 0 auto", textAlign: "center", padding: "5px 8px", borderRadius: "4px", background: s.current ? (isPlanning ? "#0D0D18" : "#1a3a1a") : s.done ? "#111712" : "#0D100D", border: `1px solid ${s.current ? grow.accentColor : s.done ? "#2a3a2a" : "#1a2a1a"}` }}>
              <div style={{ fontSize: "0.55rem", color: s.current ? grow.accentColor : "#334", letterSpacing: "0.08em" }}>{s.month.toUpperCase()}</div>
              <div style={{ fontSize: "0.58rem", color: s.current ? (isPlanning ? "#a0a8c0" : "#a8d8a0") : "#334", marginTop: "1px" }}>{s.phase}</div>
            </div>
          ))}
        </div>
      </div>

      {!isPlanning && (
        <div style={{ display: "flex", borderBottom: "1px solid #1a2a1a" }}>
          {["plants", "log"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ flex: 1, padding: "10px", background: "none", border: "none", borderBottom: `2px solid ${view === v ? grow.accentColor : "transparent"}`, color: view === v ? grow.accentColor : "#445", fontFamily: "'Courier New', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", cursor: "pointer" }}>
              {v === "plants" ? "PLANTS" : `LOG (${growLogs.length})`}
            </button>
          ))}
          <button onClick={() => setBatchOpen(true)}
            style={{ padding: "10px 14px", background: "none", border: "none", borderBottom: "2px solid transparent", borderLeft: "1px solid #1a2a1a", color: "#445", fontFamily: "'Courier New', monospace", fontSize: "0.65rem", letterSpacing: "0.1em", cursor: "pointer", whiteSpace: "nowrap" }}>
            ↑ BATCH
          </button>
        </div>
      )}

      <div style={{ padding: "1rem" }}>
        {isPlanning && (
          <WinterPlanning grow={grow} plants={growPlants} checklist={winterChecklist} onToggle={toggleChecklist} notes={winterNotes} onNotesChange={setWinterNotes} />
        )}

        {!isPlanning && view === "plants" && (
          <>
            {grow.weeklyContext && (
              <div style={{ background: "#0D100D", border: "1px solid #1a3a1a", borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "#5BAD72", marginBottom: "8px" }}>THIS WEEK — JUNE / VEGGING</div>
                {grow.weeklyContext.focus.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
                    <span style={{ color: "#5BAD72", fontSize: "0.65rem" }}>›</span>
                    <span style={{ fontSize: "0.72rem", color: "#8aaa86", lineHeight: "1.4" }}>{f}</span>
                  </div>
                ))}
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #1a2a1a", fontSize: "0.68rem", color: "#556", lineHeight: "1.5", fontStyle: "italic" }}>
                  {grow.weeklyContext.tip}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {growPlants.map(p => <PlantCard key={p.id} plant={p} logs={logs} onCheckIn={setCheckingIn} />)}
            </div>
          </>
        )}

        {!isPlanning && view === "log" && (
          <div>
            {growLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#334", fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                NO ENTRIES YET<br /><span style={{ fontSize: "0.65rem", color: "#223" }}>Check in on a plant to start your log</span>
              </div>
            ) : (
              [...growLogs].reverse().map((entry, i) => {
                const plant = growPlants.find(p => p.id.toLowerCase() === entry.plantId.toLowerCase());
                return (
                  <div key={i} style={{ background: "#0D100D", border: "1px solid #1a2a1a", borderRadius: "8px", padding: "1rem", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontSize: "0.8rem", color: plant?.color, fontWeight: "700" }}>{plant?.emoji} {entry.plantName}</div>
                      <div style={{ fontSize: "0.6rem", color: "#445" }}>{new Date(entry.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "8px" }}>
                      {[{ label: "HT", value: entry.height ? `${entry.height}"` : "—" }, { label: "H2O", value: entry.watering ? `×${entry.watering}` : "—" }, { label: "HEALTH", value: entry.health || "—", color: HEALTH_COLORS[entry.health] }].map(s => (
                        <div key={s.label} style={{ background: "#111712", borderRadius: "4px", padding: "5px 7px" }}>
                          <div style={{ fontSize: "0.52rem", color: "#334", letterSpacing: "0.08em" }}>{s.label}</div>
                          <div style={{ fontSize: "0.72rem", color: s.color || "#a8c4a0", marginTop: "1px" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {entry.notes && <div style={{ fontSize: "0.7rem", color: "#667", lineHeight: "1.5", borderLeft: "1px solid #1a2a1a", paddingLeft: "8px" }}>{entry.notes}</div>}
                    {entry.issues && <div style={{ fontSize: "0.7rem", color: "#E8874A", lineHeight: "1.5", marginTop: "4px" }}>⚠ {entry.issues}</div>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {checkingIn && <CheckInForm plant={checkingIn} grow={grow} onSave={handleSave} onClose={() => setCheckingIn(null)} />}
      {batchOpen && <BatchUploadPanel accentColor={grow.accentColor} onClose={() => setBatchOpen(false)} />}
      {dropdownOpen && <div onClick={() => setDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
    </div>
  );
}
