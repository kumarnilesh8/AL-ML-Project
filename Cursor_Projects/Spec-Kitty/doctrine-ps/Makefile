# Regnology Agent Doctrine — Development Makefile
# -------------------------------------------------
# This repo's pack `ps-agent-enabled-factory` (layer 2) `extends` the parent
# `regnology-all-company` pack (layer 1). Cross-layer references make the
# OVERLAY validate differently depending on whether the parent is mounted:
#
#   validate-pack     Standalone validation of pack/ ONLY. Reports cross-layer
#                     references (artefacts promoted to the parent layer) as
#                     `drg_dangling_edge` errors. These are EXPECTED, not real
#                     defects — use `tools/triage-drg-dangles.py` to confirm.
#   validate-layered  AUTHORITATIVE gate. Assembles parent + overlay and
#                     validates the MERGED tree. Requires BASE_PACK_DIR to point
#                     at the parent `regnology-all-company` pack root.
#
# Primary targets:
#   compile-drg      Regenerate ps-agent-enabled-factory.graph.yaml from fragment.yaml
#   check-drg-fresh  Warn if fragment.yaml is newer than the compiled graph
#   validate-pack    Standalone validate (shows cross-layer dangles by design)
#   validate-layered Assemble parent + overlay and validate the merged tree (authoritative)

.PHONY: compile-drg check-drg-fresh validate-pack validate-layered lint-doc-paths help

FRAGMENT   := pack/drg/fragment.yaml
GRAPH      := pack/drg/ps-agent-enabled-factory.graph.yaml
COMPILE    := python3 tools/compile-drg.py

# BASE_PACK_DIR — path to the parent `regnology-all-company` pack root. Empty by
# default. Set it for layered validation and to compile a correct-kind DRG graph:
#   make validate-layered BASE_PACK_DIR=.kittify/doctrine-cache/doctrine-org/pack
# Clone the parent pack with:
#   git clone ssh://git@bitbucket.regnology.net:7999/raf/doctrine-org.git
# then point BASE_PACK_DIR at its `pack/` subdirectory.
BASE_PACK_DIR ?=

help:
	@echo "Available targets:"
	@echo "  compile-drg      Regenerate $(GRAPH) from $(FRAGMENT)"
	@echo "                   Pass BASE_PACK_DIR to embed correct cross-layer edge kinds."
	@echo "  check-drg-fresh  Fail if $(FRAGMENT) is newer than $(GRAPH)"
	@echo "  validate-pack    Standalone validate of pack/ (shows cross-layer dangles by design)"
	@echo "  validate-layered Assemble parent + overlay and validate the merged tree (AUTHORITATIVE)"
	@echo "                   Requires BASE_PACK_DIR=<regnology-all-company pack root>."
	@echo "  lint-doc-paths   Scan tracked Markdown for dangling repo-relative path references"

## compile-drg — regenerate the compiled DRG graph from fragment.yaml
# The committed $(GRAPH) is the LAYERED graph: cross-layer edges carry their TRUE
# kind (toolguide:/paradigm:/styleguide:/tactic:/procedure:) resolved from the
# parent pack inventory. Compiling WITHOUT BASE_PACK_DIR regresses those edges to
# the directive: fallback, so we WARN loudly to stop a dev committing a regressed
# graph unknowingly.
compile-drg:
	@if [ -n "$(BASE_PACK_DIR)" ]; then \
		echo "compile-drg: using BASE_PACK_DIR=$(BASE_PACK_DIR) (correct-kind cross-layer edges)"; \
		$(COMPILE) --base-pack "$(BASE_PACK_DIR)"; \
	else \
		echo ""; \
		echo "WARNING: BASE_PACK_DIR is unset. Cross-layer DRG edges will fall back to"; \
		echo "         the directive: kind, producing a REGRESSED graph. Do NOT commit"; \
		echo "         the result. To compile the correct layered graph, run:"; \
		echo "           make compile-drg BASE_PACK_DIR=.kittify/doctrine-cache/doctrine-org/pack"; \
		echo ""; \
		$(COMPILE); \
	fi

