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
    the gate reported a wall of false MISMATCH;
  - the block-end rule ended a Recommendation at ANY bold line, so a
    Recommendation carrying a bold prose subtitle was measured short on BOTH
    sides: the counts matched, the gate passed, and the lost lines were
    invisible (`msw-foundation/TD-02`, 1295 of 1773 characters);
  - the source side counted pending TDs, which have Recommendation prose but
    no `**Decision:**` and are never emitted by the agents, so a pending TD
    read as a missing key (`social-interactions/TD-09`).

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
        "technical-decisions-fixture-gamma.md": {
            # 3 content lines of 10, 12 and 10 — the middle one a bold prose
            # subtitle that must NOT end the block.
            "fixture-gamma/TD-01": 32,
            # Pending: counted here, dropped by --decided-only.
            "fixture-gamma/TD-02": 5,
            # 5 + the 19-char `**Naocampo:** abcde` line absorbed as body.
            "fixture-gamma/TD-03": 24,
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


class TestBlockEndFieldAllowlist(unittest.TestCase):
    """A Recommendation ends at a KNOWN FIELD, not at any bold line.

    The old rule ended it at any `^**Word`, which measured
    `msw-foundation/TD-02` short on both sides — counts equal, gate green,
    1295 of 1773 characters unmeasured.
    """

    def test_bold_prose_subtitle_stays_in_the_block(self):
        got = count_text(
            "## TD-01: T\n"
            "**Recommendation:** abcde\n"
            "**Quando reabrir esta decisao**\n"
            "fghij\n"
            "**Decision:** A\n"
        )
        # 5 + 31 + 5 — the subtitle line is body, not a terminator.
        self.assertEqual(got["doc/TD-01"], 5 + len("**Quando reabrir esta decisao**") + 5)

    def test_blockquote_line_stays_in_the_block(self):
        got = count_text(
            "## TD-01: T\n**Recommendation:** abcde\n> **Nota.** fghij\n"
            "**Decision:** A\n"
        )
        self.assertEqual(got["doc/TD-01"], 5 + len("> **Nota.** fghij"))

    def test_every_known_field_ends_the_block(self):
        for field in sorted(rc.FIELD_NAMES - {"Recommendation"}):
            with self.subTest(field=field):
                got = count_text(
                    "## TD-01: T\n"
                    "**Recommendation:** abcde\n"
                    f"**{field}:** esta prosa nao pode ser contada\n"
                )
                self.assertEqual(got["doc/TD-01"], 5)

    def test_note_is_a_field_not_prose(self):
        # `Note` sits between Recommendation and Libraries in the assembled
        # context.md; it is a sibling field, so it terminates.
        got = count_text(
            "### prior/TD-02\n**Recommendation:** abcde\n"
            "**Note:** Decision deliberately diverged from the Recommendation\n"
            "**Libraries:** x\n"
        )
        self.assertEqual(got["prior/TD-02"], 5)

    def test_unknown_label_is_absorbed_and_warned(self):
        warnings = []
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "technical-decisions-doc.md"
            path.write_text(
                "## TD-01: T\n**Recommendation:** abcde\n"
                "**Naocampo:** fghij\n**Decision:** A\n",
                encoding="utf-8",
            )
            got = dict(rc.count_file(str(path), warn=warnings.append))
        self.assertEqual(got["doc/TD-01"], 5 + len("**Naocampo:** fghij"))
        self.assertEqual(len(warnings), 1)
        self.assertIn("**Naocampo:**", warnings[0])
        self.assertIn("doc/TD-01", warnings[0])

    def test_known_field_does_not_warn(self):
        warnings = []
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "technical-decisions-doc.md"
            path.write_text(
                "## TD-01: T\n**Recommendation:** abcde\n**Libraries:** x\n",
                encoding="utf-8",
            )
            dict(rc.count_file(str(path), warn=warnings.append))
        self.assertEqual(warnings, [])


class TestDecidedOnly(unittest.TestCase):
    """`--decided-only` restricts the SOURCE side to decided TDs.

    A pending TD carries Recommendation prose with no `**Decision:**`, and
    `decisions-detail-reader` only ever emits decided TDs, so counting the
    pending one made it read as a key the agent had dropped —
    `social-interactions/TD-09` produced exactly that false MISSING.
    """

    DOC = (
        "## TD-01: Decidido\n**Recommendation:** abcde\n**Decision:** A\n---\n"
        "## TD-02: Pending\n**Recommendation:** abcdefghij\n"
        "**Decision:** _[pending]_\n---\n"
        "## TD-03: Decidido em negrito\n**Recommendation:** abc\n"
        "**Decision:** **C (alguma coisa)**\n"
    )

    def _counts(self, **kw):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "technical-decisions-doc.md"
            path.write_text(self.DOC, encoding="utf-8")
            return dict(rc.count_file(str(path), **kw))

    def test_without_the_flag_every_td_is_counted(self):
        self.assertEqual(
            self._counts(),
            {"doc/TD-01": 5, "doc/TD-02": 10, "doc/TD-03": 3},
        )

    def test_with_the_flag_pending_is_dropped(self):
        self.assertEqual(
            self._counts(decided_only=True),
            {"doc/TD-01": 5, "doc/TD-03": 3},
        )

    def test_bolded_decision_value_still_counts_as_decided(self):
        self.assertIn("doc/TD-03", self._counts(decided_only=True))

    def test_records_expose_the_decided_flag(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "technical-decisions-doc.md"
            path.write_text(self.DOC, encoding="utf-8")
            got = {k: d for k, _, d in rc.records(str(path))}
        self.assertEqual(
            got, {"doc/TD-01": True, "doc/TD-02": False, "doc/TD-03": True}
        )

    def test_agent_output_has_no_decision_field_so_the_flag_empties_it(self):
        # The footgun the CLI warns about: agent output and context.md carry no
        # `**Decision:**`, so the flag belongs on the source side only.
        agent = "### slug/TD-01\n**Recommendation:** abcde\n**Libraries:** —\n"
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "agent-output.md"
            path.write_text(agent, encoding="utf-8")
            self.assertEqual(dict(rc.count_file(str(path))), {"slug/TD-01": 5})
            self.assertEqual(
                dict(rc.count_file(str(path), decided_only=True)), {}
            )


class TestSectionScoping(unittest.TestCase):
    """`--section` is what makes the inherited block measurable.

    A context.md holds both `## Decisions Detail` (current scope) and
    `## Inherited Decisions Detail`; the gate compares them against different
    sources, so they must be countable separately.
    """

    FIXTURE = FIXTURES / "context-fixture.md"

    def test_current_scope_section(self):
        self.assertEqual(
            dict(rc.count_file(str(self.FIXTURE), section="Decisions Detail")),
            {"fixture-current/TD-01": 5},
        )

    def test_inherited_section(self):
        self.assertEqual(
            dict(
                rc.count_file(
                    str(self.FIXTURE), section="Inherited Decisions Detail"
                )
            ),
            {"fixture-prior/TD-01": 10, "fixture-prior/TD-02": 3},
        )

    def test_without_a_section_both_land_in_one_namespace(self):
        self.assertEqual(
            dict(rc.count_file(str(self.FIXTURE))),
            {
                "fixture-current/TD-01": 5,
                "fixture-prior/TD-01": 10,
                "fixture-prior/TD-02": 3,
            },
        )

    def test_unknown_section_name_yields_nothing(self):
        self.assertEqual(
            dict(rc.count_file(str(self.FIXTURE), section="Nao Existe")), {}
        )

    def test_a_section_with_no_recommendations_yields_nothing(self):
        self.assertEqual(
            dict(
                rc.count_file(str(self.FIXTURE), section="Testing Requirements")
            ),
            {},
        )


class TestDecidedOnlyAgainstRealDocs(unittest.TestCase):
    """Cross-check mirroring gate 5: the decided-TD count the counter reports
    must equal the `**Decision:** <CAPITAL>` line count in the same doc.

    Fixes no value, so a new TD cannot turn this red.
    """

    RE_DECIDED = re.compile(r"^\*\*Decision:\*\*\s*\*{0,2}[A-Z]")

    def test_decided_count_matches_the_decision_lines(self):
        if not DECISIONS.is_dir():
            self.skipTest(f"no decisions directory at {DECISIONS}")
        docs = sorted(DECISIONS.glob("technical-decisions-*.md"))
        if not docs:
            self.skipTest(f"no decisions docs under {DECISIONS}")
        for path in docs:
            with self.subTest(doc=path.name):
                expected = sum(
                    1
                    for line in path.read_text(encoding="utf-8").splitlines()
                    if self.RE_DECIDED.match(line)
                )
                got = dict(rc.count_file(str(path), decided_only=True))
                self.assertEqual(len(got), expected)


if __name__ == "__main__":
    unittest.main()
