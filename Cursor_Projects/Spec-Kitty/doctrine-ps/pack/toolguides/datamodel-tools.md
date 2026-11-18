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

# Toolguide: datamodel-tools

**Repository:** `https://bitbucket.regnology.net/projects/CONS/repos/datamodel-tools`  
**Access:** Regnology VPN + Bitbucket repository permission required  
**Interface:** `regnology-mcp` Bitbucket tools (`bb_get_file`, `bb_list_repos`) or direct git clone

---

## Purpose

The `datamodel-tools` repository is the reference source for two categories of
ABACUS360 data model content that Abacus Mapper Abe uses during mapping and
ETL work:

| Category | What it contains | When to use |
|---|---|---|
| **Model operations** | Canonical representations of joins, transformations, and data quality checks applied to the ABACUS360 model | When generating or validating ETL logic, resolving join paths between entities, or understanding transformation rules for a specific domain |
| **Core datamodel** | Reference guides, field-level documentation, entity relationship maps, and domain value catalogues for the ABACUS360 banking data model | When performing semantic field matching, validating domain values, or documenting mapping decisions |

---

## Access requirements

Before using this toolguide, verify access:

```
# Via regnology-mcp:
bb_list_repos(projectKey="CONS")
# → datamodel-tools must appear in the result
```

If the repository is missing, request access from the CONS project administrator on
Bitbucket before proceeding. All operations require an active Regnology VPN connection.

---

## Fetching model operations

Model operations define how ABACUS360 entities are joined, how source data is
transformed to target format, and what integrity checks are applied.

### Fetch a specific operation file

```
bb_get_file(
  projectKey="CONS",
  repoSlug="datamodel-tools",
  filePath="<path-to-operation-file>",
  branch="main"
)
```

### Discover available operations

```
# List files at the operations root:
bb_get_file(
  projectKey="CONS",
  repoSlug="datamodel-tools",
  filePath="README.md",
  branch="main"
)
```

Read the README first — it documents the directory structure and naming conventions
used for operations files. Do not guess paths; resolve them from the README index.

### Typical operation file content

Operation files typically describe:
- **Join definitions** — which ABACUS360 entities are joined, on which keys, and
  under which conditions (inner/left/full)
- **Transformation rules** — field-level mappings with type coercion, default values,
  null handling, and conditional logic
- **Check specifications** — data quality rules (completeness, referential integrity,
  domain value constraints) applied before or after a transformation step

Use this content to validate that a proposed ETL mapping is consistent with the
canonical operation definition before generating code.

---

## Fetching core datamodel reference guides

Reference guides provide authoritative descriptions of ABACUS360 entities, their
fields, relationships, and domain value catalogues.

### Fetch a reference guide

```
bb_get_file(
  projectKey="CONS",
  repoSlug="datamodel-tools",
  filePath="<path-to-reference-guide>",
  branch="main"
)
```

### Common reference guide types

| Guide type | What to look for | How to use in mapping work |
|---|---|---|
| Entity overview | Top-level entity descriptions (POSITION, INSTRUMENT, PARTNER, OBJECT) | Confirm target entity before beginning field analysis |
| Field catalogue | Per-entity field list with data types, nullability, and DE/EN captions | Anchor semantic field matching; use captions as matching signals |
| Domain value catalogue | Allowed values for controlled-vocabulary fields | Validate proposed source-to-target domain value mappings |
| Relationship map | Entity-to-entity foreign key relationships | Resolve join paths; avoid proposing non-existent relationships |

---

## Usage pattern for Abacus Mapper Abe

Before starting any mapping task, follow this sequence:

1. **Check the README** — confirm the directory structure and identify the relevant
   operation or reference section for the domain being mapped.
2. **Load the relevant reference guide** — fetch the entity overview and field catalogue
   for the target ABACUS360 entity.
3. **Load operation definitions** — if the task involves ETL generation, fetch the
   canonical join and transformation definitions for the target operation.
4. **Cross-reference with the MCP data model server** — use `query_datamodel_definitions`
   (via `google-cloud-mcp`) as the live authoritative source; use `datamodel-tools`
   content as the canonical operation specification and reference guide.
5. **Cite sources** — every mapping decision must reference either a datamodel-tools
   file path + field name, or a `query_datamodel_definitions` result, not memory or
   assumption.

---

## Constraints

- **Read-only** — do not push, create branches, or modify files in `datamodel-tools`.
  Propose changes to the repository maintainer via a Jira ticket or Bitbucket PR.
- **Branch awareness** — the `main` branch is the stable reference. Use `bb_list_branches`
  to check for release or domain-specific branches if `main` does not contain the
  expected content.
- **Staleness risk** — `datamodel-tools` is periodically updated as the ABACUS360 model
  evolves. If a file was last modified more than one sprint ago, verify with the
  project data owner that the content is still current before using it as a
  mapping anchor.
- **Capability drift** — new operation types and reference guides are added as the
  engagement progresses. Re-read the repository README at the start of each sprint
  to discover new content.
