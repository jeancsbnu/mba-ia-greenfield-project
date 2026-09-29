---
name: figma-batch
description: "Read everything needed from Figma in a SINGLE use_figma call and cache it to disk, instead of spending one MCP call per get_design_context / get_screenshot / get_metadata / get_variable_defs. Use whenever a task needs Figma data — screen inventories, token audits, design drift checks, implementing a screen — and especially when the Figma account is on the free Starter plan, where the call quota is a rolling window that exhausts quickly. Also covers batching writes (creating or fixing frames) into the same single call. Triggers on: extrair do Figma, ler o Figma, inventariar telas, cota do Figma, economizar chamadas do Figma, figma quota, batch figma, uma chamada só no Figma."
---

# Figma Batch

Pull everything a task needs from Figma in **one** `use_figma` call, and persist the result so later consumers read the disk instead of Figma.

This skill exists because of a hard constraint: the project's Figma account is on the **free Starter plan**, whose MCP call quota is a **rolling window**, not a monthly allowance. It has been exhausted twice mid-task in this project, blocking sub-agents that had no fallback. The cost of a careless call pattern is not money — it is a blocked pipeline with an unpredictable recovery time.

## The two rules

1. **One `use_figma` call per task.** Not one per screen, not one per concern. Compose the whole read (and any writes) into a single script and return one structured payload.
2. **Cache to disk, read from disk.** A second consumer of the same nodes must not touch the MCP. The cache is committed, so the quota is spent once for the whole repository and survives across sessions.

Everything below serves those two rules.

## Prerequisite — load `figma:figma-use` first

`use_figma` **requires** the `figma:figma-use` skill to be loaded before the first call. This is the tool's own contract, not a convention; skipping it causes silent failures around fonts, modes, and async ordering.

Load it **once** per session. It applies to every later `use_figma` call in the same session — do not reload before each one.

Pass `skillNames: "figma-use,figma-batch"` on the call so the usage is logged correctly.

## Why this beats the per-tool calls

| Concern | Old way | Cost | This skill |
|---|---|---|---|
| Component tree of a screen | `get_design_context` | 1 call **per node** | inside the single script |
| Rendered image | `get_screenshot` | 1 call per node | `node.screenshot()` inside the script |
| Node names / ids only | `get_metadata` | 1 call | inside the single script |
| Design tokens | `get_variable_defs` | 1 call, **one mode only** | `getLocalVariableCollectionsAsync()`, all modes |

A `screen-inventory` run over 2 screens currently costs about **8 calls**. The same run through this skill costs **1**, and **0** on any re-run that the cache can serve.

The variables case is not only cheaper but strictly more capable: `get_variable_defs` returns a single mode, while the Plugin API exposes every mode of every collection. `figma-audit-tokens` already relies on this for the same reason.

## Step 1 — Declare the harvest before calling

Write down, before composing the script, exactly what the task needs. A call that comes back missing one field costs a second call — which is the failure this skill exists to prevent.

- **`fileKey`** — from the URL `figma.com/design/:fileKey/:name?node-id=1-2`. Branch URLs (`/branch/:branchKey/`) route through `branchKey`; keep `fileKey` for provenance.
- **Node ids** — every node the task touches, converted from URL form `1-2` to API form `1:2`. List them all now.
- **Which blocks** — `tree`, `variables`, `styles`, `screenshots`. Ask for what the task consumes and nothing else; each block adds response size, and an oversized response is its own failure mode.
- **`maxDepth`** — the tree walker's depth limit. 6 covers a typical screen; deep component instances may need 8. Unbounded walks on a large frame produce a response too big to be useful.

## Step 2 — Check the cache first

```bash
ls docs/figma-cache/<fileKey>/
```

Each entry is `<nodeId>.json` with a `fetched_at` and the `source_modified` the harvest observed. **If the cache covers every node and block the task needs, do not call the MCP at all.**

Re-harvest only when one of these holds, and say which one when you do:

- The cache is missing a node or a block the task needs.
- The frames changed in Figma since `fetched_at` — someone edited the design.
- The task is a **write** (creating or fixing nodes), which invalidates the cached tree for the nodes it touches.

