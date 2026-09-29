// figma-batch — harvest template for a SINGLE use_figma call.
//
// Substitute the CONFIG block, paste the whole file as the tool's `code` argument.
// Everything the task needs must be requested here: a second call is the failure
// this template exists to prevent.
//
// Contract: never throw on a single bad input. A throw discards the whole call,
// which on a free-plan quota is the expensive mistake. Failures go to `errors`.

// ── CONFIG ──────────────────────────────────────────────────────────────────
const NODE_IDS = ["66:42", "68:62"];        // API form "1:2", NOT url form "1-2"
const BLOCKS   = ["tree", "screenshots"];    // tree | variables | styles | screenshots
const MAX_DEPTH = 6;                         // 6 covers a typical screen; 8 for deep instances
// ────────────────────────────────────────────────────────────────────────────

const out = {
  fileKey: figma.fileKey ?? null,
  harvestedAt: new Date().toISOString(),
  page: { id: figma.currentPage.id, name: figma.currentPage.name },
  nodes: {}, variables: [], styles: {}, screenshots: {}, errors: [],
};
const want = (b) => BLOCKS.includes(b);
const note = (where, e) => out.errors.push(`${where}: ${e && e.message ? e.message : String(e)}`);

const hex = (c) => {
  const b = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  const base = "#" + b(c.r) + b(c.g) + b(c.b);
  return c.a !== undefined && c.a < 1 ? base + b(c.a) : base;
};

// Paints are the single most common thing a consumer needs and the most verbose
// thing Figma returns. Keep only what identifies the paint.
const paints = (v) => {
  if (!Array.isArray(v)) return undefined;              // figma.mixed
  return v.filter((p) => p.visible !== false).map((p) => {
    if (p.type === "SOLID") return { type: "SOLID", color: hex(p.color), opacity: p.opacity ?? 1 };
    if (p.type === "IMAGE") return { type: "IMAGE", scaleMode: p.scaleMode };
    return { type: p.type };
  });
};

function walk(node, depth) {
  const o = { id: node.id, name: node.name, type: node.type };
  if (node.visible === false) o.visible = false;

  try {
    if ("width" in node) o.size = { w: Math.round(node.width), h: Math.round(node.height) };
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
      o.layout = {
        mode: node.layoutMode,
        gap: node.itemSpacing,
        padding: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft],
        primary: node.primaryAxisAlignItems,
        counter: node.counterAxisAlignItems,
      };
    }
    if ("layoutPositioning" in node && node.layoutPositioning === "ABSOLUTE") o.absolute = true;
    if ("fills" in node) o.fills = paints(node.fills);
    if ("strokes" in node && node.strokes.length) {
      o.strokes = paints(node.strokes);
      o.strokeWeight = node.strokeWeight;
      if (node.dashPattern && node.dashPattern.length) o.dash = node.dashPattern;
    }
    if ("cornerRadius" in node && node.cornerRadius) o.radius = node.cornerRadius;

    if (node.type === "TEXT") {
      o.characters = node.characters;
      o.font = node.fontName && node.fontName.family
        ? { family: node.fontName.family, style: node.fontName.style } : "mixed";
      o.fontSize = node.fontSize;
      o.textAutoResize = node.textAutoResize;
    }

    // Instances are the join key to the design system — always record the source.
    if (node.type === "INSTANCE") {
      o.instance = true;
      try {
        const main = node.getMainComponentAsync ? null : node.mainComponent;
        if (main) o.mainComponent = { id: main.id, name: main.name, key: main.key };
      } catch (e) { note(`instance ${node.id}`, e); }
    }
    if (node.type === "COMPONENT") o.componentKey = node.key;
  } catch (e) {
    note(`props ${node.id}`, e);
  }

  if ("children" in node && node.children.length) {
    if (depth >= MAX_DEPTH) {
      o.truncated = node.children.length;   // say so rather than silently dropping
    } else {
      o.children = node.children.map((c) => walk(c, depth + 1));
    }
  }
  return o;
}

// ── nodes ───────────────────────────────────────────────────────────────────
for (const id of NODE_IDS) {
  try {
    const node = await figma.getNodeByIdAsync(id);
    if (!node) { note(id, "node not found"); continue; }

    if (want("tree")) out.nodes[id] = walk(node, 0);

    if (want("screenshots")) {
      // `screenshot()` is provided by this MCP's sandbox, not by the public
      // Plugin API — guard it so a missing helper degrades instead of throwing.
      try {
        out.screenshots[id] = typeof node.screenshot === "function"
          ? await node.screenshot()
          : null;
        if (out.screenshots[id] === null) note(id, "screenshot() unavailable in this sandbox");
      } catch (e) { out.screenshots[id] = null; note(`screenshot ${id}`, e); }
    }
  } catch (e) { note(id, e); }
}

// ── variables (all modes — this is what get_variable_defs cannot do) ─────────
if (want("variables")) {
  try {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    for (const col of collections) {
      const entry = {
        collection: col.name,
        modes: col.modes.map((m) => ({ id: m.modeId, name: m.name })),
        variables: [],
      };
      for (const vid of col.variableIds) {
        try {
          const v = await figma.variables.getVariableByIdAsync(vid);
          if (!v) continue;
          const values = {};
          for (const m of col.modes) {
            let raw = v.valuesByMode[m.modeId];
            // Aliases chain; resolve so the consumer sees a real value.
            let hops = 0;
            while (raw && raw.type === "VARIABLE_ALIAS" && hops++ < 10) {
              const target = await figma.variables.getVariableByIdAsync(raw.id);
              if (!target) break;
              raw = target.valuesByMode[Object.keys(target.valuesByMode)[0]];
            }
            values[m.name] =
              raw && typeof raw === "object" && "r" in raw ? hex(raw) : raw;
          }
          entry.variables.push({ name: v.name, type: v.resolvedType, values });
        } catch (e) { note(`variable ${vid}`, e); }
      }
      out.variables.push(entry);
    }
  } catch (e) { note("variables", e); }
}

// ── styles ──────────────────────────────────────────────────────────────────
if (want("styles")) {
  try {
    const [text, paint, effect] = await Promise.all([
      figma.getLocalTextStylesAsync(),
      figma.getLocalPaintStylesAsync(),
      figma.getLocalEffectStylesAsync(),
    ]);
    out.styles = {
      text: text.map((s) => ({
        name: s.name, key: s.key,
        font: s.fontName, size: s.fontSize, lineHeight: s.lineHeight,
      })),
      paint: paint.map((s) => ({ name: s.name, key: s.key, paints: paints(s.paints) })),
      effect: effect.map((s) => ({ name: s.name, key: s.key })),
    };
  } catch (e) { note("styles", e); }
}

// A file with zero Variables and zero styles is a real finding, not an error —
// it means the design uses flat hex, and the consumer must not look for tokens.
if (want("variables") && out.variables.length === 0) {
  out.errors.push("note: file declares no local Variable collections (flat values)");
}

return out;
