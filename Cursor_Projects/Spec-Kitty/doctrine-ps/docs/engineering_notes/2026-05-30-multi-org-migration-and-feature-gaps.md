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

# Engineering Note: Multi-Org Charter Packs, Migration Path, and Feature Gaps

_Version: 1.0.0_
_Date: 2026-05-30_
_Author: Stijn Dejongh / Architect Alphonso (Claude Sonnet 4.6)_
_Status: Advisory — no implementation committed_

---

## Context

This note was commissioned after the `dashboard-governance-config-01KST1YF` mission (domain
CRUD + org charter management) completed. Three questions were posed from an architectural
perspective:

1. How to support multiple charter packs for different organizations.
2. How users migrate from the old doctrine stack (on `main`) to the spec-kitty version — 
   with minimal manual actions, ideally a single install command pulling from Regnology
   Artefactory.
3. Whether any feature gaps are worth addressing now.

The analysis draws on the current pack layout (`pack/`), the HOW_TO_USE guide, the
`dist/scripts/` distribution artifacts, and the existing engineering notes from the
`overhaul/migrate_to_kitty` branch.

---

## 1. Multi-Org Charter Pack Support

### 1.1 Problem statement

The current `pack/org-charter.yaml` encodes a single organizational policy:

```yaml
org_name: regnology-default
required_directives: [REGNOLOGY_BRANDING, MODEL_DISCIPLINE, APPSEC_COMPLIANCE, …]
interview_defaults:
  model_tier: mid
  branding: regnology-default
```

When a single Regnology PS engagement spans multiple client organizations, or when different
practice areas within Regnology have divergent governance policies (e.g., banking vs.
public sector), this single-policy model breaks down. Two failure modes:

- **Conflicting required directives**: Org A mandates `APPSEC_COMPLIANCE` + `GDPR_HANDLING`;
  org B mandates `APPSEC_COMPLIANCE` + `SWIFT_CSP`. A shared pack cannot satisfy both
  without one org's required directives silently applying to the other.
- **Divergent interview defaults**: Model tier, branding, or Jira instance vary per org.

### 1.2 Spec-kitty's current capability

The `.kittify/config.yaml` `packs:` list already supports stacking multiple pack directories:

```yaml
doctrine:
  org:
    packs:
      - name: regnology-default
        local_path: ~/.regnology/doctrine-pack/pack
      - name: client-acme
        local_path: ~/.regnology/client-acme-pack/pack
```

Each pack can contribute artifacts. The `DoctrineService` loader merges contributions by
artifact ID; later-listed packs override earlier ones. **The `org-charter.yaml` conflict
resolution across packs is not yet specified in the loader.** This is the primary gap.

### 1.3 Recommended architecture

Three patterns are viable; choose based on the organizational relationship:

#### Pattern A — Layered packs (recommended for Regnology PS)

Maintain a **base org pack** (`regnology-default`) that holds stable governance applicable
across all engagements, and per-engagement or per-practice-area **overlay packs** that add
or override specific directives:

```
regnology-default (base)          regnology-banking (overlay)
  org-charter.yaml                  org-charter.yaml
    required_directives:              required_directives:
      - REGNOLOGY_BRANDING               + SWIFT_CSP
      - MODEL_DISCIPLINE                 + GDPR_HANDLING
      - APPSEC_COMPLIANCE              interview_defaults:
                                         branding: regnology-banking
```

The overlay pack's `org-charter.yaml` uses an `extends:` key (not yet in spec-kitty's
charter schema) to merge with the base rather than replace it:

```yaml
# regnology-banking/org-charter.yaml
org_name: regnology-banking
extends: regnology-default
required_directives:
  - SWIFT_CSP
  - GDPR_HANDLING
interview_defaults:
  branding: regnology-banking
```

**This requires a spec-kitty change**: `org-charter.yaml` must support `extends:` with
additive merge semantics for `required_directives` and override semantics for
`interview_defaults`. A spec-kitty issue should be filed requesting this before implementing
overlay packs.

#### Pattern B — Fork per org (viable short-term, costly long-term)

Each org maintains its own copy of the pack repo. `regnology-banking` forks
`regnology-default`, diverges its `org-charter.yaml`, and maintains its additional
directives. Upstream governance changes must be cherry-picked into every fork.

**Trade-off**: Zero spec-kitty dependency, full org isolation. High maintenance overhead
at scale (one fork per client). Suitable for organizations with fundamentally different
governance stacks where base-layer sharing has low value.

#### Pattern C — Project charter overlay only (viable now, limited scope)

