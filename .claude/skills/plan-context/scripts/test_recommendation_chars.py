#!/usr/bin/env python3
"""Tests for recommendation-chars.py — the /plan-context gate 5b counter.

Run from anywhere:

    python .claude/skills/plan-context/scripts/test_recommendation_chars.py

The gate these back is what catches `decisions-detail-reader` truncating
Recommendation prose, so a silent miscount here makes the gate pass in false.
Two real defects shaped this suite:

  - the embedded-awk version of the counter could not match the
    `Option A (Name) — ` form that every Recommendation in this project uses,
    so each count came back inflated by the surviving prefix;
  - keying by the bare `TD-NN` collided across documents (TD numbering
    restarts per doc), so a kept set of two docs lost one of its `TD-01`s and
    the gate reported a wall of false MISMATCH.

The golden counts live in `fixtures/`, not in the project's real decisions
docs: a real doc gains TDs as the project moves, and a golden assertion that
goes red for that benign reason trains us to ignore the suite. The real docs
are still exercised, by the tolerant checks in `TestAgainstRealDecisionsDocs`.
"""

import importlib.util
import pathlib
import re
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
FIXTURES = HERE / "fixtures"
REPO_ROOT = HERE.parents[3]
DECISIONS = REPO_ROOT / "docs" / "decisions"

_spec = importlib.util.spec_from_file_location(
    "recommendation_chars", HERE / "recommendation-chars.py"
)
rc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(rc)

# Keys are `{slug}/TD-NN`; the slug is a lowercase kebab-case doc slug.
RE_KEY = re.compile(r"^[a-z0-9-]+/TD-[0-9]+$")


def count_text(text, filename="technical-decisions-doc.md"):
    """Run the counter over `text`, returning {`{slug}/TD-NN`: chars}.

    The temp file is given a real decisions-doc filename so the slug the
    counter derives for source-shaped headings is the stable `doc`.
    """
    with tempfile.TemporaryDirectory() as tmp:
        path = pathlib.Path(tmp) / filename
        path.write_text(text, encoding="utf-8")
        return dict(rc.count_file(str(path)))


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
        return got["doc/TD-01"]

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
        # report more than 4.
        self.assertEqual(
            count_text(
                "## TD-01: T\n**Recommendation:** ção—\n**Decision:** A\n"
            )["doc/TD-01"],
            4,
        )

    def test_newlines_excluded_so_soft_wrap_does_not_register(self):
        wrapped = count_text(
            "## TD-01: T\n**Recommendation:** abc\ndef\nghi\n**Decision:** A\n"
        )
        single = count_text(
            "## TD-01: T\n**Recommendation:** abcdefghi\n**Decision:** A\n"
        )
        self.assertEqual(wrapped["doc/TD-01"], single["doc/TD-01"])
        self.assertEqual(wrapped["doc/TD-01"], 9)

    def test_blank_lines_add_nothing(self):
        self.assertEqual(
            count_text(
                "## TD-01: T\n**Recommendation:** abc\n\n\ndef\n**Decision:** A\n"
            )["doc/TD-01"],
            6,
        )

    def test_block_ends_at_next_bolded_field(self):
        got = count_text(
            "## TD-01: T\n"
            "**Recommendation:** abcde\n"
            "**Decision:** this prose must not be counted\n"
        )
        self.assertEqual(got["doc/TD-01"], 5)

    def test_block_ends_at_horizontal_rule_and_next_td_is_keyed(self):
        got = count_text(
            "## TD-01: T\n**Recommendation:** abcde\n---\n"
            "## TD-02: T\n**Recommendation:** abc\n**Decision:** A\n"
        )
        self.assertEqual(got, {"doc/TD-01": 5, "doc/TD-02": 3})

    def test_recommendation_at_end_of_file_is_emitted(self):
        self.assertEqual(
            count_text("## TD-01: T\n**Recommendation:** abcde\n")["doc/TD-01"], 5
        )


