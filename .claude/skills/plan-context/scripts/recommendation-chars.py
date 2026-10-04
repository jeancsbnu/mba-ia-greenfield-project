#!/usr/bin/env python3
"""recommendation-chars.py — prints "<td> <chars>" per Recommendation block.

Used by the /plan-context gate 5b (Recommendation completeness) to detect
`decisions-detail-reader` truncating Recommendation prose. The same counter
runs over both sides of the comparison:

  - the source decisions docs, where a TD opens as `## TD-01: Titulo`
  - the agent's output, where a TD opens as `### {slug}/TD-01`

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

import re
import sys

# `## TD-01: Titulo` (source doc) — the colon and title are optional.
RE_SOURCE_TD = re.compile(r"^## (TD-[0-9]+)\b")
# `### {slug}/TD-01` (agent output).
RE_AGENT_TD = re.compile(r"^### [a-z0-9-]+/(TD-[0-9]+)\b")

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


def count_file(path):
    """Yield (td, chars) for each Recommendation block in `path`."""
    td = None
    in_rec = False
    total = 0

    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n").rstrip("\r")

            if in_rec and RE_BLOCK_END.match(line):
                yield td, total
                in_rec = False
                # fall through: this same line may open the next TD/block

            m = RE_AGENT_TD.match(line) or RE_SOURCE_TD.match(line)
            if m:
                td = m.group(1)
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
        yield td, total


def main(argv):
    if not argv:
        print(__doc__.strip().splitlines()[-1], file=sys.stderr)
        return 2
    for path in argv:
        for td, chars in count_file(path):
            print(td, chars)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
