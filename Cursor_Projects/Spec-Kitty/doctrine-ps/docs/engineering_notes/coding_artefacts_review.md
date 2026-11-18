# Coding Artefacts Review
[Agent: Curator Claire]

## 1. Overview

A critical review was conducted on the "coding-related artefacts" to determine if they possess sufficient Regnology-specific value to remain in the `pack/`, or if they are largely generic and should be deferred to the native Spec-Kitty defaults (and potentially upstreamed). 

## 2. Re-evaluation of Agent Profiles

### Backend Benny (`backend-benny`)
- **Status:** Deprecated (Deleted from `pack/`)
- **Reasoning:** A review of `backend-benny` revealed that it acted essentially as a generic implementer/architect equipped with Regnology's tooling (Jira, Bitbucket, Confluence via MCP). The native Spec-Kitty `implementer-ivan` is perfectly suited for this role. Instead of maintaining a separate agent, `implementer-ivan` will inherit Regnology's specific directives (AppSec Compliance, Corporate Tooling, etc.) natively via the `org-charter` DRG application edges.
- **Consequential Changes:** `sqlx-specialist-simon`, which previously specialized from `backend-benny`, has been repointed to specialize directly from `implementer-ivan`.

## 3. Re-evaluation of Coding Styleguides

### Generic Scripting Conventions
- **Status:** Deprecated (Deleted from `pack/`)
- **Artefacts:**
  - `pack/styleguides/shell-scripts.styleguide.yaml`
  - `pack/styleguides/powershell-conventions.styleguide.yaml`
- **Reasoning:** These artefacts represent universal standard practices (e.g. ShellCheck rules, PSScriptAnalyzer usage) rather than proprietary Regnology methodology. They clutter the organisational pack and have been removed. They should be proposed as upstream enhancements to Spec-Kitty's generic craftsmanship library.

### Preserved & Migrated Regnology Standards
- **Status:** Migrated & Active
- **Artefacts:** 
  - `pack/styleguides/python-conventions.styleguide.yaml`
  - `pack/styleguides/java-conventions.styleguide.yaml`
  - `pack/styleguides/sqlx-coding-standards.styleguide.yaml`
  - `pack/styleguides/sqlx-test-data-conventions.styleguide.yaml`
- **Reasoning:** 
  - The Python and Java conventions encompass specific architectural constraints, Quad-A test structures, and explicit quality gates expected within the Regnology ecosystem. These were successfully parsed from `TO_BE_REMOVED` and mapped as `.styleguide.yaml` files inside the pack.
  - SQLX is a proprietary data-modeling technology tightly coupled to Regnology's core business domains. Its standards, testing conventions, and the dedicated `sqlx-specialist-simon` agent remain fully preserved as pack overrides.

## 4. DRG Updates
The `pack/drg/fragment.yaml` has been pruned of all references to `backend-benny`, `shell-scripts`, and `powershell-conventions`. It now accurately maps `python-conventions` and `java-conventions` to the respective native Spec-Kitty roles (`python-pedro`, `java-jenny`).

The `docs/pack-migration-plan.md` has been updated to reflect the deprecation of these artefacts.