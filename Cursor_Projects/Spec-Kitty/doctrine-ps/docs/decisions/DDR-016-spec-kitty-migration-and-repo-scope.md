# DDR-016: Spec-Kitty as Mission Runtime, Open-Core Contribution Track, and Repository Scope Reduction

**Status:** Accepted  
**Date:** 2026-04-20  
**Author:** Architect Alphonso  
**Related:** DDR-008 (Framework Distribution), DDR-013 (Doctrine-Enabled Team Tooling), DDR-014 (Cursor IDE Distribution)

---

## Context

The `regnology-agent-doctrine` repository has accumulated scope beyond its founding purpose. It originated as a governance layer — a curated doctrine stack (agents, directives, tactics, approaches, glossary) distributable to downstream Regnology repositories. Over time, three additional surface areas accreted:

1. **A web dashboard** (`src/llm_service/dashboard/`) — a Flask-based task portfolio and initiative tracking UI, with a full static frontend, file watcher, spec parser, and task linker. Approximately 14 source files, 23 test files. Confirmed mostly unused in practice.

2. **A distribution system** (`dist/`, `tools/exporters/`) — shell-script-based framework install/upgrade (~1250 lines), multi-format agent exporters (Copilot JSON, OpenCode YAML, Claude Code IR), and an npm-driven deploy pipeline. Partially used.

3. **A release artifact tree** (`output/releases/`) — committed build output for a 1.0.0 release package. Effectively empty (contains only a `.claude/settings.local.json`).

In parallel, the team has adopted **spec-kitty** as the primary mission runtime for structured development work. Spec-kitty already provides: a dashboard (`spec-kitty dashboard`), tracker integration (Jira, Linear, GitHub, GitLab), doctrine loading via `DoctrineService`, agent profile bootstrapping via `spec-kitty init`, and a rich CLI. Maintaining a separate, functionally-overlapping dashboard in this repo creates dual maintenance burden without delivering additional value.

Two strategic directions have also been confirmed:

- **Downstream migration:** All consuming repositories will migrate to spec-kitty as their mission runtime and ad-hoc agent chat platform. The doctrine framework install scripts (`dist/`) become transitional artifacts during this migration window, not permanent infrastructure.
- **Open-core contribution track:** Non-critical, generalisable agent profiles, procedures, and tactics will be contributed upstream to the spec-kitty open-core specification, while Regnology maintains its own curated doctrine layer for proprietary or client-specific governance content.

---

## Decisions

### Decision 1: Spec-Kitty is the designated mission runtime for all downstream repositories

Consuming repositories will use `spec-kitty` for:
- Mission lifecycle management (specify → plan → implement → review)
- Ad-hoc agent chat with profile loading
- Dashboard and initiative tracking
- Tracker integration (Jira via `spec-kitty tracker`)

This repository's role is **doctrine governance and agent profile curation only** — not runtime infrastructure. The `src/llm_service/` layer does not belong here.

**Migration path:** Downstream repos transition via `spec-kitty init` bootstrapping, with `.doctrine-config/` pointer files referencing this repository's `doctrine/` directory as the upstream governance layer (per DDR-003 and DDR-013).

### Decision 2: An open-core contribution track is established alongside a curated internal doctrine layer

Generalisable, non-client-sensitive content from this doctrine stack (agent profiles, generic tactics, approach documents, templates) will be evaluated for upstream contribution to the spec-kitty open-core specification.

**Contribution criteria:**
- Content must be generic enough to be useful outside a Regnology context
- No client-identifying information, internal tooling references, or proprietary methodology
- Contribution is additive — the internal curated version may extend or specialise the upstream

**Two-layer model:**
```
spec-kitty open-core (upstream)
    ↑ contributes generics to
regnology-agent-doctrine/doctrine/ (curated internal layer)
    ↑ referenced by
consuming repositories via .doctrine-config/
```

The internal doctrine layer remains the authoritative source for Regnology-specific content (ABACUS360 mapping agents, Regnology Jira conventions, internal tool references, client-specific directives).

### Decision 3: The dashboard and UI layer are removed

`src/llm_service/dashboard/`, `src/llm_service/ui/`, `src/llm_service/cli.py`, `run_dashboard.py`, and all associated tests are removed.

