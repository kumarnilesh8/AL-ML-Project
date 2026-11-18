# Quickstart: Single Command Installer Bootstrap Mission

## Preconditions

- Repository root: `/home/stijn/Documents/_code/CLIENTS/regnology/regnology-agent-doctrine`
- Mission: `single-command-installer-bootstrap-01KVFHX6`
- Branch contract:
  - current branch: `feature/single-command-installer-bootstrap`
  - planning/base: `feature/single-command-installer-bootstrap`
  - merge target: `feature/single-command-installer-bootstrap`

## 1) Confirm mission context

```bash
spec-kitty agent context resolve --mission single-command-installer-bootstrap-01KVFHX6 --json
```

## 2) Validate planning artifacts exist

```bash
ls kitty-specs/single-command-installer-bootstrap-01KVFHX6
```

Expected core files:
- `spec.md`
- `plan.md`
- `research.md`
- `data-model.md`
- `quickstart.md`
- `contracts/installer-bootstrap.contract.yaml`

## 3) Finalize planning phase state

```bash
spec-kitty agent mission setup-plan --mission single-command-installer-bootstrap-01KVFHX6 --json
```

Expected:
- `phase_complete: true`
- `plan_substantive: true`

## 4) Validation commands for implementation phase

```bash
spec-kitty doctrine pack validate pack/
bash -n dist/scripts/install-regnology-stack.sh
pwsh -NoProfile -Command "[void][System.Management.Automation.Language.Parser]::ParseFile('dist/scripts/install-regnology-stack.ps1',[ref]$null,[ref]$null)"
rg -n "release-map.yaml|spec-kitty|regnology-all-company|ps-agent-enabled-factory" config dist/scripts docs/HOW_TO_INSTALL.md Jenkinsfile
```

## 5) Move to task generation

```bash
spec-kitty tasks --mission single-command-installer-bootstrap-01KVFHX6
```
