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

# Toolguide: SQLX MCP and Manual Reference

**Scope:** SQLX code generation, optimisation, and debugging  
**Interface:** Cursor MCP (`sqlx-mcp`)  
**Last Updated:** 2026-05-22

---

## Purpose

Covers the full SQLX authoring workflow: MCP tools for live data model and
manual access, the Abacus CLI for validation and testing, and fallback to the
bundled knowledge base when MCP is unavailable.

> For **data model lookups only** (no generation context), see the
> `google-cloud-mcp` toolguide instead.

**Priority order:**
1. MCP tools (live, authoritative) — always prefer
2. Bundled knowledge base at `resources/sqlx/` — when MCP is unavailable
3. Local doctrine (`toolguides/sqlx_language/`, styleguide `sqlx-coding-standards`) — secondary fallback only

**Model tier:** mid for routine SQLX work; premium only for ambiguous spec
decisions, cross-FU architecture, or security-sensitive validation.

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `query_datamodel_definitions` | Query live ABACUS360 data model — entities, fields, domains, domain values |
| `get_sqlx_manual_chapter` | Retrieve a specific chapter (0–31) of the SQLX technical manual |

MCP provides the canonical SQLX language specification (31 chapters) and the
live ABACUS360 data model. Always use MCP over local fallback when available.

---

## Abacus CLI Commands

| Command | Description |
|---------|-------------|
| `abacus validate` | Validate SQLX source files against the language specification |
| `abacus test` | Run unit tests for SQLX functional units |
| `abacus run` | Execute a SQLX functional unit |
| `abacus info` | Display metadata about a functional unit or project |
| `abacus dag-dump` | Dump the execution DAG for a functional unit |
| `abacus analyse` | Analyse a functional unit for potential issues |
| `abacus format` | Auto-format SQLX source files |
| `abacus language-server` | Start the SQLX language server (used by IDE integration) |

---

## Workflow

```
1. Query data model via MCP (query_datamodel_definitions)
   → Identify relevant entities, fields, domain values

2. Retrieve relevant SQLX manual chapters (get_sqlx_manual_chapter)
   → Confirm language constructs, syntax rules, constraints

3. Author / modify SQLX functional unit

4. Validate locally (abacus validate)
   → Fix any structural or type errors

5. Run unit tests (abacus test)
   → Confirm expected outputs

6. Submit for review
```

---

## Fallback Strategy

When MCP is unavailable:

| Priority | Source | Location |
|----------|--------|----------|
| 1 (preferred) | Live MCP | `query_datamodel_definitions`, `get_sqlx_manual_chapter` |
| 2 | Bundled knowledge base | `resources/sqlx/` (shipped with this pack) |
| 3 | Local doctrine | `toolguides/sqlx_language/`, styleguide `sqlx-coding-standards` |

Inform the user if MCP is unavailable; do not silently fall back without noting
the reduced authority of locally-cached content.

---

## Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Stale data model results | Using local fallback when MCP is available | Always attempt MCP first; check connectivity |
| Validation passes locally but fails in CI | Local `abacus` version differs from CI | Align `abacus` versions; check `.kittify/config.yaml` |
| Wrong tool selected for data model lookup | `google-cloud-mcp` vs `sqlx-mcp` confusion | Use `google-cloud-mcp` for read-only model lookup; use this guide for generation workflows |
