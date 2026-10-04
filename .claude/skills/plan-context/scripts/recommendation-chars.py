#!/usr/bin/env python3
"""recommendation-chars.py — prints "<slug>/<td> <chars>" per Recommendation block.

Used by the /plan-context gate 5b (Recommendation completeness) to detect a
Recommendation that came back truncated. The same counter runs over both sides
of every comparison the gate makes:

  - the source decisions docs, where a TD opens as `## TD-01: Titulo` and the
    slug comes from the filename (`technical-decisions-<slug>.md`)
  - agent output and assembled context.md, where a TD opens as
    `### {slug}/TD-01` and the slug is already in the heading

Every key is qualified by the slug, because TD numbering restarts per document:
a kept set holding two decisions docs normally has two different `TD-01`s. A
bare `TD-NN` key makes the second doc overwrite the first in the consumer's
dictionary, which the gate then reports as a pile of MISMATCH + missing TDs.

Normalization (identical on both sides, so the comparison is exact, not a
tolerance band):
  - drop the `**Recommendation:**` marker
  - drop the leading option marker in every form seen in this project:
    `Option A — `, `Option A (Name) — `, `**Option A (Name)** — `
  - trim leading/trailing whitespace per line
  - count characters EXCLUDING newlines, so soft-wrap differences do not
    register

Counts characters, not bytes: accented Portuguese prose and the em-dash are
multi-byte in UTF-8 and would otherwise inflate every total.

A Recommendation block ends at a KNOWN FIELD label (see FIELD_NAMES), a rule,
or a heading — not at any bold line. An earlier version ended it at any
`**Word`, which measured a Recommendation containing a bold prose subtitle
short on BOTH sides: the counts matched, the gate passed, and the lost lines
were invisible. `msw-foundation/TD-02` is the live example — five lines after
`**When Option A should be revisited**` were outside the measured span.
Because the allowlist can go stale, a `**Label:**` line that is NOT a known
field and gets absorbed into a Recommendation is reported on stderr.

Options:
  --decided-only   skip TDs with no `**Decision:** <CAPITAL>` line. Apply this
                   to SOURCE decisions docs only: a pending TD has
                   Recommendation prose but no Decision, and the emitting
                   agents only ever emit decided TDs, so without this flag the
                   pending TD reads as a missing key. Agent output and
                   context.md carry no Decision field at all, so the flag would
                   empty them — the counter warns on stderr if that happens.
  --section NAME   count only blocks inside the `## NAME` section. Needed
                   because a context.md holds both `## Decisions Detail` and
                   `## Inherited Decisions Detail`, and the gate compares them
                   against different sources.

Usage: recommendation-chars.py [--decided-only] [--section NAME] FILE [FILE ...]
"""

import os
import re
import sys

# `## TD-01: Titulo` (source doc) — the colon and title are optional.
RE_SOURCE_TD = re.compile(r"^## (TD-[0-9]+)\b")
# `### {slug}/TD-01` (agent output, context.md).
RE_AGENT_TD = re.compile(r"^### ([a-z0-9-]+)/(TD-[0-9]+)\b")

RE_RECOMMENDATION = re.compile(r"^\*\*Recommendation:\*\*\s*")
RE_DECISION = re.compile(r"^\*\*Decision:\*\*\s*\*{0,2}([A-Z])")

# The option marker. The parenthetical name is optional and may itself contain
# the em-dash-free prose seen in these docs; the bold markers are optional
# because both `**Option A (Name)** — ` and `Option A (Name) — ` occur.
RE_OPTION_PREFIX = re.compile(
    r"^\*{0,2}Option\s+[A-Z]\*{0,2}"   # Option A, **Option A**
    r"(?:\s*\([^)]*\))?"               # optional (Name)
    r"\*{0,2}"                         # trailing bold, as in **Option A (Name)**
    r"\s*[—-]+\s*"                     # the separating dash
)

# Every field label that may follow a Recommendation in a decisions doc or in
# an assembled context.md. Surveyed across docs/decisions/*.md and
# docs/phases/*/context.md; `Note` is a real sibling field (a Decision that
# diverged from the Recommendation), not prose.
FIELD_NAMES = frozenset({
    "Capability", "Context", "Decision", "Libraries", "Note", "Options",
    "Recommendation", "Renders in", "Revisions", "Scope", "Trigger",
})

RE_LABEL = re.compile(r"^\*\*([A-Za-z][^*]{0,60}?):\*\*")
RE_RULE_OR_HEADING = re.compile(r"^(?:---|### |## )")
RE_SECTION = re.compile(r"^## (.+?)\s*$")

DOC_PREFIX = "technical-decisions-"


