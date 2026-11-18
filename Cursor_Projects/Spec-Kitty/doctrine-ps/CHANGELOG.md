# Changelog

All notable changes to the Regnology PS doctrine pack are documented here.

---

## [Unreleased] — overhaul/migrate_to_kitty

### Added / Changed (2026-07-09 — Gemini/Georgia generation doctrine systematized; MIGRATION-2967)

- **Why** — improvements prototyped on the `infosec-idris` chatbot in `regnology-ps-chatbots`
  needed to become systematic upstream so every generated Gemini agent benefits and the changes
  survive regeneration (VERSION_GOVERNANCE).
- **What** —
  - `pack/agent_profiles/gemini-bot-georgia.agent.yaml`: Georgia now authors, per generated agent,
    a fenced "Connectors and tools" section (a general web-search tool such as `google_search` may
    only source official references, never answer grounded-domain substance — APPSEC_COMPLIANCE),
    a "Knowledge base overview" manifest with provenance/licence attribution, a "Recommended model"
    line sourced from a single authoritative mapping (MODEL_DISCIPLINE), and a curated on-scope
    "Suggested starter prompts" set. New capabilities + `gemini-chatbot-authoring` styleguide ref.
  - `pack/templates/gemini/instructions.template.md` + `set-up-guide.template.md`: optional
    Connectors-and-tools / Knowledge-base-overview / Suggested-starter-prompts sections, a
    Recommended-model step, a starter-prompts configuration step, standardized `connector://<name>`
    / `tool://<name>` link syntax, and grounding-strictness-vs-tool-access guidance.
  - New `pack/templates/gemini/model-recommendation.map.yaml` — single source for the recommended
    model line (references the `agentic-model-leaderboard` toolguide; no per-file tier duplication).
  - New `pack/styleguides/gemini-chatbot-authoring.styleguide.yaml` — best-practices contract,
    wired into the DRG (`gemini-bot-georgia --applies--> gemini-chatbot-authoring`).
- **Folded-in cleanup (2026-07-09 consistency squad)** — purged the `backend-benny` phantom from
  `devops-danny` / `powershell-peter` / `sqlx-specialist-simon`, `config/artifact-tags.yaml`,
  `docs/OVERVIEW.md`, and the `tools/compile-drg.py` allowlist; removed the duplicate
  `datamodel-darren --specializes_from--> analyst-annie` DRG edge; collapsed the duplicate
  `powershell-conventions` tag key; dropped the stale `shell-scripts` tag; wired the orphan
  `cloud-native-domain-modelling` paradigm node; corrected the `docs/OVERVIEW.md` agent roster;
  recompiled the graph.
- **For Whom** — maintainers of `doctrine-ps` and, after re-pin, every generated chatbot in
  `regnology-ps-chatbots`.
- **Follow-ups** — FR-011: re-pin the updated `regnology-default` pack into `regnology-ps-chatbots`
  and regenerate agents (cross-repo, VERSION_GOVERNANCE) — dependent, not delivered on this branch.
  Note: `make validate-layered` is currently blocked by *pre-existing* cross-layer duplication
  conflicts (`AD_HOC_PROMPT_CAPTURE` directive, `migrate-doctrine-to-pack` procedure exist in both
  layers) unrelated to this mission; standalone `validate-pack` shows 0 schema errors (only
  by-design cross-layer dangles).

### Removed (2026-07-09 — MIGRATION-3007 layered decommission of duplicate overlay artifacts)

- **Why** — `make validate-layered` aborted during assembly because the PS overlay still carried
  local copies of `AD_HOC_PROMPT_CAPTURE` and `migrate-doctrine-to-pack`, both already promoted to
  the `regnology-all-company` parent pack.
