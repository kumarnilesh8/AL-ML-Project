---
work_package_id: WP05
title: Live YAML Editor
dependencies:
- WP04
requirement_refs:
- FR-004
- FR-005
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T016
- T017
agent: "claude:sonnet:reviewer-rita:reviewer"
shell_pid: "698035"
history:
- agent: general-purpose
  ts_utc: '2026-05-20T14:38:12Z'
  action: created
authoritative_surface: tools/pack-dashboard/src/app/components/yaml-editor/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/components/yaml-editor/**
tags: []
---

# WP05 — Live YAML Editor

## Objective

Replace the static `<pre>` YAML display with a Monaco editor that supports live editing,
saving to disk, and re-validation on save.

## Context

- Monaco Editor is the VS Code editor component, available as `ngx-monaco-editor-v2` for Angular
- The editor should be lazy-loaded to keep initial bundle size down
- After saving, the backend PUT endpoint writes to disk, then triggers validation
- Re-validation result updates the badge in real-time

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target branch: `overhaul/migrate_to_kitty`
- Execution worktrees are allocated per computed lane from `lanes.json`.

## Subtasks

### T016 — Integrate Monaco editor component

`tools/pack-dashboard/src/app/components/yaml-editor/`:
- Install `ngx-monaco-editor-v2` (or `@aspect-build/rules_js` monaco wrapper)
- Create `yaml-editor.component.ts` wrapping the Monaco instance
- Configure: YAML language mode, read-only toggle, theme matching Regnology
- Input: `content: string` (the YAML to display/edit)
- Output: `contentChange: EventEmitter<string>` (on user edit)
- Lazy-load the Monaco module to avoid blocking initial page load

### T017 — Wire editor save to backend

In the artifact-detail page:
- Add "Save" button (`.rn-btn .rn-btn--primary`)
- On click: call `PUT /api/artifacts/:kind/:id` with current editor content
- On success: call `POST /api/validate/:kind/:id`
- Update validation badge with new result
- Show toast/notification for save success/failure
- Disable Save button when content unchanged (dirty tracking)

## Definition of Done

- [ ] Monaco editor renders YAML with syntax highlighting on artifact-detail page
- [ ] User can edit YAML content in the editor
- [ ] Save button calls PUT endpoint and file is updated on disk
- [ ] After save, validation runs and badge updates (green/red)
- [ ] Save button is disabled when no changes exist
- [ ] Editor module is lazy-loaded (not in main bundle)

## Risks

- Monaco bundle is ~2MB — lazy loading mitigates initial load impact
- Monaco CDN vs local: prefer local assets (no external network dependency)

## Activity Log

- 2026-05-20T18:29:41Z – claude:sonnet:implementer-ivan:implementer – shell_pid=693819 – Started implementation via action command
- 2026-05-20T18:33:09Z – claude:sonnet:implementer-ivan:implementer – shell_pid=693819 – Ready for review: YamlEditorComponent (T016) with textarea fallback, artifact-detail updated with validate-before-write save flow (T017), dirty tracking, revert, success/error feedback. TypeScript check passes clean.
- 2026-05-20T18:33:34Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=698035 – Started review via action command
- 2026-05-20T18:39:44Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=698035 – Review passed: validate-before-write (FR-005) correct; all 7 AC met