**Rationale:**
- Confirmed unused in practice
- All capabilities covered by `spec-kitty dashboard` (mission tracking, file watching, portfolio view)
- Maintaining the test suite (23 files, ~1100+ lines of test code) for an unused feature creates false safety signals and CI overhead
- The `spec_parser` and `task_linker` logic that had genuine value both delegate to `src/domain/collaboration/task_schema` — that domain module is retained

**What is not removed:**
- `src/domain/` — domain models for doctrine, specifications, collaboration remain; they are used by `tools/` and agent scripts
- `src/framework/` — config loading, context, orchestration; used by `tools/model_router/` and active tooling
- `src/llm_service/adapters/`, `src/llm_service/config/`, `src/llm_service/telemetry/` — retained; used by the model router and agent execution path
- `src/llm_service/templates/` — config template generation; retained for `config init` tooling

### Decision 4: Distribution scripts are retained as transitional infrastructure

`dist/framework_install.sh` and `dist/framework_upgrade.sh` are retained during the downstream migration window. Once all consuming repositories have completed their spec-kitty migration, these scripts will be archived or removed under a follow-up DDR.

**Review trigger:** Reassess when ≥80% of known consuming repositories have migrated to `spec-kitty init`-based bootstrapping.

### Decision 5: Multi-format exporters are retained selectively

| Exporter | Decision | Rationale |
|---|---|---|
| `tools/exporters/parser.js` + `validator.js` | **Keep** | Agent frontmatter validation — standalone value, no spec-kitty equivalent |
| `tools/exporters/copilot-generator.js` | **Keep** | No spec-kitty equivalent; needed while GitHub Copilot is in use by any team member |
| `tools/exporters/opencode-generator.js` + `opencode-exporter.js` | **Keep** | No spec-kitty equivalent; needed while OpenCode is in use |
| `tools/exporters/claude-code-generator.js` | **Review at next release** | Partially overlaps with spec-kitty's `deploy:claude` path; keep until confirmed redundant |
| `tools/exporters/approach-exporter.js` | **Keep** | Exports approach documents — no equivalent elsewhere |

### Decision 6: Release artifacts are not committed to the repository

`output/releases/` is removed. Release packages are built artifacts and must not be committed to version control. The `build_release_artifact.py` script in `tools/release/` remains as the build mechanism; artifacts are produced on demand and distributed out-of-band.

---

## Consequences

**Immediate:**
- `src/llm_service/dashboard/`, `src/llm_service/ui/`, `src/llm_service/cli.py`, `run_dashboard.py` and all associated tests are deleted
- `output/releases/` is deleted
- Repository test surface reduces by ~23 test files; CI becomes faster and less noisy

**Near-term (migration window):**
- Downstream repositories begin `spec-kitty init` adoption; `dist/` scripts support the transition
- A contribution backlog is created to evaluate which agent profiles and tactics are candidates for open-core submission

**Long-term:**
- `dist/` scripts are retired once downstream migration is complete (tracked separately)
- The repo stabilises as a doctrine-only artefact: `doctrine/`, `src/domain/`, `src/framework/`, `tools/`, `config/`

---

## Alternatives Considered

**Keep the dashboard, activate it:** Rejected. The maintenance cost and conceptual overlap with spec-kitty's own dashboard outweigh the benefit of a second, Regnology-specific UI. Activation would require sustained frontend and backend maintenance that is not prioritised.

**Migrate the dashboard logic into spec-kitty:** Considered for `spec_parser` / `task_linker`. Rejected at this time — spec-kitty already has a more capable tracker integration. The domain logic in `src/domain/collaboration/` that these components use is retained and could serve as input to a future spec-kitty contribution.

**Remove exporters:** Rejected. The Copilot and OpenCode exporters have no spec-kitty equivalent and serve team members not using Cursor. Removing them before tooling consolidation is complete would break those workflows without a replacement path.

---

## References

- DDR-003: Local Doctrine Overrides Boundary
- DDR-008: Framework Distribution and Upgrade Mechanisms
- DDR-013: Doctrine-Enabled Team Tooling
- DDR-014: Cursor IDE Distribution Mechanism
- [spec-kitty dashboard](../docs/links/spec-kitty.md) — `spec-kitty dashboard` command
- [spec-kitty tracker](../docs/links/spec-kitty.md) — `spec-kitty tracker` Jira/Linear integration
