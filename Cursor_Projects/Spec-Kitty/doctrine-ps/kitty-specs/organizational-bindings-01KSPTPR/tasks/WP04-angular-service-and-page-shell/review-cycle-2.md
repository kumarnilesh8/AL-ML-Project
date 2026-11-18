---
affected_files: []
cycle_number: 2
mission_slug: organizational-bindings-01KSPTPR
reproduction_command:
reviewed_at: '2026-05-28T12:15:59Z'
reviewer_agent: unknown
verdict: approved
wp_id: WP04
review_artifact_override_at: "2026-05-28T12:21:39Z"
review_artifact_override_actor: "operator"
review_artifact_override_wp_id: "WP04"
review_artifact_override_reason: "Cycle 2 approved: amber badge uses var(--rn-amber-dark), orphan banner uses rn-alert class. Build failure is pre-existing on base branch. All acceptance criteria met."
---

# WP04 Review — Cycle 1

**Verdict**: Changes requested
**Reviewer**: code-reviewer-cindy
**Date**: 2026-05-28

---

## Issue 1 (BLOCKING) — Hardcoded hex in `styles.scss` `.rn-badge--amber`

**File**: `tools/pack-dashboard/src/styles.scss`

**What is wrong**: `.rn-badge--amber` uses a bare hex color value for `color`:

```scss
.rn-badge--amber {
  background: rgba(196, 122, 0, 0.1);
  color: #C47A00;          // ← hardcoded hex — violates SCSS criterion
  border: 1px solid rgba(196, 122, 0, 0.3);
}
```

The sibling variants `.rn-badge--green` and `.rn-badge--petrol` correctly wrap
their foreground color in a CSS custom property with a fallback:

```scss
color: var(--rn-green-dark, #06A74E);
color: var(--rn-petrol-blue, #012D3F);
```

**Required fix**: Wrap the amber foreground in the same pattern:

```scss
.rn-badge--amber {
  background: rgba(196, 122, 0, 0.1);
  color: var(--rn-amber-dark, #C47A00);
  border: 1px solid rgba(196, 122, 0, 0.3);
}
```

---

## Issue 2 (ADVISORY) — Orphan banner bypasses design-system class

**File**: `tools/pack-dashboard/src/app/pages/org-bindings/org-bindings.component.ts`

**What is wrong**: The WP spec template specifies `class="rn-alert rn-alert--warning"` for the
orphan banner. The implementation replaces this with a fully inline-styled `<div>` using
hardcoded rgba colours:

```html
<div style="margin: 16px 0; padding: 12px 16px; border-radius: 4px;
            background: rgba(216, 59, 1, 0.08); border: 1px solid rgba(216, 59, 1, 0.3);">
```

If `rn-alert` / `rn-alert--warning` are provided by the corporate CSS import
(`assets/css/regnology-web.css`), the design-system class must be used instead
of custom inline styles. Check the corporate CSS for those selectors and switch
to them if they exist:

```html
<div class="rn-alert rn-alert--warning" style="margin: 16px 0;">
```

If the classes genuinely do not exist in the corporate CSS, add a brief comment
explaining the fallback and raise a follow-up to align with the design-system team.

---

## Passed Criteria (for reference)

- `models/org-binding.model.ts`: `OrgBinding`, `RaciRole`, `RACI_BADGE_VARIANT`, `RACI_LABELS` — ✅
- `services/org-bindings.service.ts`: `list()`, `create()`, `update()`, `remove()` for `/api/org-bindings` — ✅
- `pages/org-bindings/org-bindings.component.ts` exists as standalone Angular component — ✅
- Component loads bindings, displays card grid, filters by `?domain=` query param — ✅
- `orphaned: true` entries show `rn-badge--danger` badge — ✅
- Route `/org-bindings` lazy-loaded in `app.routes.ts` — ✅
- Sidebar "Organisational Bindings" nav item added — ✅
- No `font-weight: bold` in new SCSS additions — ✅
- No out-of-scope file changes (styles.scss RACI badge additions are within scope) — ✅
- Build failure (`assets/css/regnology-web.css` not found) is **pre-existing** on the mission base
  branch — not a WP04 regression ✅
