# Research: PowerShell Specialist Agent (PowerShell Peter)

**Mission**: `powershell-specialist-agent-01KTP3DG`  
**Date**: 2026-06-09

---

## R-1: Built-in vs pack-native agent

**Decision**: Create a **pack-native** `powershell-peter` agent profile.

**Rationale**: Grep of `pack/drg/fragment.yaml` and spec-kitty built-in references shows
`java-jenny` and `python-pedro` as built-ins augmented by pack styleguides. No
`powershell-*` built-in profile exists. Creating a pack profile is the only v1 path
without an upstream spec-kitty release.

**Alternatives considered**:

- Wait for SK built-in `powershell-peter` then augment — rejected; blocks delivery
- Extend `devops-danny` with PowerShell scope — rejected; violates single-responsibility and spec boundaries

---

## R-2: Styleguide schema template

**Decision**: Model `powershell-conventions.styleguide.yaml` on `java-conventions.styleguide.yaml` and `python-conventions.styleguide.yaml`.

**Rationale**: Same `schema_version: "1.0"`, `scope: code`, `principles[]`, `patterns[]`
with `good_example` / `bad_example`. Proven to pass pack validate.

**Alternatives considered**:

- Freeform markdown styleguide — rejected; not pack-schema valid
- Full primer in styleguide body — rejected; C-004 distill rule

---

## R-3: Tactic granularity (Option B)

**Decision**: Three tactics — module scaffold, Pester workflow, script quality gate.

**Rationale**: Mirrors separation of `maven-project-compliance-setup` (workflow) from
`java-conventions` (rules). Each tactic maps to a distinct user scenario in spec.md.

**Alternatives considered**:

- Single mega-tactic "powershell-development" — rejected; hard to invoke selectively
- Five tactics including InvokeBuild and DSC — rejected; scope creep for v1 (spec defers)

---

## R-4: AppSec baseline (C-001)

**Decision**: Script-level gate in `powershell-script-quality-gate` tactic; CI/Sonar deferred to DevOps Danny.

**Rationale**: `APPSEC_COMPLIANCE` directive in pack targets Maven/Sonar patterns.
PowerShell engagements need explicit script-level controls without forcing Sonar onto
every helper script.

**Alternatives considered**:

- Full Sonar integration in Peter's scope — rejected; duplicates Danny
- No AppSec for PowerShell — rejected; violates org required directives intent

---

## R-5: Companion doc location

**Decision**: `docs/references/powershell-primer.md` with Regnology branding header and author attribution.

**Rationale**: Charter DIR-003 places human-readable documentation in `docs/`. Keeps
pack/ schema-valid YAML lean. Option B from spec Primer Usage Strategy.

**Alternatives considered**:

- `pack/templates/` — rejected; primer is reference not fill-in template
- External Confluence only — rejected; pack consumers need offline/git access

---

## R-6: Domain tagging

**Decision**: Tag new artifacts with domains `tooling` and `engineering`; primary `engineering`.

**Rationale**: Matches `python-conventions` and `java-conventions` tagging pattern in
`config/artifact-tags.yaml`. Peter is a language implementer, not pure DevOps policy.

---

## R-7: DRG compilation workflow

**Decision**: Edit `pack/drg/fragment.yaml`; run `python3 tools/compile-drg.py`; commit both fragment and compiled graph.

**Rationale**: Documented in `pack/toolguides/spec-kitty-doctrine-pack.md`. Dashboard
prefers compiled `graph.yaml` when present.

---

## R-8: Cursor export

**Decision**: Add `.cursor/agents/powershell-peter.md` following existing agent export pattern (e.g. `.cursor/agents/devops-danny.md`).

**Rationale**: FR-011 Should; enables Cursor routing without manual profile discovery.

**Alternatives considered**:

- Profile YAML only — rejected; inconsistent with other pack agents in this repo

---

## R-9: Relationship to POWERSHELL_SYNTAX.md

**Decision**: Peter profile references `.kittify/memory/templates/POWERSHELL_SYNTAX.md` for spec-kitty CLI invocations in PowerShell shells; language conventions stay in `powershell-conventions`.

**Rationale**: FR-012; avoids duplicating bash-vs-pwsh parameter naming for spec-kitty commands vs PowerShell module authoring rules.
