"""Validate every artifact in pack/ against the spec-kitty schemas.

Requires spec-kitty to be installed (``pip install spec-kitty`` or the fork
available at the path set by SPEC_KITTY_FORK env var).
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent
PACK_DIR = REPO_ROOT / "pack"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_yaml(path: Path) -> dict:
    """Parse a YAML file; returns a dict."""
    from ruamel.yaml import YAML
    return YAML(typ="safe").load(path)


def _collect_artifacts(subdir: str, glob: str) -> list[Path]:
    d = PACK_DIR / subdir
    if not d.is_dir():
        return []
    return sorted(d.glob(glob))


# ---------------------------------------------------------------------------
# Integration test — full pack via spec-kitty CLI
# ---------------------------------------------------------------------------

_UPSTREAM_GUIDE_PATH_XFAIL = pytest.mark.xfail(
    reason=(
        "spec-kitty Toolguide.guide_path pattern ^src/doctrine/.+\\.md$ does not "
        "allow pack-relative paths. Upstream fix: https://github.com/Priivacy-ai/spec-kitty/issues/1157 "
        "— remove xfail once merged."
    ),
    strict=True,
)


class TestPackValidateCLI:
    @_UPSTREAM_GUIDE_PATH_XFAIL
    def test_pack_validates_clean(self):
        """spec-kitty doctrine pack validate must exit 0 with 0 errors."""
        result = subprocess.run(
            [sys.executable, "-m", "specify_cli", "doctrine", "pack", "validate", str(PACK_DIR)],
            capture_output=True,
            text=True,
        )
        # The CLI is also available as the `spec-kitty` shim; try both
        if result.returncode != 0 and "No module named" in result.stderr:
            result = subprocess.run(
                ["spec-kitty", "doctrine", "pack", "validate", str(PACK_DIR)],
                capture_output=True,
                text=True,
            )
        assert result.returncode == 0, (
            f"Pack validation failed.\nstdout: {result.stdout}\nstderr: {result.stderr}"
        )
        assert "0 errors" in result.stdout, (
            f"Expected '0 errors' in output, got:\n{result.stdout}"
        )


# ---------------------------------------------------------------------------
# Unit tests — per-artifact-type, parametrized
# ---------------------------------------------------------------------------

class TestDirectives:
    @pytest.mark.parametrize("path", _collect_artifacts("directives", "*.directive.yaml"))
    def test_directive_schema(self, path: Path):
        from doctrine.directives.models import Directive
        data = _load_yaml(path)
        Directive.model_validate(data)  # raises ValidationError on failure

    @pytest.mark.parametrize("path", _collect_artifacts("directives", "*.directive.yaml"))
    def test_directive_id_uppercase(self, path: Path):
        import re
        data = _load_yaml(path)
        assert re.match(r"^[A-Z][A-Z0-9_-]*$", data["id"]), (
            f"{path.name}: id '{data['id']}' does not match ^[A-Z][A-Z0-9_-]*$"
        )

    @pytest.mark.parametrize("path", _collect_artifacts("directives", "*.directive.yaml"))
    def test_directive_enforcement_valid(self, path: Path):
        data = _load_yaml(path)
        assert data["enforcement"] in ("required", "lenient-adherence", "advisory"), (
            f"{path.name}: enforcement '{data['enforcement']}' is not a valid value"
        )


class TestToolguides:
    @_UPSTREAM_GUIDE_PATH_XFAIL
    @pytest.mark.parametrize("path", _collect_artifacts("toolguides", "*.toolguide.yaml"))
    def test_toolguide_schema(self, path: Path):
        """Full Pydantic validation — xfail until spec-kitty relaxes guide_path pattern."""
        from doctrine.toolguides.models import Toolguide
        data = _load_yaml(path)
        Toolguide.model_validate(data)

    @pytest.mark.parametrize("path", _collect_artifacts("toolguides", "*.toolguide.yaml"))
    def test_toolguide_required_fields_present(self, path: Path):
        """Pack-local validation: required fields exist regardless of guide_path constraint."""
        data = _load_yaml(path)
        for field in ("schema_version", "id", "tool", "title", "guide_path", "summary"):
            assert field in data, f"{path.name}: missing required field '{field}'"
        assert data["schema_version"] == "1.0", f"{path.name}: schema_version must be '1.0'"

    @pytest.mark.parametrize("path", _collect_artifacts("toolguides", "*.toolguide.yaml"))
    def test_toolguide_guide_path_is_pack_relative(self, path: Path):
        """guide_path should point to a pack-relative .md file alongside the YAML."""
        data = _load_yaml(path)
        guide_path = data["guide_path"]
        assert guide_path.endswith(".md"), f"{path.name}: guide_path must end with .md"
        # The companion .md file must exist within the pack directory
        resolved = PACK_DIR / guide_path
        assert resolved.is_file(), (
            f"{path.name}: guide_path '{guide_path}' → {resolved} does not exist in pack/"
        )

    @pytest.mark.parametrize("path", _collect_artifacts("toolguides", "*.toolguide.yaml"))
    def test_toolguide_id_kebab_case(self, path: Path):
        import re
        data = _load_yaml(path)
        assert re.match(r"^[a-z][a-z0-9-]*$", data["id"]), (
            f"{path.name}: id '{data['id']}' does not match ^[a-z][a-z0-9-]*$"
        )


class TestAgentProfiles:
    @pytest.mark.parametrize("path", _collect_artifacts("agent_profiles", "*.agent.yaml"))
    def test_agent_profile_schema(self, path: Path):
        from doctrine.agent_profiles.profile import AgentProfile
        data = _load_yaml(path)
        AgentProfile.model_validate(data)

    @pytest.mark.parametrize("path", _collect_artifacts("agent_profiles", "*.agent.yaml"))
    def test_agent_profile_has_roles(self, path: Path):
        data = _load_yaml(path)
        has_role = "role" in data
        has_roles = "roles" in data
        assert has_role or has_roles, (
            f"{path.name}: must have 'roles' (or deprecated 'role') field"
        )
        if has_roles:
            assert len(data["roles"]) >= 1, f"{path.name}: 'roles' must have at least one entry"

    @pytest.mark.parametrize("path", _collect_artifacts("agent_profiles", "*.agent.yaml"))
    def test_agent_profile_has_specialization_primary_focus(self, path: Path):
        data = _load_yaml(path)
        assert "specialization" in data, f"{path.name}: missing 'specialization' section"
        assert "primary-focus" in data["specialization"], (
            f"{path.name}: specialization is missing 'primary-focus'"
        )


class TestTactics:
    @pytest.mark.parametrize("path", _collect_artifacts("tactics", "*.tactic.yaml"))
    def test_tactic_schema(self, path: Path):
        from doctrine.tactics.models import Tactic
        data = _load_yaml(path)
        Tactic.model_validate(data)

    @pytest.mark.parametrize("path", _collect_artifacts("tactics", "*.tactic.yaml"))
    def test_tactic_id_kebab_case(self, path: Path):
        import re
        data = _load_yaml(path)
        assert re.match(r"^[a-z][a-z0-9-]*$", data["id"]), (
            f"{path.name}: id '{data['id']}' does not match ^[a-z][a-z0-9-]*$"
        )

    @pytest.mark.parametrize("path", _collect_artifacts("tactics", "*.tactic.yaml"))
    def test_tactic_has_steps(self, path: Path):
        data = _load_yaml(path)
        assert "steps" in data, f"{path.name}: missing 'steps' field"
        assert len(data["steps"]) >= 1, f"{path.name}: 'steps' must have at least one entry"


class TestStyleguides:
    @pytest.mark.parametrize("path", _collect_artifacts("styleguides", "*.styleguide.yaml"))
    def test_styleguide_schema(self, path: Path):
        from doctrine.styleguides.models import Styleguide
        data = _load_yaml(path)
        Styleguide.model_validate(data)

    @pytest.mark.parametrize("path", _collect_artifacts("styleguides", "*.styleguide.yaml"))
    def test_styleguide_id_kebab_case(self, path: Path):
        import re
        data = _load_yaml(path)
        assert re.match(r"^[a-z][a-z0-9-]*$", data["id"]), (
            f"{path.name}: id '{data['id']}' does not match ^[a-z][a-z0-9-]*$"
        )

    @pytest.mark.parametrize("path", _collect_artifacts("styleguides", "*.styleguide.yaml"))
    def test_styleguide_has_principles(self, path: Path):
        data = _load_yaml(path)
        assert "principles" in data, f"{path.name}: missing 'principles' field"
        assert len(data["principles"]) >= 1, f"{path.name}: 'principles' must have at least one entry"


class TestProcedures:
    @pytest.mark.parametrize("path", _collect_artifacts("procedures", "*.procedure.yaml"))
    def test_procedure_schema(self, path: Path):
        from doctrine.procedures.models import Procedure
        data = _load_yaml(path)
        Procedure.model_validate(data)

    @pytest.mark.parametrize("path", _collect_artifacts("procedures", "*.procedure.yaml"))
    def test_procedure_id_kebab_case(self, path: Path):
        import re
        data = _load_yaml(path)
        assert re.match(r"^[a-z][a-z0-9-]*$", data["id"]), (
            f"{path.name}: id '{data['id']}' does not match ^[a-z][a-z0-9-]*$"
        )


class TestParadigms:
    @pytest.mark.parametrize("path", _collect_artifacts("paradigms", "*.paradigm.yaml"))
    def test_paradigm_schema(self, path: Path):
        from doctrine.paradigms.models import Paradigm
        data = _load_yaml(path)
        Paradigm.model_validate(data)

    @pytest.mark.parametrize("path", _collect_artifacts("paradigms", "*.paradigm.yaml"))
    def test_paradigm_id_kebab_case(self, path: Path):
        import re
        data = _load_yaml(path)
        assert re.match(r"^[a-z][a-z0-9-]*$", data["id"]), (
            f"{path.name}: id '{data['id']}' does not match ^[a-z][a-z0-9-]*$"
        )


class TestPackStructure:
    def test_drg_fragment_exists(self):
        assert (PACK_DIR / "drg" / "fragment.yaml").is_file()

    def test_org_charter_exists(self):
        assert (PACK_DIR / "org-charter.yaml").is_file()

    def test_org_charter_has_required_directives(self):
        data = _load_yaml(PACK_DIR / "org-charter.yaml")
        required = data.get("required_directives", [])
        for directive_id in (
            "REGNOLOGY_BRANDING", "MODEL_DISCIPLINE", "APPSEC_COMPLIANCE", "CORPORATE_TOOLING",
            "TRACEABLE_DECISIONS", "AUDIENCE_ORIENTED_WRITING",
        ):
            assert directive_id in required, (
                f"org-charter.yaml: '{directive_id}' missing from required_directives"
            )

    def test_batch1_directives_present(self):
        directive_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("directives", "*.directive.yaml")
        }
        for expected in ("REGNOLOGY_BRANDING", "MODEL_DISCIPLINE", "APPSEC_COMPLIANCE", "CORPORATE_TOOLING"):
            assert expected in directive_ids, f"Directive '{expected}' not found in pack/directives/"

    def test_batch1_toolguides_present(self):
        toolguide_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("toolguides", "*.toolguide.yaml")
        }
        for expected in ("agentic-model-leaderboard", "regnology-mcp", "google-cloud-mcp"):
            assert expected in toolguide_ids, f"Toolguide '{expected}' not found in pack/toolguides/"

    def test_batch1_agent_profiles_present(self):
        profile_ids = {
            _load_yaml(p)["profile-id"]
            for p in _collect_artifacts("agent_profiles", "*.agent.yaml")
        }
        for expected in (
            "abacus-mapper-abe", "devops-danny", "backend-benny",
        ):
            assert expected in profile_ids, f"Agent profile '{expected}' not found in pack/agent_profiles/"

    def test_batch2_directives_present(self):
        directive_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("directives", "*.directive.yaml")
        }
        for expected in ("TRACEABLE_DECISIONS", "AUDIENCE_ORIENTED_WRITING", "CLARIFICATION_BEFORE_EXECUTION"):
            assert expected in directive_ids, f"Directive '{expected}' not found in pack/directives/"

    def test_batch2_domain_d_tactics_present(self):
        tactic_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("tactics", "*.tactic.yaml")
        }
        for expected in (
            "appsec-pipeline-setup", "security-issue-triage", "urgent-vulnerability-response",
            "maven-project-compliance-setup", "secure-design-checklist",
        ):
            assert expected in tactic_ids, f"Tactic '{expected}' not found in pack/tactics/"

    def test_batch2_domain_e_tactics_present(self):
        tactic_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("tactics", "*.tactic.yaml")
        }
        for expected in (
            "safe-to-fail-experiment-design", "glossary-maintenance-workflow",
            "reflection-post-action-learning-loop",
        ):
            assert expected in tactic_ids, f"Tactic '{expected}' not found in pack/tactics/"

    def test_batch2_styleguides_present(self):
        styleguide_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("styleguides", "*.styleguide.yaml")
        }
        for expected in ("commit-and-markdown-linting", "version-control-hygiene", "professional-communications"):
            assert expected in styleguide_ids, f"Styleguide '{expected}' not found in pack/styleguides/"

    def test_batch2_procedures_present(self):
        procedure_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("procedures", "*.procedure.yaml")
        }
        for expected in ("create-branded-slidedeck", "decision-reference-types"):
            assert expected in procedure_ids, f"Procedure '{expected}' not found in pack/procedures/"

    def test_batch2_paradigms_present(self):
        paradigm_ids = {
            _load_yaml(p)["id"]
            for p in _collect_artifacts("paradigms", "*.paradigm.yaml")
        }
        expected = {
            "cloud-native-domain-modelling",
            "bounded-context-linguistic-discovery",
            "capability-language-selection",
        }
        assert expected.issubset(paradigm_ids), (
            f"Expected paradigms missing from pack/paradigms/: {expected - paradigm_ids}"
        )
