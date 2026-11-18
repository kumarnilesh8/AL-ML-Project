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

# Executive Summary: Integrating Regnology Doctrine into Spec Kitty

_Version: 1.0.0_  
_Date: 2026-05-13_  
_Author: Editor Eddy — based on engineering note by Architect Alphonso (2026-05-12)_  
_Status: For Review_  
_Classification: FOR INTERNAL USE ONLY_

---

## Situation

Regnology Professional Services maintains two tooling assets that are converging:

- **regnology-agent-doctrine** — the agent governance framework used across PS engagements (guidelines, directives, agent profiles, tactics).
- **spec-kitty** — the open-core mission workflow tool, which provides structured mission execution, charter-driven governance, and doctrine-aware runtime for AI agents.

Spec-kitty's maintainers have confirmed that **plug-and-play external doctrine artefacts are a priority for the current release cycle**. This confirmation materially improves the viability of the cleanest long-term integration option and shortens the expected timeline to org-level doctrine inheritance.

The goal is to make Regnology's governance layer available to any engagement using spec-kitty — consistently, confidentially, and without duplicating setup work across projects.

---

## What We Assessed

Four approaches were evaluated against six criteria: migration effort, org-level inheritance, IP protection, spec-kitty core changes required, format conversion scope, and compatibility with the regnology-docgen branded document pipeline.

| Approach | Core idea | Available today |
|---|---|---|
| **A — Charter-only** | Encode all governance in a per-project `charter.md` | ✅ Yes |
| **B — Plug-in doctrine pack** | Publish a versioned Regnology pack installed once per machine | ⚡ Imminent |
| **C — Overlay bridge** | Place converted artefacts in `.kittify/doctrine/` per project | ✅ Yes |
| **D — Parallel operation** | Run both systems side-by-side; converge incrementally | ✅ Yes |

---

## Recommendation

**Adopt a phased approach: start with parallel operation (D), bridge incrementally (C), then consolidate into a versioned doctrine pack (B) when plug-in support ships.**

### Phase 1 — Now: Parallel Operation

Run regnology-agent-doctrine and spec-kitty side-by-side. Use spec-kitty for mission workflow; use the existing `AGENTS.md` bootstrap for agent initialization. No format conversion is required. No spec-kitty changes are needed. Engagement teams get the workflow benefits of spec-kitty immediately.

**Effort:** Low. Risk: Low.

### Phase 2 — Short-term: Overlay Bridge

Convert the ten to fifteen highest-value Regnology artefacts to spec-kitty's YAML schema — model-discipline toolguide, branding directive, ABACUS360 agent profile, and the core Regnology guidelines. Distribute them via a lightweight installer script into `.kittify/doctrine/` per engagement. Wire them to the charter so spec-kitty's DRG traversal picks them up during context injection.

The regnology-docgen branded document pipeline is referenced as a toolguide at this stage, giving agents structured access to the PDF and slide generation stack.

**Effort:** Medium. Risk: Low (no spec-kitty core changes required).

### Phase 3 — When Plug-in Support Ships: Doctrine Pack

Publish `regnology-ps-doctrine-pack` as a versioned private repository. Install once per developer machine; every engagement inherits the full Regnology governance layer automatically. Retire regnology-agent-doctrine as a standalone bootstrap dependency.

Given the maintainers' confirmation that external doctrine pack support is a current priority, this phase is likely closer than originally estimated. A contribution of the `org_roots` service slot to open-core should be explored — it would benefit any professional services organization using spec-kitty.

**Effort:** High (format conversion + potential upstream contribution). Risk: Bounded (private fork fallback available).

---

## Why Not the Alternatives?

**Charter-only (A)** fails on portability. Every new engagement must re-derive the Regnology governance layer from scratch. There is no per-organisation inheritance mechanism — the charter is scoped per project, not per organisation. IP discipline is also weaker: proprietary directives end up in each project's git history.

**Jumping straight to plug-in (B)** without a bridge phase would block Regnology from adopting spec-kitty in active engagements until the pack format is stable and fully converted. The phased approach removes that dependency.

---

## What This Means for regnology-docgen

The regnology-docgen pipeline (branded PDF and slide generation) is a natural companion to the doctrine pack. Its toolguides and brand assets should be distributed alongside the doctrine artefacts — not bundled inside spec-kitty's open-core. The Phase 2 overlay and Phase 3 pack both provide a clean distribution channel for that integration.

---

## Decisions Needed

Three questions require human decision before Phase 2 work can be scoped:

1. **Contribution appetite.** Should Regnology contribute the plug-in org-layer to spec-kitty open-core, or manage it as a private extension?
2. **Proprietary boundary.** Which of the 39 directives are genuinely Regnology-specific, and which are generic enough to propose as upstream shipped doctrine?
3. **Baseline charter.** Should a single "Regnology PS baseline charter" exist that each engagement charter extends? If yes, the plug-in approach is strongly preferred over the overlay.

---

_[Agent: Editor Eddy] — `/analysis-mode` — based on Architect Alphonso engineering note 2026-05-12_
