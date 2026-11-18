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

# PS Departmental Rebrand + Extend All-Company Pack

## Mission Context

| Field | Value |
|---|---|
| Mission ID | `01KVD1M1VW8WDSNN96HH098T0R` |
| Mission Slug | `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1` |
| Mission Type | software-dev |
| Target Branch | `beta` |
| Status | In Specification |
| Jira | MIGRATION-1952 (epic: Regnology PS - Agent Stack) |

---

## Intent Summary

The federated doctrine and charter stack now has a dedicated **All-Company layer** —
the upstream `regnology-all-company` pack, sourced from
[`RFG/skills`](https://bitbucket.regnology.net/projects/RFG/repos/skills/browse). This
repository must be repositioned as the **Professional Services departmental layer** that
sits *on top of* that all-company baseline: it inherits and may only add to the
all-company doctrine and charter, never relax it.

This mission performs that repositioning. It rebrands the repository to **Professional
Services Departmental Agent Doctrine**, renames our pack to **`ps-agent-enabled-factory`**,
declares an `extends` relationship to the upstream all-company doctrine and charter packs,
updates the installer so consuming repositories pull the upstream org-wide pack as the
base layer, scrubs internal `ai-initiatives` references from operational/governance files,
and stops shipping generated harness surfaces (`.claude/`, `.cursor/`, …) that each
contributor should regenerate locally.

Primary actor: a doctrine maintainer (Stijn) preparing the PS pack to consume the
all-company layer; downstream actor: an engagement engineer running the installer who
should receive the composed all-company + PS-departmental stack.

Prior art: commit `80b51dfd` on `beta` already performed a partial rebrand (README,
pack/README, `extends: regnology-all-company` in `org-charter.yaml`) while **retaining the
old slug `regnology-default`**. This mission supersedes that partial state by completing
the rename to `ps-agent-enabled-factory` and the remaining scope items.

---

## Scope

**In scope:**

- **Rebrand** the human-facing repository name to *Professional Services Departmental
  Agent Doctrine* across `README.md`, `pack/README.md`, `CHANGELOG.md`, and the
  branding/intro blocks of `AGENTS.md` / `CLAUDE.md`.
- **Pack rename** of our pack identity from `regnology-default` to
  `ps-agent-enabled-factory` in `pack/org-charter.yaml` (`org_name`),
  `.kittify/metadata.yaml`, and every internal cross-reference and distribution path that
  names the slug.
- **Reference the upstream** all-company doctrine and charter packs by linking
  [`RFG/skills`](https://bitbucket.regnology.net/projects/RFG/repos/skills/browse) from
  `README.md` and `pack/README.md`.
- **Extend** the upstream packs: keep/confirm the `extends:` declaration in
  `pack/org-charter.yaml` pointing at the upstream all-company doctrine **and** charter
  pack, with the layering documented (additive, non-relaxing).
- **Update the README** so it states the new name, the departmental-on-all-company
  layering, the upstream link, and an installation flow that pulls the upstream pack.
- **Remove `ai-initiatives` references** from operational and governance files (notably
  the work-log path defaults in `AGENTS.md`), replacing them with neutral, repo-local
  paths.
- **Installer pulls upstream**: `dist/scripts/install-regnology-stack.sh` and `.ps1`
  fetch the upstream `regnology-all-company` pack as the base layer, then this
  departmental pack on top, producing the composed stack.
- **Stop shipping generated harness surfaces**: remove `.claude/` and `.cursor/`
  (and any other generated tool surfaces) from version control, add them to
  `.gitignore`, and document that contributors regenerate them locally from `pack/`.

**Out of scope:**

- Authoring or changing the *content* of the upstream `regnology-all-company` pack (that
  lives in `RFG/skills` and is handled by the all-company layer owners).
- Adding or editing the substance of individual directives/tactics/profiles in this pack
  beyond what the rebrand/rename/extends touch requires.
- Pruning the doctrine set down to a PS-specific subset (a separate curation effort).
- Migrating the historical `docs/engineering_notes/*` dated records (treated as immutable
  history — see Open Questions Q3).
- Publishing the renamed pack to Artifactory / cutting a release (follow-on once the slug
  rename is validated).

---

## Assumptions

1. The upstream all-company pack's canonical identifier is **`regnology-all-company`**
   (the `org_name` set in `RFG/skills/pack/org-charter.yaml`). The existing
   `extends: regnology-all-company` value is therefore correct (see Open Questions Q1).
2. The new pack slug is **`ps-agent-enabled-factory`** — the normalised form of the
   user-specified `ps-agent_enabled-factory` (underscore → hyphen, all lowercase, matching
   the convention of `regnology-default` / `regnology-all-company`). Confirmed 2026-06-18.
3. `.claude/` and `.cursor/` are **generated distribution surfaces** produced from `pack/`
   sources, not hand-authored canon. Any genuinely hand-authored config they contain
   (e.g. `.cursor/hooks.json`, hook scripts) is identified and relocated into `pack/` or a
   tracked source location before the directories are untracked (see Open Questions Q4).
4. The installer's upstream fetch reuses the same Artifactory/distribution mechanism the
   pack already uses; only the source coordinates differ (placeholder until the
   all-company pack is published — see `HANDOVER_CHECKLIST.md` in `RFG/skills`).
5. Distribution continuity: renaming the slug breaks any existing fetch path keyed on
   `regnology-default`; all such references are updated atomically within this mission.

---

## Decision Records

| ID | Decision | Rationale | Alternatives |
|---|---|---|---|
| D-001 | Rename pack slug to `ps-agent-enabled-factory` | User-specified departmental identity; disambiguates the PS layer from the all-company baseline and from the legacy `regnology-default` default-pack name | Keep `regnology-default` (rejected: ambiguous now that an all-company pack exists); `regnology-ps` (not requested) |
| D-002 | Declare `extends:` to `regnology-all-company` (doctrine + charter) | Models the federated stack: departmental layer inherits the all-company charter cumulatively and may only add to it | Vendor/duplicate all-company artifacts locally (rejected: drift, relaxation risk) |
| D-003 | Untrack generated surfaces (`.claude/`, `.cursor/`) and regenerate locally | Generated artifacts are derived from `pack/`; shipping them causes drift, bloated diffs, and per-harness coupling | Keep shipping (rejected: contradicts single-source-of-truth in `pack/`) |
| D-004 | Scrub `ai-initiatives` from operational files only; preserve dated engineering notes | Operational/governance files must be self-contained and free of PS-internal repo coupling; historical notes are an immutable record | Scrub everything incl. history (deferred — Q3) |

---

## User Scenarios & Testing

### Scenario 1 — A maintainer reads the repository identity

**Given** a maintainer opens `README.md` and `pack/README.md`  
**When** they read the title and layering sections  
**Then** the repo is named *Professional Services Departmental Agent Doctrine*, the pack
slug is `ps-agent-enabled-factory`, and the upstream all-company layer
([`RFG/skills`](https://bitbucket.regnology.net/projects/RFG/repos/skills/browse)) is
linked as the layer this pack extends.

### Scenario 2 — Spec-kitty resolves the renamed, extending pack

**Given** the renamed `pack/org-charter.yaml` with `org_name: ps-agent-enabled-factory`
and `extends: regnology-all-company`  
**When** `spec-kitty doctrine pack validate pack/` runs  
**Then** validation reports **0 errors** and the `extends` relationship is recognised (or,
if the schema does not yet support `extends`, the documented caveat applies and validation
still passes).

### Scenario 3 — Engineer installs the composed stack

**Given** a fresh engagement repo  
**When** the engineer runs `dist/scripts/install-regnology-stack.sh`  
**Then** the installer fetches the upstream `regnology-all-company` pack as the base layer
and the `ps-agent-enabled-factory` pack on top, and the resulting doctrine resolves both
layers.

### Scenario 4 — Contributor regenerates harness surfaces locally

**Given** a fresh clone after this mission  
**When** the contributor inspects the working tree  
**Then** `.claude/` and `.cursor/` are absent from version control (gitignored), and the
README/onboarding documents how to regenerate them locally from `pack/`.

### Scenario 5 — Operational files are free of ai-initiatives coupling

**Given** `AGENTS.md` and other governance/operational files  
**When** searched for `ai-initiatives`  
**Then** no operational path references remain; work-log defaults point at repo-local,
neutral paths.

---

## Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-001 | The human-facing repository name reads *Professional Services Departmental Agent Doctrine* in `README.md` (H1), `pack/README.md` (title), `CHANGELOG.md` (entry), and the intro/branding blocks of `AGENTS.md` and `CLAUDE.md`. | Approved | Must |
| FR-002 | `pack/org-charter.yaml` sets `org_name: ps-agent-enabled-factory`; `.kittify/metadata.yaml` and all internal references to the old slug `regnology-default` are updated to `ps-agent-enabled-factory`. | Approved | Must |
| FR-003 | `README.md` and `pack/README.md` link the upstream all-company packs at `https://bitbucket.regnology.net/projects/RFG/repos/skills/browse`. | Approved | Must |
| FR-004 | `pack/org-charter.yaml` declares `extends:` targeting the upstream all-company doctrine + charter pack (`regnology-all-company`), with a comment documenting the additive, non-relaxing layering and the spec-kitty additive-merge caveat (#1397). | Approved | Must |
| FR-005 | `README.md` describes the departmental-on-all-company layering and an installation flow in which the upstream pack is the base layer and this pack extends it. | Approved | Must |
| FR-006 | No `ai-initiatives` reference remains in operational/governance files; `AGENTS.md` work-log path defaults (Directives 014/015) point at repo-local neutral paths (e.g. `reports/logs/...`). | Approved | Must |
| FR-007 | `dist/scripts/install-regnology-stack.sh` and `dist/scripts/install-regnology-stack.ps1` fetch the upstream `regnology-all-company` pack as the base layer before installing `ps-agent-enabled-factory`, using a clearly marked source coordinate (placeholder permitted until upstream is published). | Approved | Must |
| FR-008 | `.claude/` and `.cursor/` (and any other generated tool surfaces) are removed from version control via `git rm -r --cached`, added to `.gitignore`, and `README.md`/onboarding documents local regeneration from `pack/`. | Approved | Must |
| FR-009 | Any hand-authored (non-generated) content currently under `.claude/`/`.cursor/` is identified and relocated into a tracked source location (e.g. `pack/`) before the directories are untracked, so no canon is lost. | Approved | Must |
| FR-010 | `spec-kitty doctrine pack validate pack/` reports 0 errors after the rename and extends changes. | Approved | Must |
| FR-011 | `CHANGELOG.md` records the rename, the `extends` declaration, the installer change, and the surface-untracking under `[Unreleased]`. | Approved | Should |
| FR-012 | A migration note documents the slug change `regnology-default` → `ps-agent-enabled-factory` and its effect on distribution/fetch paths (Artifactory coordinate, installer `PACK_REPO_PATH`). | Approved | Should |

---

## Non-Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| NFR-001 | The installer remains runnable end-to-end (syntax-valid bash and PowerShell); the upstream-fetch step fails loud with a clear message if the source coordinate is an unfilled placeholder. | Approved | Must |
| NFR-002 | No engagement secrets, customer data, or credentials are introduced. | Approved | Must |
| NFR-003 | A maintainer can understand the layering (this pack extends the all-company pack) from the README alone in under 5 minutes. | Approved | Should |
| NFR-004 | The slug rename is atomic within the mission: no committed reference to `regnology-default` remains that would break a fetch. | Approved | Must |

---

## Constraints

| ID | Description | Status | Priority |
|---|---|---|---|
| C-001 | **Branding (Directive 041):** this departmental repo uses Regnology *Professional Services* branding; do not switch it to generic all-company branding. | Approved | Must |
| C-002 | **Non-relaxing extension:** the `extends` relationship must not be used to weaken any directive the upstream all-company charter enforces; the departmental layer may only add. | Approved | Must |
| C-003 | **Atomic rename:** installer, distribution path, metadata, and README references to the slug must change together so no broken fetch path is committed. | Approved | Must |
| C-004 | **No lost canon:** untracking `.claude/`/`.cursor/` must not delete hand-authored content without first relocating it to a tracked source. | Approved | Must |

---

## Success Criteria

1. `README.md`, `pack/README.md`, and pack metadata consistently present the repo as
   *Professional Services Departmental Agent Doctrine* with pack slug
   `ps-agent-enabled-factory`, linking and extending the upstream all-company pack.
2. `spec-kitty doctrine pack validate pack/` reports 0 errors after the rename.
3. A fresh clone shows `.claude/` and `.cursor/` untracked and gitignored, with documented
   local regeneration.
4. `rg -i ai-initiatives` over operational/governance files returns no path-coupling hits.
5. The installer scripts reference the upstream `regnology-all-company` pack as the base
   layer and pass a shell/PowerShell syntax check.

---

## Open Questions

1. **Q1 — Upstream pack name:** ✅ RESOLVED (2026-06-18) — the upstream all-company pack
   identifier is `regnology-all-company`. The `extends:` value is correct as-is.
2. **Q2 — Slug normalisation:** ✅ RESOLVED (2026-06-18) — the pack slug is normalised to
   `ps-agent-enabled-factory` (from `ps-agent_enabled-factory`: underscore → hyphen,
   lowercase). Pack validation (FR-010) will confirm acceptance.
3. **Q3 — ai-initiatives in history:** Confirm scrubbing is limited to operational/
   governance files, leaving dated `docs/engineering_notes/*` historical records intact.
4. **Q4 — Generated vs authored surfaces:** Confirm which `.claude/`/`.cursor/` paths are
   generated (safe to untrack) vs hand-authored (must be relocated into `pack/` first).
