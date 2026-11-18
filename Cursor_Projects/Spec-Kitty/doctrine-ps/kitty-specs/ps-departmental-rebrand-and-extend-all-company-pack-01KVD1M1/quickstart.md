# Quickstart: Execute the PS pack rebrand mission

## Preconditions

- Repository root: `/home/stijn/Documents/_code/CLIENTS/regnology/regnology-agent-doctrine`
- Mission: `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1`
- Branch contract: current/planning/merge target all `beta`

## 1) Inspect mission context

```bash
spec-kitty agent context resolve --action plan --mission ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1 --json
```

## 2) Confirm plan artifacts are present

```bash
ls kitty-specs/ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1
```

Expected core files:

- `spec.md`
- `plan.md`
- `research.md`
- `data-model.md`
- `quickstart.md`
- `occurrence_map.yaml`
- `surface-preservation-inventory.yaml`
- `contracts/pack-layering-and-distribution.contract.yaml`

## 3) Advance plan phase (auto-commit by setup-plan)

```bash
spec-kitty agent mission setup-plan --mission ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1 --json
```

Expected:

- `phase_complete: true`
- `plan_substantive: true`

## 4) Run implementation breakdown

```bash
spec-kitty tasks --mission ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1
```

## 5) Validation commands for implementation phase

```bash
spec-kitty doctrine pack validate pack/
bash -n dist/scripts/install-regnology-stack.sh
pwsh -NoProfile -Command "[void][System.Management.Automation.Language.Parser]::ParseFile('dist/scripts/install-regnology-stack.ps1',[ref]$null,[ref]$null)"
rg -n "regnology-default|ps-agent_enabled-factory" README.md pack/README.md pack/org-charter.yaml dist/scripts config tools
rg -n "regnology-default" docs/engineering_notes kitty-specs
rg -n "ai-initiatives" AGENTS.md CLAUDE.md README.md pack/ dist/scripts
```

## 6) Layering-semantics evidence checks

```bash
rg -n "^extends:\\s+regnology-all-company$" pack/org-charter.yaml
rg -n "additive|non-relaxing|extends" pack/org-charter.yaml README.md pack/README.md
```

In consumer validation (separate environment), confirm effective charter/doctrine context
includes upstream-required directives plus downstream additions.

## Notes

- The slug to implement is `ps-agent-enabled-factory`.
- Upstream layering target stays `regnology-all-company`.
- `.cursor` and `.claude` are treated as generated surfaces; preserve and relocate
  any non-generated canon before untracking.
- `surface-preservation-inventory.yaml` must be satisfied before untracking generated surfaces.
