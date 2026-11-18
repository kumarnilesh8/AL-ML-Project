# Agent Override Review
[Agent: Curator Claire]

## 1. Re-evaluation of Agent Profiles

After a critical review of the remaining Regnology agent profiles and a comparison with the built-in Spec-Kitty profiles, we have shifted our migration strategy away from direct agent profile overrides.

### Shift from Overrides to Tactic/Styleguide Augmentation
The following agent profiles do not possess a sufficiently significant delta from the built-in Kitty defaults to warrant full profile overrides:
- **Python Pedro (`python-pedro`)**
- **Java Jenny (`java-jenny`)**
- **Planning Priti (`planning-priti`)**

**New Strategy:** Instead of migrating these as separate agent profiles or overriding the existing ones, the Regnology-specific elements (e.g., AppSec toolchain knowledge, specific testing conventions, specialized linters) will be decomposed into focused tactics, styleguides, and toolguides. These atomic elements will be added to the DRG and automatically applied to the built-in profiles via the `org-charter`, preserving the Spec-Kitty defaults while injecting Regnology constraints where needed.

### Deprecation of Manager Mike
- **Manager Mike (`manager-mike`)** is entirely deprecated. 
- The responsibilities of workflow routing, delegation, and multi-agent coordination originally assigned to Manager Mike have been wholly subsumed by the native Spec-Kitty mission runtime.
- The artifact `pack/agent_profiles/manager-mike.agent.yaml` has been deleted.

## 2. File-Based Orchestration Procedures

The legacy file-based orchestration mechanisms—specifically the reliance on `docs/planning/` and `work/collaboration/` for task routing—are no longer relevant as standing governance.

**Migration Script Requirement:**
While the procedures themselves will not be migrated into the pack, historical engagement data in these formats must be preserved. A dedicated migration script will be developed to:
- Parse legacy `docs/planning/` and `work/collaboration/` directories.
- Retrofit these artifacts into a baseline Spec-Kitty overview (`spec` + `plan`).
- Ensure traceability is maintained, feeding the recovered context directly into `docs/architecture` or the appropriate Spec-Kitty artifacts.

These strategic updates have been reflected in `docs/pack-migration-plan.md`.