#!/usr/bin/env python3
"""recommendation-chars.py — prints "<slug>/<td> <chars>" per Recommendation block.

Used by the /plan-context gate 5b (Recommendation completeness) to detect
`decisions-detail-reader` truncating Recommendation prose. The same counter
runs over both sides of the comparison:

  - the source decisions docs, where a TD opens as `## TD-01: Titulo` and the
    slug comes from the filename (`technical-decisions-<slug>.md`)
  - the agent's output, where a TD opens as `### {slug}/TD-01` and the slug is
    already in the heading

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

Usage: recommendation-chars.py FILE [FILE ...]
"""

import os
import re
import sys

# `## TD-01: Titulo` (source doc) — the colon and title are optional.
RE_SOURCE_TD = re.compile(r"^## (TD-[0-9]+)\b")
# `### {slug}/TD-01` (agent output).
RE_AGENT_TD = re.compile(r"^### ([a-z0-9-]+)/(TD-[0-9]+)\b")

RE_RECOMMENDATION = re.compile(r"^\*\*Recommendation:\*\*\s*")

# The option marker. The parenthetical name is optional and may itself contain
# the em-dash-free prose seen in these docs; the bold markers are optional
# because both `**Option A (Name)** — ` and `Option A (Name) — ` occur.
RE_OPTION_PREFIX = re.compile(
    r"^\*{0,2}Option\s+[A-Z]\*{0,2}"   # Option A, **Option A**
    r"(?:\s*\([^)]*\))?"               # optional (Name)
    r"\*{0,2}"                         # trailing bold, as in **Option A (Name)**
    r"\s*[—-]+\s*"                     # the separating dash
)

# A Recommendation block ends at the next bolded field, rule, or heading.
RE_BLOCK_END = re.compile(r"^(?:\*\*[A-Za-z]|---|### |## )")

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


def count_file(path, slug=None):
    """Yield (`{slug}/TD-NN`, chars) for each Recommendation block in `path`.

    `slug` overrides the filename-derived slug used for source-shaped
    (`## TD-NN`) headings; agent-shaped (`### {slug}/TD-NN`) headings always
    carry their own slug and ignore both.
    """
    file_slug = slug if slug is not None else slug_for(path)
    key = None
    in_rec = False
    total = 0

    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n").rstrip("\r")

            if in_rec and RE_BLOCK_END.match(line):
                yield key, total
                in_rec = False
                # fall through: this same line may open the next TD/block

            m = RE_AGENT_TD.match(line)
            if m:
                key = f"{m.group(1)}/{m.group(2)}"
                continue
            m = RE_SOURCE_TD.match(line)
            if m:
                key = f"{file_slug}/{m.group(1)}"
                continue

            if RE_RECOMMENDATION.match(line):
                body = RE_RECOMMENDATION.sub("", line)
                body = RE_OPTION_PREFIX.sub("", body)
                total = len(body.strip())
                in_rec = True
                continue

            if in_rec:
                total += len(line.strip())

    if in_rec:
        yield key, total


def main(argv):
    if not argv:
        print(__doc__.strip().splitlines()[-1], file=sys.stderr)
        return 2
    for path in argv:
        for key, chars in count_file(path):
            print(key, chars)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