class TestKeying(unittest.TestCase):
    """Both heading shapes key to `{slug}/TD-NN`, each taking the slug from the
    only place it is available on that side."""

    def test_source_heading_takes_slug_from_filename(self):
        self.assertEqual(
            count_text(
                "## TD-07: Titulo\n**Recommendation:** abcde\n",
                filename="technical-decisions-social-interactions.md",
            ),
            {"social-interactions/TD-07": 5},
        )

    def test_agent_heading_takes_slug_from_the_heading(self):
        # The agent's output lands in a scratch file whose name carries no
        # slug, so the heading must win.
        self.assertEqual(
            count_text(
                "### social-interactions/TD-07\n**Recommendation:** abcde\n",
                filename="agent-output.md",
            ),
            {"social-interactions/TD-07": 5},
        )

    def test_both_shapes_produce_the_same_key_and_count(self):
        src = count_text(
            "## TD-07: Titulo\n**Recommendation:** abcde\n",
            filename="technical-decisions-social-interactions.md",
        )
        agent = count_text(
            "### social-interactions/TD-07\n**Recommendation:** abcde\n",
            filename="agent-output.md",
        )
        self.assertEqual(src, agent)

    def test_filename_without_the_project_prefix_falls_back_to_the_stem(self):
        self.assertEqual(
            count_text(
                "## TD-01: T\n**Recommendation:** abcde\n",
                filename="scratch-notes.md",
            ),
            {"scratch-notes/TD-01": 5},
        )

    def test_slug_override_wins_over_the_filename(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "whatever.md"
            path.write_text(
                "## TD-01: T\n**Recommendation:** abcde\n", encoding="utf-8"
            )
            self.assertEqual(
                dict(rc.count_file(str(path), slug="social-interactions")),
                {"social-interactions/TD-01": 5},
            )


class TestSlugCollision(unittest.TestCase):
    """The Phase 06 defect: two kept docs, both numbered from TD-01.

    Keyed by the bare `TD-NN`, the second doc overwrote the first in the
    consumer's dictionary and the gate reported 3 MISMATCH + 3 missing TDs
    against output that was in fact exact.
    """

    ALPHA = FIXTURES / "technical-decisions-fixture-alpha.md"
    BETA = FIXTURES / "technical-decisions-fixture-beta.md"

    def test_same_td_number_in_two_docs_yields_distinct_keys(self):
        merged = dict(rc.count_file(str(self.ALPHA)))
        merged.update(dict(rc.count_file(str(self.BETA))))
        self.assertEqual(
            merged,
            {
                "fixture-alpha/TD-01": 30,
                "fixture-alpha/TD-02": 4,
                "fixture-beta/TD-01": 5,
            },
        )

    def test_merging_the_kept_set_loses_nothing(self):
        pairs = list(rc.count_file(str(self.ALPHA))) + list(
            rc.count_file(str(self.BETA))
        )
        self.assertEqual(len(dict(pairs)), len(pairs))


class TestGoldenFixture(unittest.TestCase):
    """Locks the counter's output against synthetic docs versioned with it.

    The expected numbers are hand-derivable from the fixtures (fixed-length
    runs), and the fixtures only change when someone changes them — so a red
    assertion here means the counter drifted, never that the project gained a
    TD.
    """

    EXPECTED = {
        "technical-decisions-fixture-alpha.md": {
            # `Option A (Name) — ` stripped, then 3 runs of 10 across a soft
            # wrap and a blank line.
            "fixture-alpha/TD-01": 30,
            # `**Option B (Name)** — ` stripped, then "ção—": 4 characters,
            # 7 UTF-8 bytes.
            "fixture-alpha/TD-02": 4,
        },
        "technical-decisions-fixture-beta.md": {
            "fixture-beta/TD-01": 5,
        },
    }

    def test_counts_match_hand_derived_values(self):
        for name, expected in self.EXPECTED.items():
            path = FIXTURES / name
            with self.subTest(fixture=name):
                self.assertTrue(path.is_file(), f"missing fixture: {path}")
                self.assertEqual(dict(rc.count_file(str(path))), expected)


class TestAgainstRealDecisionsDocs(unittest.TestCase):
    """Exercises the counter over the project's real decisions docs without
    fixing any count, so adding a TD to a doc cannot turn this red.

    What is asserted is shape, not size: every doc yields at least one keyed
    Recommendation, every key is `{slug}/TD-NN` carrying that doc's own slug,
    and every count is a positive integer (a zero would mean the counter
    stopped recognising a Recommendation block).
    """

    def _docs(self):
        if not DECISIONS.is_dir():
            self.skipTest(f"no decisions directory at {DECISIONS}")
        docs = sorted(DECISIONS.glob("technical-decisions-*.md"))
        if not docs:
            self.skipTest(f"no decisions docs under {DECISIONS}")
        return docs

    def test_every_doc_yields_well_formed_positive_counts(self):
        for path in self._docs():
            with self.subTest(doc=path.name):
                got = dict(rc.count_file(str(path)))
                slug = rc.slug_for(str(path))
                self.assertTrue(got, f"no Recommendation blocks found in {path.name}")
                for key, chars in got.items():
                    self.assertRegex(key, RE_KEY)
                    self.assertEqual(key.split("/")[0], slug)
                    self.assertIsInstance(chars, int)
                    self.assertGreater(chars, 0)

    def test_keys_are_unique_across_the_whole_decisions_directory(self):
        keys = []
        for path in self._docs():
            keys.extend(key for key, _ in rc.count_file(str(path)))
        duplicates = sorted({k for k in keys if keys.count(k) > 1})
        self.assertEqual(duplicates, [])


if __name__ == "__main__":
    unittest.main()
