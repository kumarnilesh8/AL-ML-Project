# Juno MCP pack integration (2026-05-22)

## Summary

Integrated the **Juno** read-only MCP server into the `regnology-ps` pack for research- and requirements-oriented agents.

## Artifacts

| Artifact | Path |
|----------|------|
| Toolguide (YAML) | `pack/toolguides/juno-mcp.toolguide.yaml` |
| Toolguide (MD) | `pack/toolguides/juno-mcp.md` |
| Project MCP config | `.cursor/mcp.json` |
| DRG node + `applies` edges | `pack/drg/fragment.yaml` |

## Agents wired (`juno-mcp` applies)

- `analyst-annie` — required `search_product_docs` in profile
- `abacus-mapper-abe` — required alongside google-cloud-mcp
- `synthesizer-sam`
- `comms-cleo`

`researcher-ralph` remains in `TO_BE_REMOVED/`; legacy agent MD updated to reference Juno until pack migration.

## MCP surface

- **Server:** `juno` @ `https://juno-mcp-vjv4ctetga-ey.a.run.app/mcp`
- **Auth:** Okta `CLIENT_ID` in `.cursor/mcp.json`
- **Tool:** `search_product_docs(query, product?, locale?, topK?)`

## Analyst Annie regulatory playbook (2026-05-26)

| Artifact | Path |
|----------|------|
| Toolguide (YAML) | `pack/toolguides/analyst-annie-juno-regulatory-research.toolguide.yaml` |
| Toolguide (MD) | `pack/toolguides/analyst-annie-juno-regulatory-research.md` |

Wired: `analyst-annie` → `applies` → `analyst-annie-juno-regulatory-research` in `pack/drg/fragment.yaml`.

## Smoke tests (manual)

Run in Cursor after reloading MCP:

1. **Product:** `search_product_docs` with `product: Abacus360`, `locale: de`, narrow ABACUS reporting question — expect cited answer.
2. **Regulatory:** EBA/ECB/Bundesbank topic without `product` — expect cited answer or explicit corpus limitation.
3. **Pack:** `spec-kitty doctrine pack validate pack/` — 0 errors.

## Distinction from other MCPs

| MCP | Use |
|-----|-----|
| **juno** | Semantic Q&A + citations (product + regulatory docs) |
| **google-cloud-mcp** | ABACUS360 schema SQL + SQLX manual chapters |
| **regnology-mcp** | Jira, Confluence, Bitbucket, rCloud |