- **What** — removed local `pack/directives/050-ad-hoc-prompt-capture.directive.yaml` and
  `pack/procedures/migrate-doctrine-to-pack.procedure.yaml` after byte-identical verification
  against `.kittify/doctrine-cache/doctrine-org/pack/`; deleted their local review sidecars;
  dropped both local DRG node declarations and their outbound edges while retaining inbound
  `receptionist-rob` references so they resolve cross-layer via inheritance; reconciled stale
  references in `AGENTS.md`, `config/artifact-tags.yaml`, `docs/pack-migration-plan.md`, and fixed
  dead links in `pack/templates/coordination/README.md`; recompiled
  `pack/drg/ps-agent-enabled-factory.graph.yaml`.
- **For Whom** — maintainers and downstream teams: layered assembly no longer fails on these
  duplicate IDs, and governance resolves the two artifacts from the parent baseline as intended.

### Removed (2026-07-07 — diagram-daisy, slidedeck-stanislav promoted to All-Company; decommissioned from PS overlay)

- **Why** — `diagram-daisy` and `slidedeck-stanislav` have no remaining PS-specific dependencies
  (all resolve via org/built-in targets), so both were promoted to the `regnology-all-company`
  baseline as migration PR #6.
- **What** — removed `pack/agent_profiles/diagram-daisy.agent.yaml` and
  `pack/agent_profiles/slidedeck-stanislav.agent.yaml`. In `pack/drg/fragment.yaml`, dropped the
  two nodes and their now-org outbound edges, retaining the inbound child→parent edge
  `receptionist-rob → slidedeck-stanislav` (suggests); relocated the standing PR #1 downward edge
  `comms-cleo → slidedeck-stanislav` up into the org fragment (both endpoints now org — net −1
  downward edges in this PS fragment). Corrected the now-stale "Golden rule preserved" footer in
  `docs/pack-migration-plan.md`, which still listed the relocated `comms-cleo → slidedeck-stanislav`
  edge as declared in this fragment. Reconciled `config/artifact-tags.yaml` and
  `tests/test_pack_schema_validation.py`; recompiled `pack/drg/ps-agent-enabled-factory.graph.yaml`.
  Also corrected `docs/installation/HOW_TO_USE.md`'s agent-profile-count table, which had drifted
  out of sync with the actual local roster across several earlier promotions (was listing 11 names
  including agents promoted away long before this PR; now lists the true 6 remaining local
  profiles: `datamodel-darren`, `devops-danny`, `gemini-bot-georgia`, `powershell-peter`,
  `receptionist-rob`, `sqlx-specialist-simon`).
- **For Whom** — maintainers and downstream teams; the two-layer stack now inherits `diagram-daisy`
  and `slidedeck-stanislav` from the All-Company baseline. Ships as migration PR #6. Note: the
  compiled graph's `receptionist-rob → slidedeck-stanislav` edge resolves to
  `agent_profile:slidedeck-stanislav` now that the local `.doctrine-cache/doctrine-org` snapshot
  carries the paired org-side promotion.

### Removed (2026-07-07 — minutes-maker-mahad and the minutes cluster promoted to All-Company; decommissioned from PS overlay)

- **Why** — `minutes-maker-mahad` and its locked minutes cluster have no remaining PS-specific
  dependencies, so both were promoted to the `regnology-all-company` baseline as migration PR #5.
- **What** — removed `pack/agent_profiles/minutes-maker-mahad.agent.yaml`,
  `pack/procedures/meeting-minutes-pipeline.procedure.yaml`,
  `pack/styleguides/meeting-minutes-format.styleguide.yaml`,
  `pack/toolguides/confluence-minutes-publisher.toolguide.yaml` (+ `.md`),
  `pack/paradigms/extract-then-publish-separation.paradigm.yaml`, and the
  `minutes-stand-alone`/`meeting-minutes-action-item-attribution` directives. In
  `pack/drg/fragment.yaml`, dropped the 7 nodes and their 22 now-org edges, retaining the inbound
  child→parent edge `receptionist-rob → minutes-maker-mahad` (suggests); the two minutes
  directives (`MINUTES_STAND_ALONE`, `ACTION_ITEM_ATTRIBUTION`) stay listed in
  `pack/org-charter.yaml required_directives` and now resolve via inheritance from the parent
  (enforcement unchanged) — that file needed no edit. Recompiled
  `pack/drg/ps-agent-enabled-factory.graph.yaml`.
