---
affected_files: []
cycle_number: 2
mission_slug: organizational-bindings-01KSPTPR
reproduction_command:
reviewed_at: '2026-05-28T13:02:56Z'
reviewer_agent: unknown
verdict: approved
wp_id: WP07
review_artifact_override_at: "2026-05-28T13:15:01Z"
review_artifact_override_actor: "operator"
review_artifact_override_wp_id: "WP07"
review_artifact_override_reason: "Cycle 2 approved: all three blockers resolved. Hex fallbacks removed (var(--rn-amber) no fallback, :host scoped definition acceptable). Server-side files unchanged (empty diffs). angular.json/styles.scss unchanged. TypeScript clean. Frontend UI intact."
---

# WP07 Review Cycle 1 — Feedback

**Reviewer**: code-reviewer-cindy  
**Date**: 2026-05-28  
**Branch**: `kitty/mission-organizational-bindings-01KSPTPR-lane-g`  
**Verdict**: Changes requested

---

## Summary

The core UI feature is correctly implemented: the `primary_domain` picker is present in `domain-chips.component.ts`, constrained to currently-selected domains, auto-clear fires with an inline notice, the star marker (`★`) appears in both the artifact-list and artifact-detail views, and the save path correctly calls `PUT /api/artifact-tags/:id` with `primary_domain` in the body. Three issues must be resolved before approval.

---

## Issue 1 — BLOCKER: Hardcoded hex values in new SCSS

**Criterion violated**: "NO hardcoded hex values in new SCSS"

In `tools/pack-dashboard/src/app/components/domain-chips/domain-chips.component.ts`, the new inline styles contain `#F5A623` as a fallback in two places:

```scss
.dc-primary-star {
  color: var(--rn-amber, #F5A623);  /* ← hardcoded hex */
}
.dc-field-info {
  color: var(--rn-amber, #F5A623);  /* ← hardcoded hex */
}
```

**Fix**: Remove the fallback hex value. The design system CSS defines `--rn-amber`, so the fallback is unnecessary. Use:

```scss
.dc-primary-star {
  color: var(--rn-amber);
}
.dc-field-info {
  color: var(--rn-amber);
}
```

---

## Issue 2 — BLOCKER: Server-side files duplicated with incompatible implementation vs WP01

**Criterion violated**: governance check #7 (shared-file ownership — files modified by this WP that are also modified by another WP must have an explicit coordination note).

WP07's diff modifies both:
- `tools/pack-dashboard/server/src/routes/artifact-tags.routes.ts`
- `tools/pack-dashboard/server/src/services/domain-tags.service.ts`

WP01 (already approved, lane-a) modified these same files with commit `14800b8` ("feat(WP01): introduce getConfigRoot(), migrate domain-config and artifact-tags to config/, add primary_domain support"). The WP07 spec itself states: *"The `PUT /api/artifact-tags/:id` endpoint already accepts `primary_domain` after WP01's T005b."*

The incompatibilities that will cause a merge conflict or regression when WP07 lands after WP01:

1. **`domain-tags.service.ts`**: WP07's version still imports and uses `getDocsRoot()`. WP01 migrated all usages to `getConfigRoot()` (and moved the data files to `config/`). WP07 merging after WP01 would revert the config-root migration, breaking the server at runtime.

2. **`artifact-tags.routes.ts`**: WP01 adds a `PRIMARY_DOMAIN_NOT_IN_DOMAINS` error code and a dedicated HTTP 400 handler for it. WP07's version throws a generic object with `unknownDomains` instead, silently conflicting with WP01's error shape.

3. **`domain-tags.service.ts`**: WP07's `setArtifactTags` throws `{ unknownDomains: [primaryDomain] }` on invalid primary domain. WP01's version throws `{ code: 'PRIMARY_DOMAIN_NOT_IN_DOMAINS', primaryDomain }`.

**Fix**: Remove the server-side changes from this lane entirely. WP01 already delivers the server-side `primary_domain` support. WP07 should only contain frontend/UI changes. Revert `artifact-tags.routes.ts` and `domain-tags.service.ts` to their state on `kitty/mission-organizational-bindings-01KSPTPR`.

---

## Issue 3 — RISK: Out-of-scope changes to `angular.json` and `styles.scss`

**Files affected**:
- `tools/pack-dashboard/angular.json`
- `tools/pack-dashboard/src/styles.scss`

These files are outside WP07's declared `owned_files: tools/pack-dashboard/src/app/components/domain-tags-editor/**` and are not mentioned anywhere in the WP07 task description.

The changes:
- Remove `@import 'assets/css/regnology-web.css'` from `styles.scss` (replaced with a comment)
- Add `src/assets/css/regnology-web.snapshot.css` as a global style in `angular.json`

Both `regnology-web.css` and `regnology-web.snapshot.css` exist in the assets directory. The switch changes *which* design system CSS file is loaded globally — an undocumented behavioural change that affects all components and may differ from the version the design system expects.

**Fix**: Revert `angular.json` and `styles.scss` to their state on `kitty/mission-organizational-bindings-01KSPTPR`. If there is a genuine reason to switch CSS files or change the load mechanism, that change belongs in a separate WP with an explicit rationale and coordination.

---

## Passing Criteria

The following acceptance criteria are met and do not need rework:

- ✅ `primary_domain` picker present in `domain-chips.component.ts` (editable mode)
- ✅ Picker options are populated from `selectedDomainConfigs` (constrained to current selection)
- ✅ `toggleDomain()` auto-clears `localPrimaryDomainId` and shows inline notice when the primary domain tag is removed
- ✅ `(none)` option present at top of the picker
- ✅ Picker change propagates via `onPrimaryDomainIdChange()` → `saveTags()` → `PUT /api/artifact-tags/:id`
- ✅ `★` star marker shown in non-editable chip view when `d.id === primaryDomainId`
- ✅ `artifact-list.component.ts` passes `primaryDomainFor(artifact.id)` to `<app-domain-chips>`
- ✅ `artifact-detail.component.ts` loads `primary_domain` from tags API and binds to picker
- ✅ No `font-weight: bold` in new code