For divergences that affect only a single engagement (not a persistent organizational
difference), the project's `.kittify/config.yaml` can reference both the base pack and
a local `doctrine-config/` directory with a project-specific `org-charter.yaml`.
The charter interview merges project-level answers with pack defaults.

**Trade-off**: No new infrastructure. Cannot express org-level required directives —
the charter overlay only sets interview defaults, not the `required_directives` contract.

### 1.4 Recommended near-term action

1. **File a spec-kitty issue** requesting `extends:` support in `org-charter.yaml` for
   additive directive merging (Pattern A prerequisite).
2. **For immediately divergent requirements** (if any engagement needs this now): use
   Pattern B (fork) as a stopgap. Keep the fork shallow — only `org-charter.yaml` and
   truly unique directives.
3. **Defer Pattern A** until the spec-kitty schema change lands.

The `regnology-default` pack is well-positioned to become the base layer because it
already contains only stable, org-wide governance. No refactoring of the existing pack
is needed to adopt Pattern A.

---

## 2. Migration Path from Old Doctrine Stack to Spec-Kitty

### 2.1 The two stacks

| Dimension | Old stack (`main`) | Spec-kitty stack (`overhaul/migrate_to_kitty`) |
|---|---|---|
| Artifact format | Markdown (`.md`) in `doctrine/` | Typed YAML in `pack/` |
| Distribution | Git clone of this repo | `spec-kitty doctrine fetch` |
| Activation | Agent loads files from `doctrine/` directly | `spec-kitty doctor doctrine` validates the loaded pack |
| Engagement setup | Manual: point agents at file paths | `spec-kitty doctrine fetch --pack regnology-default` |
| Governance enforcement | Convention only | Charter synthesis + DRG-driven directive injection |
| Agent profiles | `doctrine/agents/*.agent.md` | `pack/agent_profiles/*.agent.yaml` |
| Dashboard | None | `tools/pack-dashboard/` (Angular + Express) |

### 2.2 Manual steps today

An engineer migrating a Claude Code project from the old stack to the spec-kitty stack
today must:

