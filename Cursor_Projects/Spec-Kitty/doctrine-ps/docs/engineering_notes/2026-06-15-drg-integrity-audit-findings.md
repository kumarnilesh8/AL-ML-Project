<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Engineering Note: DRG Integrity Audit Findings — 2026-06-15

_Version: 1.1.0_
_Date: 2026-06-15 (updated 2026-06-22)_
_Author: Stijn Dejongh / Claude (kitty squad — Annie, Cindy, Claire on Sonnet 4.6; aggregation on Opus 4.8)_
_Status: Partially resolved — F1 fixed upstream (spec-kitty PR #2081 / issue #2079, pending release + version bump); F2 resolved 2026-06-22 (manager-mike removed outright). F3/F4/F5 remain open backlog. Original 2026-06-15 audit changed no code._
_Audience: Doctrine pack maintainers (this repo)_

---

## Context

A "refresh and validate" operation was run on the pack via a parallel sub-agent squad
(Analyst Annie — toolchain; Code Reviewer Cindy — cross-reference integrity; Curator Claire —
structural/metadata integrity). The headline result is green:

- `make check-drg-fresh` → up-to-date
- `make compile-drg` → 110 nodes / 345 edges
- `spec-kitty doctrine pack validate pack/` → **0 errors, 0 advisories**

However, the deeper audits surfaced integrity issues that the official pack validator does **not**
detect. All findings below were independently re-verified before logging. No pack artifacts or
tooling were modified this session (per VERSION_GOVERNANCE; deferral chosen by the human-in-charge).

These items pre-date and are independent of PR #19 (the rc44 invariant-collision fix).

---

## 1. Findings

| ID | Sev | Area | Summary | Status |
|----|-----|------|---------|--------|
| F1 | MAJOR | upstream `doctrine.drg.merge` | `refines` edge relation is lost during compilation | **Fixed upstream** — PR #2081 / issue #2079; pending release + version bump |
| F2 | MAJOR | `pack/drg/fragment.yaml` | Dangling DRG `body_path` to deleted `manager-mike` profile | **Resolved 2026-06-22** — manager-mike removed outright |
| F3 | MINOR | pack body files | Stale references to pre-rename artifact ids/paths | Open backlog |
| F4 | MINOR | `tools/compile-drg.py` | Non-deterministic `generated_at` timestamp breaks diff-based CI checks | Open backlog |
| F5 | MINOR | `pack/drg/fragment.yaml` | 5 duplicate edges silently de-duplicated by the compiler | Open backlog |

---

### F1 — MAJOR — `refines` relation dropped in compilation

The fragment declares 4 edges with `relation: refines`, but **zero** `refines` relations survive
in the generated `pack/drg/regnology-default.graph.yaml` — they are remapped to `applies`. The
semantic distinction ("this pack artifact refines/narrows a built-in" vs "applies a directive")
is lost for downstream consumers.

- Affected source edges: `pack/drg/fragment.yaml` lines 1766, 1975, 1985, 2093.
- Verification: `rg -c "relation: refines"` → fragment 4, generated graph 0.

**Proposed fix:** Add `refines` to the relation passthrough/allowlist in `tools/compile-drg.py`
(or its DRG relation enum mapping) and regenerate. Add a regression check that every distinct
relation present in the fragment also appears in the generated graph.

> **Update 2026-06-22 — fixed upstream (not a local `compile-drg.py` change).** Root cause was in
> the Spec Kitty library bridge `doctrine.drg.merge._bridge_org_edge_to_drg_edge`, which aliased
> `refines → Relation.APPLIES` (an inert, non-traversable sink). Logged as
> [issue #2079](https://github.com/Priivacy-ai/spec-kitty/issues/2079) and fixed in
> [PR #2081](https://github.com/Priivacy-ai/spec-kitty/pull/2081): `refines` is now a first-class
> `Relation.REFINES`, added to `REFERENCE_RELATIONS` (traversable), with an invariant forbidding any
> alias from mapping to `APPLIES`. **Action when a fixed Spec Kitty release ships:** bump the pinned
> spec-kitty version and recompile. The graph file is now
> `pack/drg/ps-agent-enabled-factory.graph.yaml`; in the trimmed PS overlay a single `refines` edge
> remains (`onboard-external-agent-to-pack → migrate-doctrine-to-pack`), which will then emit
> `relation: refines` instead of `applies`.

---

### F2 — MAJOR — Dangling `body_path` to deleted `manager-mike` profile

`pack/drg/fragment.yaml` defines node `manager-mike` (line ~364) with
`body_path: agent_profiles/manager-mike.agent.yaml` and 6 dependent edges, but that profile file
was deleted during the doctrine→pack migration (commits f37c6661, c44372af). A consumer resolving
this node's body will 404. The official validator does not check DRG `body_path` existence, so this
passes `spec-kitty doctrine pack validate`.

**Proposed fix (decide one):**
1. Restore `pack/agent_profiles/manager-mike.agent.yaml` if Manager Mike is still part of the catalog; or
2. Remove the `manager-mike` node and its 6 edges from `fragment.yaml` and recompile.

Additionally: add a `body_path`-existence check to the DRG compile/validation step so future
dangling references fail fast.

> **Update 2026-06-22 — resolved (fix option 2).** Manager Mike was deprecated and removed outright
> (functionality replaced by the Spec Kitty orchestration runtime). The `manager-mike` node and its
> 6 edges were deleted from `pack/drg/fragment.yaml`, the `manager-mike` entry removed from
> `config/artifact-tags.yaml` and `sqlx-specialist-simon`'s `works-with`, and all glossary/template
> prose re-attributed to the Spec Kitty orchestration runtime. The graph was recompiled with
> `--base-pack`; layered validation = 0 errors and dangle triage = 0 genuine defects.

---

### F3 — MINOR — Stale pre-rename references in body files

The rc44 rename (`context-boundary-inference` → `regnology-context-boundary-inference`, and the
python/java conventions equivalents) left stale references in non-DRG prose/templates:

- `pack/agent_profiles/lexical-larry.agent.yaml` — prose cites old `context-boundary-inference`.
- `pack/glossary/architecture-ddd/README.md` — 5 `Source:` lines cite old `*.tactic.md`.
- `pack/templates/ci/Jenkinsfile.python.template` and `pack/templates/ci/README.md` — cite old
  `pack/guidelines/{python,java}-conventions.md` paths (also pre-YAML-migration).

**Proposed fix:** Update each reference to the current `regnology-*` ids / `pack/styleguides/*.styleguide.yaml`
paths. Re-verify with a repo-wide search for the four old bare ids.

---

### F4 — MINOR — Non-deterministic `generated_at` timestamp

`tools/compile-drg.py` embeds a wall-clock `generated_at` value, so every `make compile-drg` run
produces a 1-line diff even when the graph is structurally identical. The Makefile `check-drg-fresh`
target is mtime-based and therefore unaffected, but any CI guard using `git diff --exit-code` after
recompiling would false-positive.

**Proposed fix:** Use a deterministic timestamp (e.g. last-commit time of `fragment.yaml`) or exclude
`generated_at` from freshness/diff comparisons.

---

### F5 — MINOR — Duplicate edges silently de-duplicated

The fragment contains 5 duplicate `(source, target, relation)` edges (explaining the 350→345 edge
drop on compile). The compiler de-duplicates silently. Duplicate pairs reported by the audit:
`comms-cleo→AUDIENCE_ORIENTED_WRITING`, `datamodel-darren→analyst-annie`,
`lexical-larry→analyst-annie`, `java-jenny→regnology-java-conventions`,
`receptionist-rob→repository-initialization`.

**Proposed fix:** Remove the duplicate declarations in `fragment.yaml`; optionally have the compiler
warn (not silently swallow) on duplicate edges.

---

## 2. Verified Non-Issues (no action)

- **Agent-profile `schema-version`/`profile-id` keys (hyphenated):** all 14 profiles use this form and
  the validator is green — it is the correct schema dialect for the agent-profile artifact type, not a
  defect. (Raised by Claire; reclassified as non-issue on verification.)
- **`planner-priti` / `architect-alphonso` / `python-pedro` not listed in the fragment header
  cross-layer comment:** documentation gap only; all are genuine spec-kitty built-ins and resolve
  correctly. (Optional: extend the header comment block.)

---

## 3. Recommended Next Steps

1. Triage F1 and F2 as the priority items (latent correctness gaps the validator misses).
2. Bundle F3–F5 as a small cleanup pass.
3. Consider hardening the DRG compile/validate step to cover `body_path` existence and relation
   preservation, so these classes of issue fail fast in CI rather than requiring manual audit.