- **For Whom** — maintainers and downstream teams; the two-layer stack now inherits
  `minutes-maker-mahad` and the minutes cluster from the All-Company baseline. Ships as
  migration PR #5.

### Removed (2026-07-07 — lexical-larry promoted to All-Company; decommissioned from PS overlay)

- **Why** — `lexical-larry` and its exclusive `language-first-architecture` paradigm have no
  PS-specific dependencies left (remaining deps already upstream via PR #2 or built-in), so both
  were promoted to the `regnology-all-company` baseline as migration PR #4.
- **What** — removed `pack/agent_profiles/lexical-larry.agent.yaml` and
  `pack/paradigms/language-first-architecture.paradigm.yaml`. In `pack/drg/fragment.yaml`, dropped
  the two nodes and all of `lexical-larry`'s outbound edges — no inbound child→parent edges or
  downward edges existed for this agent, so nothing needed to be retained locally. This also
  removes both copies of a pre-existing duplicate `lexical-larry → analyst-annie` edge from this
  fragment; see `docs/pack-migration-plan.md` row #4 for the org-side dedup/design-review outcome.
  Reconciled `config/artifact-tags.yaml` and `tests/test_pack_schema_validation.py`; recompiled
  `pack/drg/ps-agent-enabled-factory.graph.yaml`. Dropped the stale `Lexical Larry` row from
  `docs/OVERVIEW.md`'s "Governance and language" agent table.
- **For Whom** — maintainers and downstream teams; the two-layer stack now inherits
  `lexical-larry` from the All-Company baseline. Ships as migration PR #4.

### Removed (2026-07-07 — scribe-sally, synthesizer-sam promoted to All-Company; decommissioned from PS overlay)

- **Why** — `scribe-sally` and `synthesizer-sam` have no PS-specific dependencies left (all were
  already promoted upstream via the comms-cleo migration or are built-in), so they were promoted
  to the `regnology-all-company` baseline as migration PR #3; the PS overlay no longer needs to
  carry the profiles themselves.
- **What** — removed `pack/agent_profiles/scribe-sally.agent.yaml` and
  `pack/agent_profiles/synthesizer-sam.agent.yaml`. In `pack/drg/fragment.yaml`, dropped the two
  nodes and their now-org outbound edges while retaining the inbound child→parent edges
  (`minutes-maker-mahad → scribe-sally` specializes_from, `gemini-bot-georgia → synthesizer-sam`
  delegates_to); relocated the built-in `doctrine-daphne → synthesizer-sam` edge to the org
  fragment. Reconciled `config/artifact-tags.yaml`, `tests/test_pack_schema_validation.py`, and
  `docs/pack-migration-plan.md`; recompiled `pack/drg/ps-agent-enabled-factory.graph.yaml`. Also
  dropped the two agents from the `docs/installation/HOW_TO_USE.md` agent-profile-count table and
  the `.kittify/glossaries/team_domain.yaml` ownership note, both of which still named them as
  PS-local.
- **For Whom** — maintainers and downstream teams; the two-layer stack now inherits `scribe-sally`
  and `synthesizer-sam` from the All-Company baseline. Ships as migration PR #3.

### Fixed (2026-07-07 — structural documentation drift and stale Georgia repointing)

- **Why** — `AGENTS.md`, `CLAUDE.md`, and `pack/README.md` described repository structure,
  toolguide paths, and a directive catalogue that no longer matched what exists on disk.
  Separately, the `gemini-bot-georgia` agent profile and its six output templates still
  described a retired local `gemini-agents/` directory as Georgia's generation target,
  when that deliverable was extracted to a new dedicated repository,
  `regnology-ps-chatbots`, on 2026-07-03.
- **What** — mission `doctrine-ps-structural-alignment-01KWVM5C` (three work packages):
  corrected structural doc drift in `AGENTS.md`/`CLAUDE.md`/`README.md` (WP01); repointed
  `gemini-bot-georgia.agent.yaml` and `pack/templates/gemini/*` at the
  `regnology-ps-chatbots` repository's actual layout, including a schema-flexible
  description of the front-door/navigator roster fields (`managed: repo|external`,
  `navigator` as a standalone agent or a front-door sub-agent path) so the profile
  doesn't go stale again the next time that roster's shape changes (WP02); and added
  `tools/lint-doc-paths.py`, a lightweight lint script that scans named documentation
  references for dangling on-disk paths so this class of drift is caught automatically
  going forward, scoped per FR-001 through FR-008 and FR-013 with an authorized
  `SCAN_EXCLUDE_PREFIXES`/`SCAN_EXCLUDE_FILES` mechanism for frozen/historical documents
  (WP03).
- **For Whom** — maintainers and downstream teams: the three doctrine-stack entry points
  now match the on-disk repository; Georgia-generated Gemini agent artifacts point at the
  correct upstream repository and layout; and `tools/lint-doc-paths.py` gives CI a repeatable
  check against the same class of drift that originated this mission. See
  `kitty-specs/doctrine-ps-structural-alignment-01KWVM5C/` for the full spec, plan, and
  acceptance evidence.

### Fixed (2026-07-06 — `.kittify/config.yaml` pointed at the wrong All-Company upstream repo)

- **Why** — an investigation squad (Architect Alphonso + Doctrine Daphne lenses) found that
  `regnology-all-company` was wired to `rfg/skills.git`, a repository whose `org-charter.yaml`
  is byte-identical to the intended one but which has **no `pack/agent_profiles/` directory at
  all** — it was never populated. The actively-maintained pack (comms-cleo, juno-mcp, the June-19
  slim-PS-pack promotion, etc.) lives in `raf/doctrine-org.git` instead, which was never
  referenced by this repo. This meant the same-day comms-cleo decommission below removed local
  artifacts on the premise they were now available upstream, when in fact nothing this repo
  actually fetched from carried them.
- **What** — repointed `.kittify/config.yaml`'s `regnology-all-company` source to
  `raf/doctrine-org.git` (`local_path: .doctrine-cache/doctrine-org`); updated
  `pack/org-charter.yaml`'s header comment to the corrected upstream URL; removed a dangling
  `activations:` entry for `lexical-style-diagnostic` (a tactic promoted upstream the same day,
  no longer present under `ps-agent-enabled-factory`). See DDR-018 and DDR-019 (2026-07-06
  updates) for the full investigation record.
- **For Whom** — maintainers and downstream teams: `spec-kitty doctrine fetch --pack
  regnology-all-company` now returns 62 artifacts (was 0), and `make validate-layered
  BASE_PACK_DIR=.doctrine-cache/doctrine-org/pack` reports 0 errors/0 advisories on a standalone
  dev machine — the comms-cleo/juno-mcp/lexical-style-diagnostic promotion below is confirmed
  genuinely resolvable, not just resolvable-in-theory. The previously-committed
  `pack/drg/ps-agent-enabled-factory.graph.yaml` needed no changes — it was already compiled
  correctly against the right content, only this repo's fetch config was wrong.

### Removed (2026-07-06 — comms-cleo promoted to All-Company; decommissioned from PS overlay)

- **Why** — `comms-cleo` and its genuine dependencies are broadly reusable, so they were promoted
  up to the `regnology-all-company` baseline; the PS overlay no longer needs to carry them.
- **What** — removed `pack/agent_profiles/comms-cleo.agent.yaml`,
  `pack/toolguides/juno-mcp.toolguide.yaml` (+ `juno-mcp.md`),
  `pack/tactics/lexical-style-diagnostic.tactic.yaml`, and `pack/templates/audience/**`. In
  `pack/drg/fragment.yaml`, dropped the three promoted nodes and `comms-cleo`'s now-org outbound
  edges while retaining the inbound child→parent edges (`synthesizer-sam`, `scribe-sally`,
  `receptionist-rob`, `gemini-bot-georgia`; `analyst-annie` / `datamodel-darren` /
  `juno-based-regulatory-research` → `juno-mcp`) and the single retained downward edge
  `comms-cleo → slidedeck-stanislav`. `juno-mcp` stays in `pack/org-charter.yaml`
  `required_toolguides` (now resolved via inheritance from the parent). Reconciled
  `config/artifact-tags.yaml`, `tests/test_pack_schema_validation.py`, and
  `docs/pack-migration-plan.md`; recompiled `pack/drg/ps-agent-enabled-factory.graph.yaml`.
- **For Whom** — maintainers and downstream teams; the two-layer stack now inherits `comms-cleo`
  from the All-Company baseline. Ships together with the `doctrine-org` promotion as migration
  PR #1. Merged-tree layered validation: 0 errors.

### Changed (2026-06-19 — PR framing, rollout closure, and reviewer handoff)

- **Why** — complete the PS departmental doctrine migration as a reviewable rollout unit so
  consumers can adopt a stable two-layer stack (`regnology-all-company` baseline + PS overlay)
  with clear operational traceability.
- **What** — finalized mission implementation/review evidence for
  `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1`, including acceptance matrix
  closure, layered installer parity checks, occurrence-map governance, and generated-surface
  relocation guidance.
- **For Whom** — maintainers and contributors in Regnology PS and downstream engagement teams who
  install, review, and operate the `ps-agent-enabled-factory` doctrine pack.

### Changed (2026-06-18 — slug normalization, layering, and generated surfaces)

- **Pack slug normalization** — the Professional Services departmental pack now uses the
  canonical slug `ps-agent-enabled-factory` for active installation, charter, and consumer
  configuration paths. The former slug `regnology-default` remains a migration reference only.
- **`pack/org-charter.yaml`** — declared `extends: regnology-all-company` so this PS departmental
  pack layers on the upstream All-Company doctrine and charter baseline (additive merge tracked in
  spec-kitty issue #1397).
- **Installer layering/parity updates** — consumer setup guidance now uses
  `ps-agent-enabled-factory` for Artefactory artifacts, installed pack directories, and
  `spec-kitty doctrine fetch --pack` commands across the active Unix, PowerShell, and manual
  fallback paths.
- **Generated surface cleanup policy** — operational references now use local workspace-relative
  report paths instead of active `ai-initiatives` programme paths; historical notes may retain the
  old path when they are archival context rather than current operator guidance.

### Changed (2026-06-17 — departmental rename + All-Company layering)

- **Renamed** the repository's human-facing name to **Professional Services Departmental Agent
  Doctrine**.
- **`README.md` / `pack/README.md`** — documented the departmental layering, linked the upstream
  All-Company layer ([`RFG/skills`](https://bitbucket.regnology.net/projects/RFG/repos/skills)),
  and corrected the Spec Kitty URL to `https://github.com/Priivacy-ai/spec-kitty`.

### Added (2026-06-03 — DRG naming fix + compilation automation)

- **`tools/compile-drg.py`** — new script that compiles `pack/drg/fragment.yaml` into `pack/drg/regnology-default.graph.yaml` using the `doctrine` Python API (`load_org_pack` + `_bridge_org_node_to_drg_node` + `_bridge_org_edge_to_drg_edge`). Edges are deduplicated and cross-layer targets resolved against the built-in graph. Run: `python3 tools/compile-drg.py` or `make compile-drg`.
- **`pack/drg/regnology-default.graph.yaml`** — compiled DRG graph, correctly named to match the `*.graph.yaml` glob used by `pack_assembler.py` and `pack_validator.py`. Replaces the old `pack/drg/graph.yaml` which was invisible to the assembler/validator.
- **`Jenkinsfile` — Compile DRG Graph stage** — new CI stage before `Package` that runs `python3 tools/compile-drg.py` to ensure the distributed tarball always contains a fresh, validated DRG graph.
- **`Makefile`** — new makefile with targets: `compile-drg`, `check-drg-fresh`, `validate-pack`. `check-drg-fresh` fails with an actionable message when `fragment.yaml` is newer than the compiled graph.
- **`.cursor/hooks.json`** — new Cursor hook config (replaces a broken symlink) wiring `check-drg-fresh.sh` as a pre-tool-call advisory.
- **`.cursor/hooks/check-drg-fresh.sh`** — hook script that detects a staged `fragment.yaml` with a stale compiled graph and emits a warning.

### Changed (2026-06-03 — DRG naming fix + compilation automation)

- **`pack/drg/fragment.yaml`** — added two missing paradigm nodes (`client-data-storage`, `cloud-native-domain-modelling`) that were referenced as edge targets but not declared; fixed an invalid `ATDD` edge target to `acceptance-test-first`; added collision-suppression `enhances` edges for the 4 artifacts that shadow spec-kitty built-ins (`context-boundary-inference`, `secure-design-checklist`, `java-conventions`, `python-conventions`). This, combined with the upstream fork validator fix, achieves `pack validate` → 0 errors, 0 advisories.
- **Upstream fork patch** — `specify_cli/doctrine/pack_validator.py` field-based intent pass now checks DRG fragment edges as a fallback for kinds where FR-028 retired inline `enhances`/`overrides` fields (tactics, styleguides). Fixes an inconsistency introduced by the FR-028 hard cutover.

### Removed (2026-06-03 — DRG naming fix + compilation automation)

- **`pack/drg/graph.yaml`** — deleted; replaced by the correctly-named `regnology-default.graph.yaml`.

### Removed (2026-06-03 — FR-028 pack repair)

- **`pack/agent_profiles/frontend-freddy.agent.yaml`** — deleted (CHANGELOG 2026-05-22 decision executed). SK built-in Freddy is used as-is; DRG augmentation edges (REGNOLOGY_BRANDING, APPSEC_COMPLIANCE, TRACEABLE_DECISIONS, CORPORATE_TOOLING, regnology-branding, regnology-docgen) remain in `drg/fragment.yaml`.
- **`pack/agent_profiles/java-jenny.agent.yaml`** — same; deleted. DRG augmentation edges (maven-project-compliance-setup, version-control-hygiene, java-conventions, APPSEC_COMPLIANCE) remain.
- **`pack/drg/fragment.yaml` (pack node)** — removed `frontend-freddy` pack node entry (body_path was pointing at the now-deleted profile).

### Changed (2026-06-03 — FR-028 pack repair)

- **All 9 pack profiles** — removed `specializes-from:` inline field (FR-028 hard cutover, spec-kitty rc35/PR #1625). Lineage is now authored as DRG `specializes_from` edges in `drg/fragment.yaml`. Affected: comms-cleo, datamodel-darren, devops-danny, diagram-daisy, lexical-larry, scribe-sally, slidedeck-stanislav, sqlx-specialist-simon, synthesizer-sam.
- **analyst-annie, datamodel-darren, sqlx-specialist-simon** — removed `tools:` top-level block (not part of AgentProfile schema). Tool references are already in `context-sources.toolguides`.
- **`pack/drg/fragment.yaml`** — replaced non-canonical relations: `related_to` → `suggests` (2 edges), `performs` → `applies` (3 edges), `uses` → `applies` (1 edge). Added `specializes_from` lineage edges for all 9 affected profiles. Added DRG enhancement edges for built-in `debugger-debbie` and `paula-patterns` (TRACEABLE_DECISIONS, ENSURE_CONCEPTUAL_ALIGNMENT). Expanded `java-jenny` augmentation (java-conventions, APPSEC_COMPLIANCE).
- **Deployed pack** (`_config/packs/regnology-default/`) — synced via rsync to match corrected source.

### Added (2026-05-22 — late session)

- **`pack/org-charter.yaml`** — added profile override policy comment explaining when
  pack override profiles are warranted vs. DRG-mediated augmentation

### Removed (2026-05-22 — late session)

- **`pack/agent_profiles/frontend-freddy.agent.yaml`** — redundant override; the delta
  (REGNOLOGY_BRANDING directive + brand CSS token names) is fully covered by the
  `regnology-branding` styleguide and org-charter `required_directives`. The SK built-in
  profile carries a richer self-review protocol and collaboration contract that the
  override was silently losing.
- **`pack/agent_profiles/java-jenny.agent.yaml`** — same pattern; the AppSec toolchain
  delta (sonar.regnology.net, SpotBugs+FindSecBugs, DependencyTrack, CycloneDX SBOM)
  is fully specified in `APPSEC_COMPLIANCE` directive and `maven-project-compliance-setup`
  tactic. The SK built-in is now wired to those artifacts via DRG edges.

### Changed (2026-05-22 — late session)

- **`pack/drg/fragment.yaml`** — removed `frontend-freddy` and `java-jenny` pack nodes
  and their edges; replaced with DRG edges from the SK built-in profile IDs to the
  pack artifacts that carry the Regnology governance delta (`REGNOLOGY_BRANDING`,
  `APPSEC_COMPLIANCE`, `CORPORATE_TOOLING`, `regnology-branding`, `maven-project-compliance-setup`,
  `version-control-hygiene`)
- **`docs/artifact-tags.yaml`** — removed `frontend-freddy` and `java-jenny` entries

---

### Added (2026-05-22)

- **`pack/procedures/gcloud-proxy-setup.procedure.yaml`** — reusable 7-step procedure for
  authenticating and running a `gcloud run services proxy` session; referenced by
  `google-cloud-mcp` toolguide
- **`docs/maintenance/keep-aligned.md`** — upstream tracking checklist for
  `regnology-mcp`, `google-cloud-mcp`, and `sqlx-mcp` toolguides
- **`.kittify/glossaries/`** — four scope-layered glossary seed files:
  `spec_kitty_core.yaml`, `team_domain.yaml`, `audience_domain.yaml`, `mission_local.yaml`
- **`.kittify/memory/templates/RIPGREP_FALLBACK.md`** — persistent agent guidance on
  `ripgrep` preference and fallback protocol when `rg` is unavailable
- **`docs/engineering_notes/2026-05-22-dashboard-drg-curator-session.md`** — full
  transcript of today's session with rationale for all changes (this note)

### Changed (2026-05-22)

- **`pack/toolguides/google-cloud-mcp.toolguide.yaml`** — added explicit scope declaration
  (data model knowledge only, not SQLX generation); references `sqlx-mcp` and the
  `gcloud-proxy-setup` procedure; updated `last_updated`
- **`pack/toolguides/sqlx-mcp.toolguide.yaml`** — added scope declaration (generation,
  optimization, debugging); added fallback reference to `resources/sqlx/` bundled knowledge
  base; references `google-cloud-mcp`
- **`pack/toolguides/ripgrep.toolguide.yaml`** — added concrete usage examples, common
  pitfalls section, and explicit fallback guidance when `rg` is unavailable
- **`pack/toolguides/regnology-mcp.toolguide.yaml`** — added Bitbucket source URL and
  "capability drift" notice (instructs agents to periodically compare against upstream)
- **`pack/drg/fragment.yaml`** — ~80 new edges across two passes:
  - _DDD/decision-making pass_: `bounded-context-linguistic-discovery`, `language-first-architecture`,
    `living-glossary-practice`, `evidence-based-requirements`, `decision-first-development`,
    `traceability-chain-pattern` linked to their execution tactics and governing directives
  - _Curatorial pass_: agent→directive, agent→tactic, agent→styleguide, agent→paradigm,
    procedure→procedure, and paradigm→toolguide gaps filled for all pack artifacts;
    SK built-in override/enhances/refines edges for `frontend-freddy`, `java-jenny`,
    `TEST_FIRST_BUG_FIXING`, and the three shadowing tactics
- **`docs/artifact-tags.yaml`** — domain tag corrections for 8 artifacts; added missing
  entry for `gcloud-proxy-setup`
- **`pack/agent_profiles/frontend-freddy.agent.yaml`** — added `overrides: frontend-freddy`
  (machine-readable SK built-in override declaration)
- **`pack/agent_profiles/java-jenny.agent.yaml`** — added `overrides: java-jenny`
- **`pack/procedures/migrate-doctrine-to-pack.procedure.yaml`** — removed hard reference
  to `TO_BE_REMOVED/doctrine/`; replaced with neutral wording
- **`README.md`** — added "Spec Kitty domain model and doctrine pack structure" section:
  artifact kinds table, self-learning mechanisms, behaviour/knowledge/capability domain
  definitions, organisation-wide ownership model
- **`tools/pack-dashboard/`** — two defect fixes:
  - Removed broken YAML editor from artifact detail view (dead code, broken rendering)
  - DRG route now merges SK built-in nodes into its response so the Related Artifacts
    panel resolves edges that target built-in artifacts; built-in entries are badged and
    route to `/artifacts/builtin/:kind/:id`

### Fixed (2026-05-22)

- **Dashboard review status** — artifact detail header now refreshes the review status
  badge after a review is submitted without requiring a page reload
  (`onReviewSubmitted()` reloads artifact data on `(reviewSubmitted)` event)

---

### Added (earlier — overhaul/migrate_to_kitty)

- **`pack/` — full spec-kitty org doctrine pack** (74 YAML artifacts across 7 kinds)
  - 10 directives (identity, governance, security, tooling, branding)
  - 18 agent profiles (all Regnology PS specialist personas)
  - 17 tactics (DevSecOps, architecture, delivery, communications, quality)
  - 8 styleguides (engineering, communications, tooling, brand-alignment)
  - 7 paradigms (DDD, architecture, governance, delivery)
  - 4 procedures (branding, governance, migration)
  - 5 toolguides (MCP servers, leaderboard, ripgrep)
- **`pack/org-charter.yaml`** — 8 required directives, model-tier governance policy
- **`pack/drg/fragment.yaml`** — additive DRG graph for all pack artifacts
- **`pack/templates/`** — supporting templates distributed with the pack:
  - `architecture/` — ADR, design vision, technical design, roadmap, user journey
  - `diagramming/` — PlantUML/Mermaid themes, C4 examples, render scripts
  - `documents/pdf/` — branded PDF generation templates (fallback; canonical: regnology-docgen)
  - `presentations/reveal-js/` — branded Reveal.js slide deck (fallback; canonical: regnology-docgen)
  - `project/` — CHANGELOG, VISION, README project scaffolding
  - `architecture/`, `documentation/`, `tickets/`, `ci/`, `branding/`, `license/`, `security/`, `lexical/`, `coordination/`, `audience/` (pre-existing)
- **`docs/artifact-tags.yaml`** — domain classification for all 74 pack artifacts
- **`tools/pack-dashboard/`** — Angular 18 + Express governance dashboard UI
  - Kind-list and kind-detail pages with domain filtering
  - Built-in doctrine scanner (reads from `SPEC_KITTY_SRC`)
  - DRG graph visualisation
  - Doctrine overview page

### Changed

- **`TO_BE_REMOVED/`** — all deprecated Markdown originals and legacy output consolidated here
  - `doctrine/` — original Markdown doctrine (superseded by `pack/` YAML)
  - `docs/diagrams/`, `docs/specifications/`, `output/` — legacy artefacts

### Removed (from active tree)

- Legacy file-based orchestration templates (`agent-tasks/`, `automation/`, `schemas/`, `prompts/`, `structure/`)
  superseded by spec-kitty worktrees and skills

---

## Notes

- **Canonical branding source**: [regnology-docgen](https://bitbucket.regnology.net/projects/CONS/repos/regnology-docgen)
  — `pack/templates/branding/`, `pack/templates/documents/pdf/`, and `pack/templates/presentations/` are fallback copies.
- Install the pack: `spec-kitty doctrine fetch --pack ps-agent-enabled-factory`
- Validate the pack: `spec-kitty doctrine pack validate pack/`
