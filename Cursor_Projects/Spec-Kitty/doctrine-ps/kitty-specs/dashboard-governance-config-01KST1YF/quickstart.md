# Quickstart: Dashboard Domain & Charter Governance

## Development Setup

```bash
# From repo root — start the dashboard (backend + frontend)
cd tools/pack-dashboard
npm run dev
# Backend: http://localhost:3000
# Frontend: http://localhost:4200
```

## Feature A: Domain Vocabulary

The domain vocabulary panel lives on the Org Bindings page (`/org-bindings`).
Domains are stored in `config/domain-config.yaml`.

```bash
# Verify domain CRUD endpoints
curl http://localhost:3000/api/domain-config
curl -X POST http://localhost:3000/api/domain-config \
  -H "Content-Type: application/json" \
  -d '{"id":"test-domain","label":"Test","description":"A test domain","color":"blue"}'
curl http://localhost:3000/api/domain-config/test-domain/cascade-preview
curl -X DELETE http://localhost:3000/api/domain-config/test-domain
```

## Feature B: Org Charter

Charter state is stored in `config/charter-config.yaml` (created on first write).
Navigate to `/charter` for the charter tab view.

```bash
# Verify charter endpoints
curl http://localhost:3000/api/charter
curl -X POST http://localhost:3000/api/charter \
  -H "Content-Type: application/json" \
  -d '{"artifact_id":"adr-drafting-workflow","artifact_kind":"tactics"}'
curl -X DELETE http://localhost:3000/api/charter/adr-drafting-workflow
```

## Running Tests

```bash
cd tools/pack-dashboard
npx vitest run server/src/services/domain-tags.service.test.ts
npx vitest run server/src/services/domain-cascade.service.test.ts
npx vitest run server/src/services/charter.service.test.ts
```

## Key Constraints Reminder

- Domain IDs are immutable — `PUT /api/domain-config/:id` does not accept an `id` body field.
- Charter config lives in `config/` — never read/write `pack/org-charter.yaml`.
- All YAML writes: `.tmp` file → `fs.renameSync` → target path.
- CSS colours: use `--rn-*` brand tokens; no hex values.
