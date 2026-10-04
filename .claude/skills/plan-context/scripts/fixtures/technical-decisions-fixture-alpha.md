---
status: decided
related_phases: []
---

# Technical Decisions — Fixture Alpha (golden fixture for gate 5b)

Synthetic document. It exists only so the golden counts in
`test_recommendation_chars.py` stay stable: a real decisions doc gains TDs as
the project moves, which turned the golden assertion red for a benign reason
and trained us to ignore the suite.

Every Recommendation below is built from fixed-length runs so the expected
counts are hand-derivable, not read back off the counter.

## TD-01: Chave qualificada pelo slug

**Context:** Soft wrap, a blank line, and an `Option X (Name) — ` marker in one
block — 3 runs of 10 characters, so 30.
**Options:** A ou B.
**Recommendation:** Option A (duas tabelas) — abcdefghij
abcdefghij

abcdefghij
**Decision:** A
**Libraries:** none

---

## TD-02: Contagem em caracteres, nao em bytes

**Recommendation:** **Option B (acentos)** — ção—
**Decision:** B
**Libraries:** none

---
