#!/usr/bin/env python3
"""Tests for recommendation-chars.py — the /plan-context gate 5b counter.

Run from the repository root:

    python -m unittest discover -s .claude/skills/plan-context/scripts -v

The gate these back is what catches `decisions-detail-reader` truncating
Recommendation prose, so a silent miscount here makes the gate pass in false.
The embedded-awk version of this counter shipped with exactly that failure: its
option-prefix regexes could not match the `Option A (Name) — ` form that every
Recommendation in this project actually uses, so each count came back inflated
by the length of the surviving prefix.
"""

import importlib.util
import pathlib
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[3]
DECISIONS = REPO_ROOT / "docs" / "decisions"

_spec = importlib.util.spec_from_file_location(
    "recommendation_chars", HERE / "recommendation-chars.py"
)
rc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rc)


def count_text(text):
    """Run the counter over `text`, returning {td: chars}."""
    with tempfile.NamedTemporaryFile(
        "w", suffix=".md", encoding="utf-8", delete=False
    ) as fh:
        fh.write(text)
        path = fh.name
    try:
        return dict(rc.count_file(path))
    finally:
        pathlib.Path(path).unlink()


class TestOptionPrefixStripping(unittest.TestCase):
    """Every option-marker form seen in this project must be stripped.

    `Option A (Name) — ` is the regression case: the awk this script replaced
    left it in place and counted it as content.
    """

    def _chars(self, recommendation):
        got = count_text(
            "## TD-01: Titulo\n"
            f"**Recommendation:** {recommendation}\n"
            "**Decision:** A\n"
        )
        return got["TD-01"]

    def test_plain_option_dash(self):
        self.assertEqual(self._chars("Option A — abcde"), 5)

    def test_option_with_parenthetical(self):
        self.assertEqual(self._chars("Option A (duas tabelas) — abcde"), 5)

    def test_bolded_option_with_parenthetical(self):
        self.assertEqual(self._chars("**Option A (duas tabelas)** — abcde"), 5)

    def test_parenthetical_containing_accents_and_commas(self):
        self.assertEqual(
            self._chars("Option B (recentes primeiro, pré-carregadas) — abcde"), 5
        )

    def test_no_option_marker_counts_whole_prose(self):
        self.assertEqual(self._chars("abcde"), 5)


class TestCounting(unittest.TestCase):
    def test_counts_characters_not_bytes(self):
        # "ção" and the em-dash are multi-byte in UTF-8; a byte count would
        # report more than 5.
        self.assertEqual(
            count_text(
                "## TD-01: T\n**Recommendation:** ção—\n**Decision:** A\n"
            )["TD-01"],
            4,
        )

    def test_newlines_excluded_so_soft_wrap_does_not_register(self):
        wrapped = count_text(
            "## TD-01: T\n**Recommendation:** abc\ndef\nghi\n**Decision:** A\n"
        )
        single = count_text(
            "## TD-01: T\n**Recommendation:** abcdefghi\n**Decision:** A\n"
        )
        self.assertEqual(wrapped["TD-01"], single["TD-01"])
        self.assertEqual(wrapped["TD-01"], 9)

    def test_blank_lines_add_nothing(self):
        self.assertEqual(
            count_text(
                "## TD-01: T\n**Recommendation:** abc\n\n\ndef\n**Decision:** A\n"
            )["TD-01"],
            6,
        )

    def test_block_ends_at_next_bolded_field(self):
        got = count_text(
            "## TD-01: T\n"
            "**Recommendation:** abcde\n"
            "**Decision:** this prose must not be counted\n"
        )
        self.assertEqual(got["TD-01"], 5)

    def test_block_ends_at_horizontal_rule_and_next_td_is_keyed(self):
        got = count_text(
            "## TD-01: T\n**Recommendation:** abcde\n---\n"
            "## TD-02: T\n**Recommendation:** abc\n**Decision:** A\n"
        )
        self.assertEqual(got, {"TD-01": 5, "TD-02": 3})

    def test_recommendation_at_end_of_file_is_emitted(self):
        self.assertEqual(
            count_text("## TD-01: T\n**Recommendation:** abcde\n")["TD-01"], 5
        )


class TestKeying(unittest.TestCase):
    """Both heading shapes must key to the same bare TD id, or the gate
    compares misaligned lists."""

    def test_source_heading_shape(self):
        self.assertEqual(
            count_text("## TD-07: Titulo\n**Recommendation:** abcde\n"),
            {"TD-07": 5},
        )

    def test_agent_heading_shape(self):
        self.assertEqual(
            count_text("### social-interactions/TD-07\n**Recommendation:** abcde\n"),
            {"TD-07": 5},
        )

    def test_both_shapes_agree(self):
        src = count_text("## TD-07: Titulo\n**Recommendation:** abcde\n")
        agent = count_text(
            "### social-interactions/TD-07\n**Recommendation:** abcde\n"
        )
        self.assertEqual(src, agent)


class TestAgainstRealDecisionsDocs(unittest.TestCase):
    """Locks in the counts measured for the Phase 06 decisions docs.

    These are the numbers the gate compares the agent's output against. If a
    decisions doc is legitimately edited, update the expectation in the same
    commit — a diff here means either the doc changed or the counter drifted.
    """

    EXPECTED = {
        "technical-decisions-social-interactions.md": {
            "TD-01": 538,
            "TD-02": 860,
            "TD-03": 550,
            "TD-04": 630,
            "TD-05": 611,
            "TD-06": 562,
            "TD-07": 701,
            "TD-08": 553,
        },
        "technical-decisions-social-interactions-anonymous-gate.md": {
            "TD-01": 635,
            "TD-02": 883,
            "TD-03": 614,
        },
    }

    def test_counts_match_measured_values(self):
        for name, expected in self.EXPECTED.items():
            path = DECISIONS / name
            with self.subTest(doc=name):
                self.assertTrue(path.is_file(), f"missing decisions doc: {path}")
                self.assertEqual(dict(rc.count_file(str(path))), expected)


if __name__ == "__main__":
    unittest.main()
