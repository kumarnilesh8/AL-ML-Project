# Keep Aligned — Upstream Tracking Checklist

Artifacts in this pack that have upstream sources which change independently.
Review this list periodically (suggested: at the start of each new engagement,
or when a contributor reports a missing capability).

---

## regnology-mcp toolguide

**Pack artifact:** `pack/toolguides/regnology-mcp.toolguide.yaml`  
**Upstream source:** https://bitbucket.regnology.net/projects/SKYN/repos/regnology-mcp/browse

### What to check

- [ ] Open the upstream README and compare the listed MCP tools against the `commands`
      list and `summary` in `regnology-mcp.toolguide.yaml`.
- [ ] Look for new integrations that have been added upstream but are not yet documented
      here. Known candidates to watch: SonarQube access, Jenkins pipeline tools,
      additional rCloud endpoints, Bitbucket write operations.
- [ ] Verify that the install instructions in the summary still match the upstream
      setup steps (auth method, mcp.json entry format, server name).
- [ ] Check if any tools listed here have been renamed, deprecated, or removed upstream.

### How to update

1. Add any new commands to the `commands` list in `regnology-mcp.toolguide.yaml`.
2. Update the `summary` to describe new capabilities concisely.
3. Update `last_updated` to today's date.
4. Run `spec-kitty doctrine pack validate pack/` — must pass with 0 errors.
5. Check this item off with the date reviewed, then reset for next cycle.

### Last reviewed

| Date | Reviewer | Findings |
|------|----------|----------|
| —    | —        | Initial entry, not yet reviewed against upstream |

---

## google-cloud-mcp toolguide

**Pack artifact:** `pack/toolguides/google-cloud-mcp.toolguide.yaml`  
**Upstream source:** GCP project `dmm-01`, Cloud Run service `sqlx-mcp`, region `europe-west1`

### What to check

- [ ] Confirm the service name, project ID, and region in the summary are still current.
- [ ] Check whether new MCP tools have been exposed by the upstream Cloud Run service
      beyond `query_datamodel_definitions` and `get_sqlx_manual_chapter`.
- [ ] Verify the gcloud proxy setup steps in `pack/procedures/gcloud-proxy-setup.procedure.yaml`
      still reflect the current gcloud CLI version and component names.

### Last reviewed

| Date | Reviewer | Findings |
|------|----------|----------|
| —    | —        | Initial entry, not yet reviewed against upstream |

---

## sqlx-mcp toolguide

**Pack artifact:** `pack/toolguides/sqlx-mcp.toolguide.yaml`  
**Upstream source:** Abacus CLI release notes; MCP service changelog

### What to check

- [ ] Confirm `abacus` CLI subcommands listed in `commands` still exist and have not
      been renamed (e.g. `abacus analyse` → `abacus analyze`).
- [ ] Check if new Abacus CLI subcommands have been added that are useful for SQLX agents.
- [ ] Verify `resources/sqlx/` fallback knowledge base is up to date if the SQLX manual
      has been revised upstream.

### Last reviewed

| Date | Reviewer | Findings |
|------|----------|----------|
| —    | —        | Initial entry, not yet reviewed against upstream |
