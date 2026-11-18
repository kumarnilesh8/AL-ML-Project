---
work_package_id: WP06
title: Review Workflow
dependencies:
- WP04
requirement_refs:
- FR-008
- FR-009
- FR-010
- FR-011
- FR-013
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T018
- T019
- T020
- T021
- T022
agent: "claude:sonnet:reviewer-rita:reviewer"
shell_pid: "704619"
history:
- agent: general-purpose
  ts_utc: '2026-05-20T14:38:12Z'
  action: created
authoritative_surface: tools/pack-dashboard/server/src/services/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/services/review-store.service.ts
- tools/pack-dashboard/server/src/routes/reviews.routes.ts
- tools/pack-dashboard/server/src/models/review.model.ts
- tools/pack-dashboard/src/app/components/review-panel/**
- tools/pack-dashboard/src/app/services/review.service.ts
- tools/pack-dashboard/src/app/models/review.model.ts
- tools/pack-dashboard/src/app/pages/dashboard/**
tags: []
---

# WP06 — Review Workflow

## Objective

Implement the review-and-approve/reject/changes_requested cycle. Users can submit reviews
with comments, and the results persist as JSON files in `pack/.reviews/` for agent consumption.

## Context

- Review files are JSON stored at `pack/.reviews/<kind>/<artifact_id>.review.json`
- The `.reviews/` directory structure mirrors artifact kinds
- Review statuses: pending, in_review, approved, rejected, changes_requested
- Comments have: line (optional), text, severity (must-fix, should-fix, nit)
- This is the key governance feature — review files are the interface to remediation agents

### Review File Contract (for agent consumption)

```json
{
  "artifact_id": "REGNOLOGY_BRANDING",
  "artifact_kind": "directives",
  "status": "changes_requested",
  "reviewed_at": "2026-05-20T14:00:00Z",
  "reviewer": "stijnd",
  "summary": "Missing examples section, wording needs tightening",
  "comments": [
    { "line": 15, "text": "Add concrete example of header usage", "severity": "must-fix" },
    { "line": null, "text": "Consider adding a 'common mistakes' section", "severity": "nit" }
  ]
}
```

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target branch: `overhaul/migrate_to_kitty`
- Execution worktrees are allocated per computed lane from `lanes.json`.

## Subtasks

### T018 — Implement review-store service

`tools/pack-dashboard/server/src/services/review-store.service.ts`:
- `getReview(kind, id): Review | null` — reads JSON file if exists
- `saveReview(review: Review): void` — writes JSON to `.reviews/<kind>/<id>.review.json`
- `listReviews(): Review[]` — scans all `.reviews/` subdirs
- `getReviewSummary(): ReviewSummary` — counts by status and kind
- Creates directories on write if they don't exist

### T019 — Implement review routes

`tools/pack-dashboard/server/src/routes/reviews.routes.ts`:
- `GET /api/reviews/:kind/:id` — returns review or 404
- `POST /api/reviews/:kind/:id` — accepts ReviewSubmission, saves, returns Review
- `GET /api/reviews/summary` — aggregate counts

### T020 — Build review-panel component

`tools/pack-dashboard/src/app/components/review-panel/`:
- Standalone Angular component used on artifact-detail page
- Shows current review status (or "Not reviewed" if none)
- Form to add comments: text area, severity dropdown, optional line number
- Decision buttons: Approve, Reject, Request Changes
- Summary text area (required before submitting decision)
- Displays existing comments if review already exists

### T021 — Wire review status into artifact-list

- Extend artifact-list table with "Review" column
- Show badge: approved (green), rejected (red), changes_requested (orange), pending (grey)
- Backend: enrich artifact list response with review status from `.reviews/`

### T022 — Build dashboard overview page (FR-011)

`tools/pack-dashboard/src/app/pages/dashboard/`:
- Route: `/` (default landing page)
- Calls `GET /api/reviews/summary` and `GET /api/artifacts`
- Displays summary cards: total artifacts, reviewed, approved, changes_requested, rejected
- Breakdown table per artifact kind: artifact count, validation pass rate, review status counts
- Links from each kind row to the artifact-list page for that kind

## Definition of Done

- [ ] `POST /api/reviews/directives/REGNOLOGY_BRANDING` saves JSON to `pack/.reviews/directives/REGNOLOGY_BRANDING.review.json`
- [ ] `GET /api/reviews/directives/REGNOLOGY_BRANDING` returns the saved review
- [ ] Review panel renders on artifact-detail page with comment form
- [ ] Submitting a review persists to disk and updates the UI
- [ ] Artifact-list shows review status badges for reviewed artifacts
- [ ] `GET /api/reviews/summary` returns correct aggregate counts
- [ ] The `.reviews/` JSON format matches the contract documented above
- [ ] Dashboard page at `/` renders summary cards with correct counts from live API data
- [ ] Each kind row in the dashboard links to `/artifacts/:kind`

## Risks

- File naming: artifact IDs may contain characters invalid in filenames — sanitize
- Concurrent writes: single-user tool so not a real concern, but use atomic write (write tmp + rename)

## Reviewer Guidance

- Verify the JSON file contract matches what the engineering note specifies
- Ensure agents can consume the files (simple JSON parse, no special encoding)
- Check that review status flows correctly through the full stack (backend → API → Angular)

## Activity Log

- 2026-05-20T18:29:46Z – claude:sonnet:implementer-ivan:implementer – shell_pid=694010 – Started implementation via action command
- 2026-05-20T18:39:22Z – claude:sonnet:implementer-ivan:implementer – shell_pid=694010 – Ready for review: review store with atomic writes, /api/reviews-summary before /:kind routing, review panel, dashboard overview, review status in artifact list
- 2026-05-20T18:39:53Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=704619 – Started review via action command
- 2026-05-20T18:41:09Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=704619 – Review passed: all 8 criteria met — route ordering correct, 422 on pending/in_review, no artifact_path in Review, atomic writes, path traversal sanitized, JSON contract exact, dashboard calls both APIs, zero TS errors
