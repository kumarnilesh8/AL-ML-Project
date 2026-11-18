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

# Engineering Note: `enhances` Field Restored — spec-kitty Upgraded to rc27

_Version: 1.0.0_
_Date: 2026-05-26_
_Author: Stijn Dejongh / Cursor Sonnet 4.6_
_Status: Applied — all changes committed and pushed_

---

## Context

During the 2026-05-22 session a known gap was recorded: the tactic and styleguide schemas
did not permit an `enhances:` field, so pack artifacts that intentionally shadow built-in
spec-kitty artifacts were carrying `same_id_collision` advisories that could not be
suppressed declaratively. The workaround was DRG `enhances` edges.

The user confirmed on 2026-05-26 that upstream spec-kitty had shipped the `enhances` field
as part of **WP05 of mission `charter-ux-and-org-pack-vocabulary-01KSAF14`**
(`feat/charter-vocab-and-test-stabilization` branch), and that this work had been merged
into the upstream `main`. This note records the upgrade and the restoration of the
declarative fields.

---

## 1. spec-kitty Fork Upgrade: rc15 → rc27

### Before

The editable install (`pip install -e .`) was tracking the fork's `main` branch at
`bd1ef88d4` (effectively rc15). The `enhances` and `overrides` schema fields were on a
feature branch that had not yet been merged to main.

A prior recovery attempt had switched the checkout to
`feat/charter-vocab-and-test-stabilization` to get access to the field. After the user
confirmed upstream main had landed the changes, the fork was re-aligned to main.

### Steps Taken

```bash
# Fetch upstream (Priivacy-ai/spec-kitty)
git fetch upstream

# Remove two untracked status.json files that would have blocked the merge
rm -f kitty-specs/auth-readiness-from-any-command-01KS7PQZ/status.json \
      kitty-specs/canonical-producer-lint-01KS4XX4/status.json

# Fast-forward merge from upstream/main
git checkout main
git merge upstream/main --ff-only   # bd1ef88d4 → 46532e03b

# Push to origin (personal fork on GitHub)
git push origin main

# Re-install editable package to sync the reported version string
pip install -e .
```

### After

```
spec-kitty-cli version 3.2.0rc27
```

The `enhances` field is now confirmed live at the model level:

```python
from doctrine.tactics.models import Tactic
Tactic.model_fields['enhances']
# annotation=Union[str, NoneType] required=False default=None
# description='ID of a built-in tactic this artifact augments via field-merge.'
```

---

## 2. `enhances` Declarations Restored on 5 Pack Artifacts

The fields had been stripped from the 5 affected artifacts in commit `ec3384e`
(the `datamodel-tools` commit) under the incorrect assumption that the schema had
dropped support for the field. All 5 are now restored.

| Artifact | Kind | Field restored |
|---|---|---|
| `pack/tactics/context-boundary-inference.tactic.yaml` | tactic | `enhances: context-boundary-inference` |
| `pack/tactics/requirements-validation-workflow.tactic.yaml` | tactic | `enhances: requirements-validation-workflow` |
| `pack/tactics/secure-design-checklist.tactic.yaml` | tactic | `enhances: secure-design-checklist` |
| `pack/styleguides/java-conventions.styleguide.yaml` | styleguide | `enhances: java-conventions` |
| `pack/styleguides/python-conventions.styleguide.yaml` | styleguide | `enhances: python-conventions` |

These declarations inform the spec-kitty pack loader that each artifact intentionally
augments (field-merges into) the built-in artifact of the same ID, rather than
accidentally shadowing it.

---

## 3. Pack Validation State

After restoring the `enhances` fields and upgrading to rc27:

```
spec-kitty doctrine pack validate pack/
Pack validation: 0 errors, 0 advisories
```

The 3 persistent `same_id_collision` advisories present since batch 3 are now fully
suppressed.

---

## 4. Closed Known Gap

The known gap recorded in
[2026-05-22-dashboard-drg-curator-session.md §4](./2026-05-22-dashboard-drg-curator-session.md)
is now closed:

> **`enhances:` on tactics** — Tactic schema does not permit extra fields.
> Upstream feature request filed: spec-kitty#1291.

The upstream feature request was resolved as part of WP05 of mission
`charter-ux-and-org-pack-vocabulary-01KSAF14`. The interim workaround (DRG `enhances`
edges) remains in place as it provides additional machine-readable relationship data
beyond the schema-level declaration; no clean-up is needed.

---

## 5. Commits

| Hash | Message |
|---|---|
| `34e7351` | `fix(pack): restore enhances declarations on 5 artifacts after spec-kitty branch update` |