A stale cache is not automatically wrong. Node ids and component structure are stable across cosmetic edits; the risk of reusing a week-old cache is usually lower than the risk of a blocked quota. Judge it, and record the judgment.

## Step 3 — Compose and run the single call

The harvest script template is in `references/harvest.js`. Read it, substitute the header constants, and pass the whole thing as `code`.

The script returns one JSON object:

```
{
  fileKey, harvestedAt, page: { id, name },
  nodes:      { "<nodeId>": { ...tree } },
  variables:  [ { collection, modes, variables: [...] } ],
  styles:     { text: [...], paint: [...], effect: [...] },
  screenshots:{ "<nodeId>": "<data-uri or null>" },
  errors:     [ "..." ]
}
```

`errors` is load-bearing: the script never throws on a single bad node id, because a throw wastes the whole call. It records the failure and continues, so one typo does not cost a second round trip.

### Writes go in the same call

When the task also creates or fixes nodes, do it in the **same** script — mutate first, then harvest, so the returned tree already reflects the writes. A write followed by a separate read-back is two calls doing one call's work.

The Plugin API gotchas that bite here, all confirmed in this project:

- Font "Inter" uses the styles `"Semi Bold"` and `"Extra Bold"` — **not** `"SemiBold"` / `"ExtraBold"`.
- Changing page requires `await figma.setCurrentPageAsync(page)`; assigning `figma.currentPage` does not work.
- `loadAllPagesAsync`, `setPluginData` and `createImageAsync` are **not supported** — never call them.
- Calling `resize()` on a TEXT node **resets `textAutoResize` to `NONE`**. Correct order: set `layoutSizingHorizontal = "FILL"`, *then* `textAutoResize = "HEIGHT"`.
- Cloning a FRAME that carries an IMAGE fill can yield a node that does not render. Create the new node and copy the source's `fills` array instead.

## Step 4 — Write the cache

Persist each harvested node to `docs/figma-cache/<fileKey>/<nodeId>.json`, and the file-level blocks to `docs/figma-cache/<fileKey>/_file.json`.

```yaml
# each node file carries this envelope
fileKey: FetKyb1V02WS5D6VCatK6t
nodeId: "66:42"
fetched_at: "2026-09-29T10:00:00-03:00"
blocks: [tree, screenshot]
harvested_by: figma-batch
```

Commit the cache. It is derived data, but on a free plan the quota it saves is worth more than the diff noise, and a committed cache means a fresh clone does not re-spend the budget.

Screenshots are written as separate `.png` files next to the JSON, not embedded as data URIs — a base64 image inside a JSON blob bloats every later read of that file.

## Step 5 — Report the cost

State plainly, every run: how many MCP calls were spent, what the cache served, and what a future run can skip. This is what keeps the discipline visible instead of aspirational.

> Harvest: 1 `use_figma` call. 2 nodes, blocks `tree` + `screenshots`. Cached to `docs/figma-cache/FetKyb…/`. A re-run of `/screen-inventory 05` now costs 0 calls.

## What this skill does not do

- **It does not invent design.** A harvest returns what is in the frame. If a component was never drawn, the tree will not contain it, and no amount of batching changes that — the design gap has to be closed in Figma first. This has already bitten this project: a control decided in a TD but never drawn cannot be inventoried.
- **It does not replace `/screen-inventory`.** That skill owns classification (Presentational / Local-interactive / Server-connected), verbs of intent, and the Output Contract. This one feeds it raw material.
- **It does not judge cache freshness for you.** Step 2 gives the criteria; the decision, and its justification, belong in the run's report.

## Fallback when the quota is already exhausted

The MCP returns a quota error rather than data. When that happens:

1. **Use the cache**, even if stale, and say in the consuming artifact that the data is cached and from when.
2. **If there is no cache and the frames were created in this session by script**, the authoring script itself is a legitimate provenance — the node structure is known by construction. Declare that provenance in the artifact, and record what is missing (child node ids assigned from memory would be wrong — leave them out rather than guess).
3. **Do not block silently and do not invent.** A sub-agent that cannot read Figma must return a BLOCKED marker, not a plausible-looking tree.

The quota is a **rolling window**: it has released and re-exhausted twice in this project. "Exhausted" means wait, not never.
