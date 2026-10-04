---
status: mixed
related_phases: []
---

# Technical Decisions — Fixture Gamma (golden fixture for gate 5b)

Third synthetic document. It covers the two coverage gaps the gate had:

- **a decided TD next to a pending one**, so `--decided-only` can be asserted:
  a pending TD has Recommendation prose and no `**Decision:**`, and the
  emitting agents only ever emit decided TDs;
- **a Recommendation carrying a bold prose subtitle**, which an earlier
  block-end rule treated as the end of the block — measuring the block short
  on both sides, so the counts matched and the loss was invisible.

Counts are hand-derivable: every content line is a fixed-length run.

## TD-01: Decidido, com subtitulo em negrito no meio da prosa

**Context:** three content lines of 10, 12 and 10 characters, so 32.
**Options:** A ou B.
**Recommendation:** Option A (com nome) — abcdefghij
**abcdefgh**
abcdefghij
**Decision:** A
**Libraries:** none

---

## TD-02: Pending, com Recommendation escrita

**Context:** the counter sees this block; `--decided-only` drops it.
**Recommendation:** Option B — abcde
**Decision:** _[pending]_

---

## TD-03: Decidido, com rotulo desconhecido na prosa

**Context:** `**Naocampo:**` is not in FIELD_NAMES, so it stays in the body
and the counter warns on stderr. 5 + 19 = 24.
**Recommendation:** abcde
**Naocampo:** abcde
**Decision:** C
**Libraries:** none

---