def slug_for(path):
    """Derive the decisions-doc slug from `path`'s filename.

    `docs/decisions/technical-decisions-social-interactions.md` →
    `social-interactions`. A filename that does not carry the project prefix
    falls back to its stem, so an ad-hoc or scratch file still gets a stable,
    non-empty key component.
    """
    stem = os.path.splitext(os.path.basename(path))[0]
    if stem.startswith(DOC_PREFIX) and len(stem) > len(DOC_PREFIX):
        return stem[len(DOC_PREFIX):]
    return stem


def _ends_block(line):
    """True when `line` closes a Recommendation block."""
    if RE_RULE_OR_HEADING.match(line):
        return True
    m = RE_LABEL.match(line)
    return bool(m and m.group(1).strip() in FIELD_NAMES)


def _absorbed_label(line):
    """A `**Label:**` line that is NOT a known field, so it stays in the body."""
    m = RE_LABEL.match(line)
    if m and m.group(1).strip() not in FIELD_NAMES:
        return m.group(1).strip()
    return None


def records(path, slug=None, section=None, warn=None):
    """Yield (key, chars, decided) per Recommendation block in `path`.

    `decided` is True when the TD carries a `**Decision:** <CAPITAL>` line,
    False when it does not, and is therefore False for every block in agent
    output and context.md (neither carries that field).
    """
    file_slug = slug if slug is not None else slug_for(path)
    pending = []          # (key, chars) awaiting their Decision verdict
    key = None
    in_rec = False
    in_section = section is None
    total = 0

    def flush(decided):
        while pending:
            k, c = pending.pop(0)
            yield k, c, decided

    with open(path, encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, 1):
            line = raw.rstrip("\n").rstrip("\r")

            m = RE_SECTION.match(line)
            if m and section is not None:
                # A new H2 closes the previous section's accounting.
                if in_rec:
                    pending.append((key, total))
                    in_rec = False
                yield from flush(False)
                in_section = m.group(1).strip() == section
                continue

            if not in_section:
                continue

            if in_rec and _ends_block(line):
                pending.append((key, total))
                in_rec = False
                # fall through: this same line may be the Decision, or open
                # the next TD.

            if RE_DECISION.match(line):
                yield from flush(True)
                continue

            m = RE_AGENT_TD.match(line)
            if m:
                yield from flush(False)
                key = f"{m.group(1)}/{m.group(2)}"
                continue
            m = RE_SOURCE_TD.match(line)
            if m:
                yield from flush(False)
                key = f"{file_slug}/{m.group(1)}"
                continue

            if RE_RECOMMENDATION.match(line):
                body = RE_RECOMMENDATION.sub("", line)
                body = RE_OPTION_PREFIX.sub("", body)
                total = len(body.strip())
                in_rec = True
                continue

            if in_rec:
                if warn is not None:
                    label = _absorbed_label(line)
                    if label:
                        warn(
                            f"{path}:{lineno}: '**{label}:**' is not a known "
                            f"field and was counted as Recommendation body of "
                            f"{key}. Add it to FIELD_NAMES if it is a field."
                        )
                total += len(line.strip())

    if in_rec:
        pending.append((key, total))
    yield from flush(False)


def count_file(path, slug=None, decided_only=False, section=None, warn=None):
    """Yield (`{slug}/TD-NN`, chars) for each Recommendation block in `path`."""
    for key, chars, decided in records(path, slug=slug, section=section, warn=warn):
        if decided_only and not decided:
            continue
        yield key, chars


def main(argv):
    decided_only = False
    section = None
    paths = []
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--decided-only":
            decided_only = True
        elif arg == "--section":
            i += 1
            if i >= len(argv):
                print("--section needs a value", file=sys.stderr)
                return 2
            section = argv[i]
        elif arg.startswith("--"):
            print(f"unknown option: {arg}", file=sys.stderr)
            return 2
        else:
            paths.append(arg)
        i += 1

    if not paths:
        print(
            "Usage: recommendation-chars.py [--decided-only] "
            "[--section NAME] FILE [FILE ...]",
            file=sys.stderr,
        )
        return 2

    def warn(msg):
        print(f"WARN: {msg}", file=sys.stderr)

    for path in paths:
        rows = list(
            records(path, section=section, warn=warn)
        )
        if decided_only and rows and not any(d for _, _, d in rows):
            warn(
                f"{path}: --decided-only given but the file has no "
                f"'**Decision:**' field — every block was dropped. This flag "
                f"is for source decisions docs, not agent output or context.md."
            )
        for key, chars, decided in rows:
            if decided_only and not decided:
                continue
            print(key, chars)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