1. Install spec-kitty ≥ 3.1 (`pip install spec-kitty` or equivalent).
2. Run `spec-kitty init .` in the engagement repo (creates `.kittify/`).
3. Clone the doctrine repo to a shared location: `git clone ... ~/.regnology/doctrine-pack`.
4. Edit `.kittify/config.yaml` to add the `doctrine.org.packs` block with the `local_path`.
5. Run `spec-kitty doctrine fetch --pack regnology-default`.
6. Run `spec-kitty doctor doctrine` to validate the load.
7. Run `spec-kitty charter interview` (answers pre-filled by the pack's `org-charter.yaml`).
8. Run `spec-kitty charter generate` and commit the charter files.

Steps 3–8 require knowledge of the pack's git URL and the `.kittify/` config schema.
For a typical engineer unfamiliar with spec-kitty, this is a 20–30 minute setup with
multiple error-prone manual steps.

### 2.3 Target: single install command

The target UX (given Regnology Artefactory as the distribution channel) is:

```bash
# Bootstrap a new engagement repo with Regnology PS governance in one step:
spec-kitty doctrine install regnology-default \
  --from https://artefactory.regnology.net/artifactory/spec-kitty-packs/regnology-default/latest \
  --auto-charter
```

This command should:
1. Fetch the pack tarball from Artefactory.
2. Unpack to a versioned local cache (`~/.spec-kitty/packs/regnology-default@<version>/`).
3. Write the `doctrine.org.packs` block into `.kittify/config.yaml` pointing at the cache.
4. Run `spec-kitty doctrine fetch` automatically.
5. Run `spec-kitty charter interview` (non-interactive if pack pre-fills cover all required fields).
6. Commit the charter files.

### 2.4 Installer scripts — design and Artefactory layout

Two cross-platform installer scripts are written to `dist/scripts/`:

- `install-regnology-stack.sh` (POSIX shell — Linux / macOS)
- `install-regnology-stack.ps1` (PowerShell 5.1+ — Windows; also works on PS7+)

Both scripts handle the full bootstrap in one invocation:

1. Locate or install Python 3.9+.
2. Create an isolated Python venv at `$INSTALL_DIR/spec-kitty-env/`.
3. Install `spec-kitty` at the requested version via the Artefactory PyPI proxy:
   `<artefactory-url>/pypi-proxy/simple/`.
4. Download the versioned doctrine pack archive from Artefactory:
   `<artefactory-url>/spec-kitty-packs/regnology-default-<version>.tar.gz`.
5. Extract the pack to `$INSTALL_DIR/doctrine/pack/`, verify structure.
6. Write a `spec-kitty` shim to `$INSTALL_DIR/bin/` (Unix: shell wrapper;
   Windows: `.cmd` launcher).
7. Write a `.stack-version` manifest recording installed component versions.

**Default install root**: `~/regnology-agent-stack` (Unix) / `$env:USERPROFILE\regnology-agent-stack` (Windows). Overridable via `--install-dir` or `REGNOLOGY_STACK_DIR`.

**Auth**: Artefactory API token accepted via `--artefactory-token` flag or
`REGNOLOGY_ARTEFACTORY_TOKEN` env var. Unauthenticated download is supported for
Artefactory repos configured with anonymous read access.

**Idempotent**: Re-running updates both spec-kitty (in the existing venv) and the
doctrine pack directory. Charter config in `doctrine/pack/` is replaced; the venv is
reused to avoid full reinstall when only the pack version changes.

**Dry-run mode** (`--dry-run` / `-DryRun`) prints all commands that would be executed
without touching the filesystem.

**Installed directory layout**:

```
~/regnology-agent-stack/
  .stack-version          # YAML: installed_at, spec_kitty_version, pack_version
  bin/
    spec-kitty            # Unix shim → spec-kitty-env/bin/spec-kitty
    spec-kitty.cmd        # Windows launcher → spec-kitty-env\Scripts\spec-kitty.exe
  spec-kitty-env/         # Python venv (managed; do not edit)
  doctrine/
    pack/                 # extracted regnology-default pack
      directives/
      tactics/
      styleguides/
      agent_profiles/
      ...
```

**Required Artefactory layout**:

```
<artefactory-url>/
  pypi-proxy/simple/                                  # PyPI proxy (pip --index-url)
  spec-kitty-packs/
    regnology-default-latest.tar.gz                   # latest alias
    regnology-default-<semver>.tar.gz                 # versioned archive
    regnology-default-<semver>.zip                    # Windows fallback (no tar)
```

Publishing the pack to this layout requires a Jenkinsfile publish stage (one `tar czf`
+ `curl -T` to Artefactory on merge to `main`). The `Jenkinsfile` in this repo already
defines the CI context; the publish stage is additive.

**Developer bootstrap — one command**:

```bash
# Unix:
curl -sSL https://artefactory.regnology.net/artifactory/scripts/install-regnology-stack.sh | sh

# PowerShell (Windows):
iex (iwr https://artefactory.regnology.net/artifactory/scripts/install-regnology-stack.ps1).Content
```

Or download and inspect the script before running — both scripts support `--dry-run`.

---

## 3. Feature Gaps Worth Addressing Now

The following gaps are ordered by impact-to-effort ratio. "Address now" means within the
current branch (`overhaul/migrate_to_kitty`) or as an immediately queued mission.

### 3.1 HIGH PRIORITY — Bootstrap installer scripts ✅ Done

**Gap (resolved)**: The HOW_TO_USE guide documented a 6-step manual process with no
runnable installer.

**What was built**: Two cross-platform installers in `dist/scripts/`:
- `install-regnology-stack.sh` (POSIX shell)
- `install-regnology-stack.ps1` (PowerShell 5.1+)

Both perform the full bootstrap: Python venv creation, spec-kitty install from
Artefactory PyPI proxy, pack archive download and extraction, shim writing, version
manifest. See §2.4 for full design details.

**Remaining action**: Add a Jenkinsfile publish stage to push the pack tarball to
Artefactory on every merge to `main`. Without published archives, the installer
cannot download the pack. Until the Jenkinsfile stage exists, use
`--artefactory-url` pointing at a local server or skip the pack download step and
populate `doctrine/pack/` manually.

### 3.2 HIGH PRIORITY — Retire `doctrine/` directory

**Gap**: `doctrine/` is still present and active. The AGENT_MIGRATION_GUIDANCE says it
will be retired "when batch 3 is complete." Batch 3 (Domain B agent profiles) is the
only remaining blocker.

**Impact**: Any agent that reads `doctrine/` finds stale Markdown originals that may
contradict the migrated YAML artifacts. The dual-source model increases confusion and
maintenance surface.

**Effort**: Medium (batch 3 profile migration itself is the bulk of the work; the
retirement commit is one `git rm doctrine/` after).

**Action**: Complete batch 3 agent profile migrations (8 profiles: analyst-annie,
bootstrap-bill, lexical-larry, manager-mike, scribe-sally, translator-tanya, and the
frontend-freddy and java-jenny overrides). Then delete `doctrine/`.

### 3.3 MEDIUM PRIORITY — Pack dashboard: built-in doctrine visibility

**Gap**: The dashboard currently shows only pack artifacts. The engineer cannot see
spec-kitty's own shipped directives/tactics alongside the pack's. This makes authoring
`enhances` / `overrides` / `specializes_from` relationships error-prone — the engineer
cannot visually confirm the target artifact exists in the built-in layer.

**Impact**: Every new artifact author must mentally hold two catalogs. The DRG fragment
(`pack/drg/fragment.yaml`) has 33 nodes and 68 edges many of which point at built-in
targets.

**Effort**: Medium. The backend needs a new `/api/builtin-artifacts` endpoint that reads
from the spec-kitty shipped artifacts path; the frontend needs a read-only section on
the artifact list and detail pages. This was planned in the 2026-05-21 engineering note
but scoped out of the dashboard mission.

**Action**: Create a new spec-kitty mission for this feature area if the dashboard is
being actively developed.

### 3.4 MEDIUM PRIORITY — DRG visualizer

**Gap**: The DRG fragment has 68 edges but no visual rendering. Understanding the
governance graph requires manual inspection of `pack/drg/fragment.yaml`.

**Impact**: New team members cannot understand which directives affect which profiles
without reading the YAML graph manually. Architecture reviews and governance audits
are slower.

**Effort**: Medium. The pack dashboard is an Angular app with Express backend. A
`/api/drg` endpoint + a D3.js or Cytoscape.js graph component on a `/drg` route
is a bounded feature.

**Action**: Queue as a dashboard mission after built-in doctrine visibility lands
(the two share the backend artifact-loading infrastructure).

### 3.5 LOW PRIORITY — Multi-org charter extension (Pattern A)

**Gap**: As described in §1. The `extends:` key in `org-charter.yaml` does not exist.

**Impact**: Low today — Regnology PS has one org policy. Becomes high if a practice-area
split or a client-specific governance divergence is needed.

**Effort**: Requires upstream spec-kitty contribution (small schema + loader change).
Low effort for the schema change; medium for the test coverage and release coordination.

**Action**: File a spec-kitty issue with the proposed `extends:` semantics from §1.3
(Pattern A). Deferred until a concrete multi-org use case materializes.

### 3.6 MEDIUM PRIORITY — Jenkinsfile publish stage (Artefactory pack release)

**Gap**: The installer scripts are written, but the pack is not yet published to
Artefactory as a versioned archive. Without the publish stage, the installers cannot
download the pack.

**Impact**: Medium — the installers are blocked until archives exist at the expected
Artefactory path.

**Effort**: Small. The `Jenkinsfile` already defines the CI context. Add a `publish`
stage:

```groovy
stage('Publish Pack') {
    when { branch 'main' }
    steps {
        sh """
            PACK_VERSION=\$(cat pack/.pack-version)
            tar czf regnology-default-\${PACK_VERSION}.tar.gz -C pack .
            curl -H "X-JFrog-Art-Api: \${ARTEFACTORY_TOKEN}" \\
                 -T regnology-default-\${PACK_VERSION}.tar.gz \\
                 "\${ARTEFACTORY_URL}/spec-kitty-packs/regnology-default-\${PACK_VERSION}.tar.gz"
            # Also publish as latest alias
            curl -H "X-JFrog-Art-Api: \${ARTEFACTORY_TOKEN}" \\
                 -T regnology-default-\${PACK_VERSION}.tar.gz \\
                 "\${ARTEFACTORY_URL}/spec-kitty-packs/regnology-default-latest.tar.gz"
        """
    }
}
```

**Action**: Add a `pack/.pack-version` file tracking the current pack semantic version,
then add the publish stage to `Jenkinsfile`.

---

## Summary and Recommended Action Sequence

| # | Action | Effort | Status |
|---|---|---|---|
| 1 | ~~Write installer scripts (`install-regnology-stack.sh` / `.ps1`)~~ | Small | ✅ Done |
| 2 | ~~File spec-kitty issue for `org-charter.yaml extends:`~~ | Small | ✅ Done ([#1397](https://github.com/Priivacy-ai/spec-kitty/issues/1397), sub of #1111) |
| 3 | Add Jenkinsfile publish stage (pack → Artefactory) | Small | NOW |
| 4 | Complete batch 3 agent profile migrations | Medium | NOW |
| 5 | Retire `doctrine/` after batch 3 | Small (after #4) | NOW |
| 6 | Dashboard: built-in doctrine visibility | Medium | NEXT MISSION |
| 7 | Dashboard: DRG visualizer | Medium | AFTER #6 |

The single most valuable improvement (given the stated goal of minimizing manual setup
actions) is the bootstrap script. It costs two hours and eliminates the most friction
point for new engagement leads.

Batch 3 completion should follow immediately — it clears the `doctrine/` retirement
blocker and resolves the dual-source confusion before it compounds.
