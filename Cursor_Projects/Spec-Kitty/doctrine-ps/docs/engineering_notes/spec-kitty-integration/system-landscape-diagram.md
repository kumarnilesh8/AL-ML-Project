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

## System Landscape (C4 Level 1)

The diagram below provides a C4 Level 1 (Context) view of the three repositories and their key actors. It is the authoritative visual complement to the textual landscape description in the engineering note.

![Spec Kitty Doctrine Integration — System Landscape](file:///home/stijn/Documents/_code/CLIENTS/regnology/regnology-agent-doctrine/output/diagrams/c4_level1_spec-kitty-system-landscape.svg)

_Source: `docs/diagrams/c4_level1_spec-kitty-system-landscape.puml` — rendered with PlantUML + Regnology C4 theme._

### Actors

| Actor | Role | Boundary |
|---|---|---|
| **PS Engagement Engineer** | Uses spec-kitty for mission workflow; initializes agents via AGENTS.md; generates branded documents via docops | Regnology PS (internal) |
| **Doctrine Maintainer** | Authors and evolves the governance framework; defines docops toolguides; coordinates with spec-kitty on plug-in pack design | Regnology PS (internal) |
| **Spec Kitty Maintainer** | Develops the open-core platform; driving the plug-in doctrine pack support confirmed as a current release priority | External (open-source) |

### Systems

| System | Boundary | Current state |
|---|---|---|
| **regnology-agent-doctrine** | Regnology PS (private) | Markdown prose; 39 directives, 24 agent profiles; AGENTS.md bootstrap |
| **regnology-docgen** | Regnology PS (private) | Python/Typer CLI; PDF, DOCX, Reveal.js generation |
| **spec-kitty** | Open-core | Mission workflow, DRG-injected doctrine, 5-tier template resolver; `DoctrineService` has architectural seam for org-level slot |

### Key Relationships

The diagram makes three structural tensions visible:

1. **Governance split:** Agents are currently initialized via `AGENTS.md` (doctrine repo) while missions run via spec-kitty. These are two separate initialization paths for the same engineer.
2. **Doctrine injection gap:** The `DoctrineService` seam exists for an org-level doctrine slot, but no formal distribution channel (`pack install`) exists yet. The overlay bridge (Phase 2) fills this gap without waiting for the plug-in mechanism.
3. **docops as a first-class citizen:** The document pipeline is not peripheral — it is the delivery surface for PS engagement artefacts. Its integration as a `toolguide.yaml` in spec-kitty is a prerequisite for full mission-to-document traceability.
