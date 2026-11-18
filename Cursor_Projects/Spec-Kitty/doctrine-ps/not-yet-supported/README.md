# Not-Yet-Supported Pack Extensions

Artifacts in this directory are valid Regnology PS governance content that cannot yet be
expressed as a distributable pack artifact because the required spec-kitty artifact type
or extension mechanism does not exist yet.

Each subdirectory groups artifacts by the intended type once support lands.

## Subdirectories

| Directory | Intended artifact type | Tracking |
|---|---|---|
| `mission-types/` | Custom mission types (pluggable workflows) | Pending spec-kitty plugin API |

## How to use these artifacts

Until spec-kitty supports the relevant extension point, these artifacts serve as:
- Reference material for teams running the workflow manually
- A draft specification ready to register once support ships
- Input to upstream feature requests

When spec-kitty adds support, move the artifact into `pack/` under the correct kind directory,
register the DRG node and edges, and add the tag entry to `config/artifact-tags.yaml`.
