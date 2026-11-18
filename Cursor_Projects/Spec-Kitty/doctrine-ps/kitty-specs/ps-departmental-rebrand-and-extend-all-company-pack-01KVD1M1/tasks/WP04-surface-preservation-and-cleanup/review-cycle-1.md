**Issue 1: FR-008 documentation is stale after untracking `.cursor/` and `.claude/`.**

WP04 removes the generated harness directories from the git index, but the active repository README still presents them as part of the repository structure and describes `.cursor/` as the live integration surface:

- `README.md` still lists `.cursor/` and `.claude/` in the repository tree.
- `README.md` still says "The `.cursor/` directory translates the pack's governance into Cursor-native artifacts."
- A targeted documentation search found no README/onboarding guidance for regenerating local `.cursor/` / `.claude` harness surfaces from `pack/`; the new evidence note only says future shared canon belongs under `tools/surfaces/`.

This blocks FR-008 / WP04 DoD because the WP requires generated `.cursor` / `.claude` artifacts to stop shipping from git **and** README/onboarding documentation to tell contributors how to regenerate them locally from `pack/`.

Remediation:

1. Update the active README/onboarding surface so it no longer presents `.cursor/` and `.claude/` as versioned repository directories.
2. Add contributor-facing regeneration guidance for local harness surfaces from `pack/`.
3. Re-run the targeted doc search for `.cursor`, `.claude`, `generated`, and `regenerate` over `README.md`, `pack/README.md`, and onboarding docs to prove the user-facing story matches the new generated-surface policy.

**Issue 2: The shared surface-preservation inventory gate was not marked complete with evidence references.**

WP04 subtask T015 requires "Mark inventory verification checks complete with evidence references." The coordination inventory at `kitty-specs/ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1/surface-preservation-inventory.yaml` still contains only the original checklist text and no completion status or evidence references. The lane did add `docs/engineering_notes/2026-06-18-surface-preservation-readiness.md`, but the inventory gate itself remains unmarked.

This blocks the WP04 DoD item: "`surface-preservation-inventory.yaml` readiness gate is fully satisfied."

Remediation:

1. Update the shared inventory artifact with explicit completion/evidence fields or the mission-approved equivalent that marks each verification complete.
2. Reference `docs/engineering_notes/2026-06-18-surface-preservation-readiness.md`, the relocated `tools/surfaces/**` files, the executable-bit check for `tools/surfaces/cursor/hooks/check-drg-fresh.sh`, and the preserved hook dry-run result.
3. Keep the lane/coordination artifact placement consistent with the mission workflow, then resubmit WP04 for review.

Downstream note: WP05 depends on WP04. Because changes are requested, downstream WP05 work should rebase or refresh after WP04 is corrected.