## check-drg-fresh — mtime guard
# Exits non-zero with an actionable message when fragment.yaml is newer than
# ps-agent-enabled-factory.graph.yaml, prompting the author to run `make compile-drg`.
# Invoked by CI and by the Cursor pre-commit hook (on changes to fragment.yaml).
check-drg-fresh:
	@if [ ! -f "$(GRAPH)" ]; then \
		echo ""; \
		echo "ERROR: $(GRAPH) does not exist."; \
		echo "  Run: make compile-drg"; \
		echo ""; \
		exit 1; \
	fi
	@if [ "$(FRAGMENT)" -nt "$(GRAPH)" ]; then \
		echo ""; \
		echo "ERROR: $(FRAGMENT) is newer than $(GRAPH)."; \
		echo "  The compiled DRG graph is stale."; \
		echo "  Run:  make compile-drg"; \
		echo "  Then: git add $(GRAPH) && git commit --amend --no-edit"; \
		echo ""; \
		exit 1; \
	fi
	@echo "DRG graph is up-to-date."

## validate-pack — standalone validation (cross-layer dangles expected)
# Validates pack/ on its own. Cross-layer references to artefacts promoted to the
# parent layer surface as drg_dangling_edge errors — this is BY DESIGN. The
# authoritative gate is validate-layered. Use tools/triage-drg-dangles.py to
# confirm every dangle is a resolvable cross-layer reference, not a real defect.
validate-pack:
	spec-kitty doctrine pack validate pack/

## validate-layered — AUTHORITATIVE layered validation
# Recompiles the overlay graph with the parent mounted, assembles parent +
# overlay into a temp dir, and validates the MERGED tree. The merged tree must
# report zero errors. Exits non-zero if compile, assemble, or validate fails.
#
# READ-ONLY against the working tree: the committed $(GRAPH) is backed up and
# restored on exit, so running the gate never leaves a `generated_at` (or any)
# diff behind. If the fresh --base-pack compile differs in CONTENT from the
# committed graph (ignoring the timestamp), a staleness WARNING is emitted so the
# author knows to run `make compile-drg BASE_PACK_DIR=...` and commit the result.
validate-layered:
	@if [ -z "$(BASE_PACK_DIR)" ] || [ ! -d "$(BASE_PACK_DIR)" ]; then \
		echo ""; \
		echo "ERROR: BASE_PACK_DIR is unset or not a directory: '$(BASE_PACK_DIR)'"; \
		echo "  Layered validation needs the parent regnology-all-company pack."; \
		echo "  Clone it and set BASE_PACK_DIR, e.g.:"; \
		echo "    git clone ssh://git@bitbucket.regnology.net:7999/raf/doctrine-org.git"; \
		echo "    make validate-layered BASE_PACK_DIR=.kittify/doctrine-cache/doctrine-org/pack"; \
		echo ""; \
		exit 1; \
	fi
	@set -e; \
	echo "Layered validation against base pack: $(BASE_PACK_DIR)"; \
	GRAPH_BAK="$$(mktemp)"; cp "$(GRAPH)" "$$GRAPH_BAK"; \
	DIFF_OLD="$$(mktemp)"; DIFF_NEW="$$(mktemp)"; \
	TMP="$$(mktemp -d "$(CURDIR)/.tmp-assembled.XXXXXX")"; \
	trap 'rm -rf "$$TMP"; cp "$$GRAPH_BAK" "$(GRAPH)"; rm -f "$$GRAPH_BAK" "$$DIFF_OLD" "$$DIFF_NEW"' EXIT INT TERM; \
	echo "[1/3] Recompiling overlay graph with parent inventory"; \
	$(COMPILE) --base-pack "$(BASE_PACK_DIR)"; \
	grep -v '^generated_at:' "$$GRAPH_BAK" > "$$DIFF_OLD" 2>/dev/null || true; \
	grep -v '^generated_at:' "$(GRAPH)" > "$$DIFF_NEW" 2>/dev/null || true; \
	if ! diff "$$DIFF_OLD" "$$DIFF_NEW" >/dev/null 2>&1; then \
		echo "WARNING: committed $(GRAPH) differs from a fresh --base-pack compile"; \
		echo "         (excluding timestamp). The committed graph may be stale or"; \
		echo "         regressed. Run: make compile-drg BASE_PACK_DIR=$(BASE_PACK_DIR)"; \
		echo "         and commit the regenerated graph."; \
	fi; \
	echo "[2/3] Assembling parent + overlay into $$TMP"; \
	spec-kitty doctrine pack assemble "$$TMP" "$(BASE_PACK_DIR)" pack --conflicts-out "$$TMP/conflicts.json"; \
	echo "[3/3] Validating assembled (merged) tree"; \
	spec-kitty doctrine pack validate "$$TMP"

## lint-doc-paths — scan tracked Markdown for dangling repo-relative path references
# See tools/lint-doc-paths.py module docstring for scope, allow-lists, and
# scan exclusions (spec.md FR-009/FR-010).
lint-doc-paths:
	python3 tools/lint-doc-paths.py
