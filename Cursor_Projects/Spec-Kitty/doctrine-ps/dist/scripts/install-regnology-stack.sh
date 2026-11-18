#!/bin/sh
# install-regnology-stack.sh — Install the Regnology Agent Stack
# Version: 3.0.0
#
# Installs from Regnology Artifactory + PyPI:
#   - spec-kitty-cli  (via pipx; pinned PyPI version OR a git ref such as `main`)
#   - regnology-all-company doctrine pack   (base layer, from the upstream root)
#   - ps-agent-enabled-factory doctrine pack (PS overlay, from this repo's path)
#
# Ordered phases (parity-critical — must match the .ps1 installer exactly):
#   resolve -> idempotency -> preflight -> integrity -> deps -> spec-kitty
#           -> layers (base -> overlay) -> completion
#
# Build-time injection (D-005, WP01 release-map contract):
#   The four @...@ tokens below are substituted by the Jenkins tag build before
#   publishing. A published (injected) script is deterministic. An in-repo clone
#   keeps the placeholders and runs in fallback/unpinned mode (default spec-kitty
#   version + `latest` pack aliases).
#
# Endpoint URL templates (data-model.md § "Endpoint URL templates"):
#   {base}          = ${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/${ARTEFACTORY_PATH}
#   {base_upstream} = ${REGNOLOGY_BASE_UPSTREAM}   (no hardcoded host)
#   Overlay archive : {base}/ps-agent-enabled-factory-<overlay_pack_version>.tar.gz (+ .sha256)
#   Base archive    : {base_upstream}/regnology-all-company-<base_pack_version>.tar.gz (+ .sha256)
#
# After installation:
#   ~/regnology-agent-stack/
#     .stack-version                          # install manifest
#     packs/
#       regnology-all-company/                # extracted base pack
#       ps-agent-enabled-factory/             # extracted PS overlay pack
#   ~/.local/bin/spec-kitty                   # global binary placed by pipx
#
# Usage:
#   ./install-regnology-stack.sh [OPTIONS]
#
# Options:
#   --spec-kitty-version VER       Override the spec-kitty-cli version to install
#   --pack-version VERSION         Override BOTH pack versions (base + overlay)
#   --install-dir DIR              Installation root (default: ~/regnology-agent-stack)
#   --artefactory-url URL          Artifactory base URL ({base} part 1)
#   --artefactory-repo REPO        Artifactory repo ({base} part 2)
#   --artefactory-path PATH        Artifactory path ({base} part 3)
#   --pack-repo-path PATH          Combined repo/path ({base} parts 2+3, back-compat)
#   --base-upstream URL            Upstream all-company distribution root ({base_upstream})
#   --artefactory-token TOKEN      Artifactory API token (prefer the env var)
#   --dry-run                      Print what would happen without making changes
#   --help                         Show this message
#
# Environment variables (all optional):
#   ARTEFACTORY_URL / REGNOLOGY_ARTEFACTORY_URL    Artifactory base URL
#   ARTEFACTORY_REPO / REGNOLOGY_ARTEFACTORY_REPO  Artifactory repo
#   ARTEFACTORY_PATH / REGNOLOGY_ARTEFACTORY_PATH  Artifactory path
#   REGNOLOGY_PACK_REPO_PATH                       Combined repo/path (back-compat)
#   REGNOLOGY_BASE_UPSTREAM                        Upstream all-company root
#   REGNOLOGY_ARTEFACTORY_TOKEN                    Artifactory API token
#   REGNOLOGY_STACK_DIR                            Installation root directory
#
# Exit codes:
#   0  Success                3  Preflight / download failure
#   1  Usage / argument error 4  Extraction failed
#   2  Required tool missing  5  spec-kitty installation failed
#   6  Integrity (checksum) verification failed

set -e
set -u

SCRIPT_VERSION="3.0.0"
SCRIPT_NAME="$(basename "$0")"

# ---------- build-time-injection tokens (substituted by Jenkins tag build) ----
# These literal @...@ values are the ONLY substitution points (WP01 contract).
# Do NOT reference the literal token text anywhere else, or CI injection would
# rewrite the detection logic too. Placeholder detection uses the @*@ glob.
SPEC_KITTY_VERSION_TOKEN='@SPEC_KITTY_VERSION@'
OVERLAY_PACK_VERSION_TOKEN='@OVERLAY_PACK_VERSION@'
BASE_PACK_VERSION_TOKEN='@BASE_PACK_VERSION@'
RELEASE_TAG_TOKEN='@RELEASE_TAG@'

# Built-in fallback spec-kitty version (used only if config/release-map.yaml is
# not reachable from a clone). Mirrors release-map default_spec_kitty_version.
BUILTIN_DEFAULT_SK_VERSION="main"
SPEC_KITTY_PACKAGE="spec-kitty-cli"
SPEC_KITTY_GIT_URL="https://github.com/Priivacy-ai/spec-kitty.git"

# Build the pipx install spec for a resolved spec-kitty version. A value that
# starts with a digit is a PyPI release (spec-kitty-cli==X); anything else is a
# git ref (branch/tag/SHA) installed from source; a value already beginning with
# "git+" is used verbatim.
sk_install_spec() {
    case "$1" in
        git+*)  printf '%s\n' "$1" ;;
        [0-9]*) printf '%s==%s\n' "$SPEC_KITTY_PACKAGE" "$1" ;;
        *)      printf 'git+%s@%s\n' "$SPEC_KITTY_GIT_URL" "$1" ;;
    esac
}

# ---------- defaults ----------------------------------------------------------

INSTALL_DIR="${REGNOLOGY_STACK_DIR:-$HOME/regnology-agent-stack}"
ARTEFACTORY_URL="${ARTEFACTORY_URL:-${REGNOLOGY_ARTEFACTORY_URL:-}}"
ARTEFACTORY_REPO="${ARTEFACTORY_REPO:-${REGNOLOGY_ARTEFACTORY_REPO:-}}"
ARTEFACTORY_PATH="${ARTEFACTORY_PATH:-${REGNOLOGY_ARTEFACTORY_PATH:-}}"
PACK_REPO_PATH="${REGNOLOGY_PACK_REPO_PATH:-}"
BASE_UPSTREAM="${REGNOLOGY_BASE_UPSTREAM:-}"
ARTEFACTORY_TOKEN="${REGNOLOGY_ARTEFACTORY_TOKEN:-}"
BASE_PACK_NAME="${REGNOLOGY_BASE_PACK_NAME:-regnology-all-company}"
OVERLAY_PACK_NAME="${REGNOLOGY_OVERLAY_PACK_NAME:-ps-agent-enabled-factory}"
SPEC_KITTY_VERSION_OVERRIDE=""
PACK_VERSION_OVERRIDE=""
DRY_RUN=0

# Script directory (used to locate config/release-map.yaml in a clone).
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

# ---------- color output (suppressed when not a TTY) -------------------------

if [ -t 1 ]; then
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
    BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
else
    RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

info()    { printf "${BLUE}[INFO]${NC}  %s\n" "$*"; }
ok()      { printf "${GREEN}[OK]${NC}    %s\n" "$*"; }
warn()    { printf "${YELLOW}[WARN]${NC}  %s\n" "$*"; }
err()     { printf "${RED}[ERROR]${NC} %s\n" "$*" >&2; }
phase()   { printf "\n${BOLD}==> [phase: %s] %s${NC}\n" "$1" "$2"; }
dry_run() { printf "${YELLOW}[DRY-RUN]${NC} would run: %s\n" "$*"; }

# ---------- argument parsing -------------------------------------------------

usage() {
    cat <<EOF
${BOLD}${SCRIPT_NAME}${NC} — Install the Regnology Agent Stack v${SCRIPT_VERSION}

USAGE:
  ${SCRIPT_NAME} [OPTIONS]

OPTIONS:
  --spec-kitty-version VER   Override spec-kitty-cli version to install
  --pack-version VERSION     Override BOTH pack versions (base + overlay)
  --install-dir DIR          Installation root (default: ~/regnology-agent-stack)
  --artefactory-url URL      Artifactory base URL ({base} part 1)
  --artefactory-repo REPO    Artifactory repo ({base} part 2)
  --artefactory-path PATH    Artifactory path ({base} part 3)
  --pack-repo-path PATH      Combined repo/path ({base} parts 2+3, back-compat)
  --base-upstream URL        Upstream all-company root ({base_upstream})
  --artefactory-token TOKEN  Artifactory API token (prefer the env var)
  --dry-run                  Show what would be done without making changes
  --help                     Show this message

ENVIRONMENT:
  ARTEFACTORY_URL / ARTEFACTORY_REPO / ARTEFACTORY_PATH   {base} parts
  REGNOLOGY_BASE_UPSTREAM                                 {base_upstream}
  REGNOLOGY_ARTEFACTORY_TOKEN                             Artifactory API token
  REGNOLOGY_STACK_DIR                                     Installation root
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --spec-kitty-version)  SPEC_KITTY_VERSION_OVERRIDE="$2"; shift 2 ;;
        --spec-kitty-ref)      SPEC_KITTY_VERSION_OVERRIDE="$2"; shift 2 ;;  # back-compat
        --pack-version)        PACK_VERSION_OVERRIDE="$2"; shift 2 ;;
        --install-dir)         INSTALL_DIR="$2"; shift 2 ;;
        --artefactory-url)     ARTEFACTORY_URL="$2"; shift 2 ;;
        --artefactory-repo)    ARTEFACTORY_REPO="$2"; shift 2 ;;
        --artefactory-path)    ARTEFACTORY_PATH="$2"; shift 2 ;;
        --pack-repo-path)      PACK_REPO_PATH="$2"; shift 2 ;;
        --base-upstream)       BASE_UPSTREAM="$2"; shift 2 ;;
        --artefactory-token)   ARTEFACTORY_TOKEN="$2"; shift 2 ;;
        --dry-run)             DRY_RUN=1; shift ;;
        --help|-h)             usage; exit 0 ;;
        *) err "Unknown option: $1"; usage; exit 1 ;;
    esac
done

# ---------- derived paths ----------------------------------------------------

PACKS_DIR="$INSTALL_DIR/packs"
BASE_PACK_DIR="$PACKS_DIR/$BASE_PACK_NAME"
OVERLAY_PACK_DIR="$PACKS_DIR/$OVERLAY_PACK_NAME"
VERSION_FILE="$INSTALL_DIR/.stack-version"
TMP_DIR="$INSTALL_DIR/.tmp-install"

# Platform (manifest field; data-model enum: macos|debian|windows|linux_other).
case "$(uname -s 2>/dev/null || echo unknown)" in
    Darwin) PLATFORM="macos" ;;
    Linux)  if [ -f /etc/debian_version ]; then PLATFORM="debian"; else PLATFORM="linux_other"; fi ;;
    *)      PLATFORM="linux_other" ;;
esac

# ---------- helpers ----------------------------------------------------------

# Placeholder detection: a still-un-injected token looks like @...@.
is_placeholder() {
    case "$1" in
        @*@) return 0 ;;
        *)   return 1 ;;
    esac
}

# Read default_spec_kitty_version from a reachable config/release-map.yaml.
read_default_sk_version() {
    _candidate=""
    for _p in \
        "$SCRIPT_DIR/../../config/release-map.yaml" \
        "$SCRIPT_DIR/config/release-map.yaml" \
        "./config/release-map.yaml"; do
        if [ -f "$_p" ]; then _candidate="$_p"; break; fi
    done
    if [ -n "$_candidate" ]; then
        _v="$(sed -n 's/^[[:space:]]*default_spec_kitty_version:[[:space:]]*//p' "$_candidate" \
                | head -n1 | tr -d '"' | tr -d "'" | tr -d '\r' | awk '{print $1}')"
        if [ -n "$_v" ]; then printf '%s\n' "$_v"; return 0; fi
    fi
    printf '%s\n' "$BUILTIN_DEFAULT_SK_VERSION"
}

# Single, actionable failure block. Args: phase layer url cause remediation.
fail_block() {
    err "Installer failed — aborting before any further action."
    printf '  %-12s %s\n' "phase:"       "$1" >&2
    printf '  %-12s %s\n' "layer:"       "$2" >&2
    printf '  %-12s %s\n' "url:"         "$3" >&2
    printf '  %-12s %s\n' "cause:"       "$4" >&2
    printf '  %-12s %s\n' "remediation:" "$5" >&2
}

# HEAD probe returning an HTTP status code on stdout (000 on network failure).
http_status() {
    _u="$1"
    if [ "$DOWNLOADER" = "curl" ]; then
        if [ -n "$ARTEFACTORY_TOKEN" ]; then
            curl -sI -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 15 \
                --header "X-JFrog-Art-Api: ${ARTEFACTORY_TOKEN}" "$_u" 2>/dev/null || echo 000
        else
            curl -sI -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 15 \
                "$_u" 2>/dev/null || echo 000
        fi
    else
        if wget -q --spider --timeout=15 --tries=1 "$_u" 2>/dev/null; then echo 200; else echo 000; fi
    fi
}

# Probe one layer; on non-200, emit a discriminated failure block and exit.
preflight_layer() {
    _layer="$1"; _url="$2"
    info "Probing ${_layer}: ${_url}"
    if [ "$DRY_RUN" -eq 1 ]; then dry_run "HEAD ${_url}"; return 0; fi
    _code="$(http_status "$_url")"
    case "$_code" in
        200|204|301|302)
            ok "${_layer} reachable (HTTP ${_code})" ;;
        404)
            fail_block "preflight" "$_layer" "$_url" "missing artifact (HTTP 404)" \
                "Check the pack version and the Artifactory repo/path (and ${_layer} upstream root)."
            exit 3 ;;
        401|403)
            fail_block "preflight" "$_layer" "$_url" "access denied (HTTP ${_code})" \
                "Check your entitlement and set REGNOLOGY_ARTEFACTORY_TOKEN to a valid token."
            exit 3 ;;
        *)
            fail_block "preflight" "$_layer" "$_url" "network failure / timeout (HTTP ${_code})" \
                "Check VPN and connectivity to the host; the endpoint did not respond within 15s."
            exit 3 ;;
    esac
}

# Download a URL to a destination (exits 3 on failure).
download_file() {
    _url="$1"; _dest="$2"; _label="${3:-file}"
    info "Downloading ${_label}"
    info "  from: ${_url}"
    if [ "$DRY_RUN" -eq 1 ]; then dry_run "download '${_url}' -> '${_dest}'"; return 0; fi
    if [ "$DOWNLOADER" = "curl" ]; then
        if [ -n "$ARTEFACTORY_TOKEN" ]; then
            curl -fsSL --header "X-JFrog-Art-Api: ${ARTEFACTORY_TOKEN}" -o "$_dest" "$_url" \
                || { err "Download failed: ${_url}"; exit 3; }
        else
            curl -fsSL -o "$_dest" "$_url" || { err "Download failed: ${_url}"; exit 3; }
        fi
    else
        if [ -n "$ARTEFACTORY_TOKEN" ]; then
            wget -q --header="X-JFrog-Art-Api: ${ARTEFACTORY_TOKEN}" -O "$_dest" "$_url" \
                || { err "Download failed: ${_url}"; exit 3; }
        else
            wget -q -O "$_dest" "$_url" || { err "Download failed: ${_url}"; exit 3; }
        fi
    fi
    ok "Downloaded ${_label}"
}

# Compute a lowercase SHA-256 hex digest for a file.
sha256_hex() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}' | tr 'A-Z' 'a-z'
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$1" | awk '{print $1}' | tr 'A-Z' 'a-z'
    else
        err "No SHA-256 tool found (need sha256sum or shasum)."
        exit 2
    fi
}

# Verify a payload against its detached .sha256 BEFORE extraction (FR-012).
verify_checksum() {
    _layer="$1"; _archive="$2"; _shafile="$3"; _artifact="$4"
    if [ "$DRY_RUN" -eq 1 ]; then dry_run "verify SHA-256 of '${_artifact}'"; return 0; fi
    _expected="$(awk '{print $1}' "$_shafile" | head -n1 | tr -d '\r' | tr 'A-Z' 'a-z')"
    _actual="$(sha256_hex "$_archive")"
    if [ -z "$_expected" ]; then
        rm -f "$_archive" "$_shafile"
        fail_block "integrity" "$_layer" "$_artifact" "empty/invalid .sha256 sidecar" \
            "Re-publish the artifact with a valid 64-char hex .sha256 alongside it."
        exit 6
    fi
    if [ "$_expected" = "$_actual" ]; then
        ok "${_layer} checksum verified (${_artifact})"
    else
        rm -f "$_archive"
        err "Checksum MISMATCH for ${_artifact} — partial download removed."
        printf '  %-12s %s\n' "expected:" "$_expected" >&2
        printf '  %-12s %s\n' "actual:"   "$_actual"   >&2
        fail_block "integrity" "$_layer" "$_artifact" "SHA-256 mismatch" \
            "The download is corrupt or tampered; retry, and verify the published checksum."
        exit 6
    fi
}

# Extract a verified archive, stripping the top-level pack/ wrapper.
extract_pack() {
    _pack_name="$1"; _archive="$2"; _pack_dir="$3"
    info "Extracting ${_pack_name} -> ${_pack_dir}"
    if [ "$DRY_RUN" -eq 1 ]; then
        dry_run "tar -xzf '${_archive}' -C '${_pack_dir}' --strip-components=1"
        return 0
    fi
    rm -rf "$_pack_dir"
    mkdir -p "$_pack_dir"
    # --strip-components=1 removes the top-level pack/ dir the Jenkins build wraps.
    tar -xzf "$_archive" -C "$_pack_dir" --strip-components=1 \
        || { err "Extraction failed for ${_pack_name}: ${_archive}"; exit 4; }
    for _req in directives tactics styleguides agent_profiles; do
        if [ ! -d "$_pack_dir/$_req" ]; then
            err "Pack extraction incomplete for ${_pack_name}: missing ${_pack_dir}/${_req}"
            exit 4
        fi
    done
    ok "${_pack_name} extracted and structure verified"
}

# Read a pack's recorded version (manifest field or in-pack .pack-version).
recorded_pack_version() {
    _pack_dir="$1"; _manifest_field="$2"
    if [ -f "$_pack_dir/.pack-version" ]; then
        cat "$_pack_dir/.pack-version" | tr -d '\r' | head -n1
        return 0
    fi
    if [ -f "$VERSION_FILE" ]; then
        sed -n "s/^${_manifest_field}:[[:space:]]*//p" "$VERSION_FILE" | head -n1 | tr -d '\r'
        return 0
    fi
    printf '%s\n' ""
}

# Write the install manifest. Field set is byte-identical with the .ps1 script.
write_manifest() {
    _sk_installed="$1"; _sk_requested="$2"; _base_ver="$3"; _overlay_ver="$4"
    if [ "$DRY_RUN" -eq 1 ]; then dry_run "write manifest to '${VERSION_FILE}'"; return 0; fi
    mkdir -p "$INSTALL_DIR"
    _ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date '+%Y-%m-%dT%H:%M:%SZ')"
    cat > "$VERSION_FILE" <<MANIFEST
# Regnology Agent Stack manifest
installed_at: ${_ts}
spec_kitty_version: ${_sk_installed}
spec_kitty_requested_version: ${_sk_requested}
base_pack_version: ${_base_ver}
overlay_pack_version: ${_overlay_ver}
platform: ${PLATFORM}
MANIFEST
    ok "Manifest written to ${VERSION_FILE}"
}

# ===========================================================================
# PHASE: resolve — version tokens (injected vs fallback/unpinned)
# ===========================================================================

phase "resolve" "Resolving component versions"

if is_placeholder "$SPEC_KITTY_VERSION_TOKEN"; then
    FALLBACK_MODE=1
    SK_RESOLVED="$(read_default_sk_version)"
    SK_REQUESTED="default"
    warn "Running in fallback/unpinned mode (tokens not injected)."
    info "spec-kitty -> $(sk_install_spec "$SK_RESOLVED") (default); packs -> latest aliases"
else
    FALLBACK_MODE=0
    SK_RESOLVED="$SPEC_KITTY_VERSION_TOKEN"
    SK_REQUESTED="$SPEC_KITTY_VERSION_TOKEN"
    info "Running in injected/pinned mode (release ${RELEASE_TAG_TOKEN})."
fi

if is_placeholder "$OVERLAY_PACK_VERSION_TOKEN"; then OVERLAY_VER="latest"; else OVERLAY_VER="$OVERLAY_PACK_VERSION_TOKEN"; fi
if is_placeholder "$BASE_PACK_VERSION_TOKEN"; then BASE_VER="latest"; else BASE_VER="$BASE_PACK_VERSION_TOKEN"; fi

# Explicit CLI overrides win over resolution.
if [ -n "$SPEC_KITTY_VERSION_OVERRIDE" ]; then
    SK_RESOLVED="$SPEC_KITTY_VERSION_OVERRIDE"; SK_REQUESTED="$SPEC_KITTY_VERSION_OVERRIDE"
fi
if [ -n "$PACK_VERSION_OVERRIDE" ]; then
    BASE_VER="$PACK_VERSION_OVERRIDE"; OVERLAY_VER="$PACK_VERSION_OVERRIDE"
fi

# Build endpoint URLs from the data-model templates.
if [ -n "$ARTEFACTORY_REPO" ] && [ -n "$ARTEFACTORY_PATH" ]; then
    ARTIFACTORY_BASE="${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/${ARTEFACTORY_PATH}"
elif [ -n "$PACK_REPO_PATH" ]; then
    ARTIFACTORY_BASE="${ARTEFACTORY_URL}/${PACK_REPO_PATH}"
else
    ARTIFACTORY_BASE="${ARTEFACTORY_URL}"
fi

BASE_ARCHIVE_NAME="${BASE_PACK_NAME}-${BASE_VER}.tar.gz"
OVERLAY_ARCHIVE_NAME="${OVERLAY_PACK_NAME}-${OVERLAY_VER}.tar.gz"
# Base payload comes from the upstream root; overlay from this repo's Artifactory.
BASE_URL="${BASE_UPSTREAM}/${BASE_ARCHIVE_NAME}"
BASE_SHA_URL="${BASE_URL}.sha256"
OVERLAY_URL="${ARTIFACTORY_BASE}/${OVERLAY_ARCHIVE_NAME}"
OVERLAY_SHA_URL="${OVERLAY_URL}.sha256"

BASE_ARCHIVE="$TMP_DIR/${BASE_ARCHIVE_NAME}"
BASE_SHA="$TMP_DIR/${BASE_ARCHIVE_NAME}.sha256"
OVERLAY_ARCHIVE="$TMP_DIR/${OVERLAY_ARCHIVE_NAME}"
OVERLAY_SHA="$TMP_DIR/${OVERLAY_ARCHIVE_NAME}.sha256"

info "Resolved: spec-kitty=${SK_RESOLVED} base=${BASE_PACK_NAME}@${BASE_VER} overlay=${OVERLAY_PACK_NAME}@${OVERLAY_VER}"

# ===========================================================================
# PHASE: idempotency — short-circuit when the stack is already satisfied
# ===========================================================================

phase "idempotency" "Checking for an already-satisfied stack"

# Make a previously pipx-installed spec-kitty discoverable for the check.
case ":$PATH:" in *":$HOME/.local/bin:"*) : ;; *) PATH="$HOME/.local/bin:$PATH" ;; esac

SATISFIED=1
CUR_SK_VERSION=""
if command -v spec-kitty >/dev/null 2>&1; then
    CUR_SK_VERSION="$(spec-kitty --version 2>/dev/null | awk '{print $NF}' || echo "")"
    if [ "$CUR_SK_VERSION" != "$SK_RESOLVED" ]; then SATISFIED=0; fi
else
    SATISFIED=0
fi

# Packs: only verifiable when pinned to a concrete (non-"latest") version.
if [ "$BASE_VER" = "latest" ]; then
    SATISFIED=0
elif [ ! -d "$BASE_PACK_DIR" ] || [ "$(recorded_pack_version "$BASE_PACK_DIR" base_pack_version)" != "$BASE_VER" ]; then
    SATISFIED=0
fi
if [ "$OVERLAY_VER" = "latest" ]; then
    SATISFIED=0
elif [ ! -d "$OVERLAY_PACK_DIR" ] || [ "$(recorded_pack_version "$OVERLAY_PACK_DIR" overlay_pack_version)" != "$OVERLAY_VER" ]; then
    SATISFIED=0
fi

if [ "$SATISFIED" -eq 1 ] && [ "$DRY_RUN" -eq 0 ]; then
    ok "Stack already satisfied — spec-kitty ${CUR_SK_VERSION}, packs at expected versions."
    info "No reinstall performed (idempotent re-run)."
    write_manifest "$CUR_SK_VERSION" "$SK_REQUESTED" "$BASE_VER" "$OVERLAY_VER"
    exit 0
fi
info "Stack not fully satisfied — proceeding with install."

# ===========================================================================
# PHASE: preflight — bounded-timeout probes (base first, then overlay)
# ===========================================================================

phase "preflight" "Probing endpoints before any download"

# Downloader needed for both probe and download.
if command -v curl >/dev/null 2>&1; then
    DOWNLOADER="curl"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOADER="wget"
    warn "curl not found; using wget (cannot fully discriminate 404 vs network)."
else
    err "Neither curl nor wget found. Install one to proceed."
    exit 2
fi

if [ -z "$BASE_UPSTREAM" ] && [ "$DRY_RUN" -eq 0 ]; then
    fail_block "preflight" "base" "$BASE_URL" "missing {base_upstream} configuration" \
        "Set REGNOLOGY_BASE_UPSTREAM (or --base-upstream) to the upstream all-company root."
    exit 3
fi

# C-005: base before overlay, both before any download.
preflight_layer "base" "$BASE_URL"
preflight_layer "overlay" "$OVERLAY_URL"

# ===========================================================================
# PHASE: integrity — download payloads + .sha256, verify BEFORE extraction
# ===========================================================================

phase "integrity" "Downloading and verifying payloads (no extraction yet)"

if [ "$DRY_RUN" -eq 0 ]; then mkdir -p "$TMP_DIR"; fi

# Base first.
download_file "$BASE_URL" "$BASE_ARCHIVE" "${BASE_PACK_NAME} archive"
download_file "$BASE_SHA_URL" "$BASE_SHA" "${BASE_PACK_NAME} checksum"
verify_checksum "base" "$BASE_ARCHIVE" "$BASE_SHA" "$BASE_ARCHIVE_NAME"

# Then overlay.
download_file "$OVERLAY_URL" "$OVERLAY_ARCHIVE" "${OVERLAY_PACK_NAME} archive"
download_file "$OVERLAY_SHA_URL" "$OVERLAY_SHA" "${OVERLAY_PACK_NAME} checksum"
verify_checksum "overlay" "$OVERLAY_ARCHIVE" "$OVERLAY_SHA" "$OVERLAY_ARCHIVE_NAME"

# ===========================================================================
# PHASE: deps — prerequisites for install/extraction
# ===========================================================================

phase "deps" "Checking prerequisites"

check_tool() {
    if ! command -v "$1" >/dev/null 2>&1; then err "Required tool not found: $1"; return 1; fi
    ok "$1 found: $(command -v "$1")"
}

PYTHON=""
for _candidate in python3 python; do
    if command -v "$_candidate" >/dev/null 2>&1; then
        if "$_candidate" -c "import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)" 2>/dev/null; then
            PYTHON="$_candidate"
            ok "Python found: $("$PYTHON" --version 2>&1)"
            break
        fi
    fi
done
if [ -z "$PYTHON" ]; then
    err "Python 3.12+ is required but not found."
    exit 2
fi

check_tool git || exit 2
check_tool tar || exit 2

if command -v pipx >/dev/null 2>&1; then
    ok "pipx found: $(command -v pipx)"
else
    info "pipx not found — attempting installation..."
    if [ "$DRY_RUN" -eq 0 ]; then
        "$PYTHON" -m pip install --user --quiet pipx \
            || { err "Failed to install pipx automatically. Install: pip install --user pipx"; exit 2; }
        USER_BASE="$("$PYTHON" -c 'import site; print(site.getuserbase())')"
        export PATH="$USER_BASE/bin:$PATH"
        command -v pipx >/dev/null 2>&1 \
            || { err "pipx installed but not on PATH. Add '$USER_BASE/bin' to PATH and re-run."; exit 2; }
        ok "pipx installed: $(command -v pipx)"
    else
        dry_run "install pipx (brew/apt-get preferred, pip fallback)"
    fi
fi

# ===========================================================================
# PHASE: spec-kitty — install the pinned/fallback CLI version via pipx
# ===========================================================================

SK_INSTALL_SPEC="$(sk_install_spec "$SK_RESOLVED")"
phase "spec-kitty" "Installing spec-kitty (${SK_INSTALL_SPEC})"

if [ "$DRY_RUN" -eq 0 ]; then
    pipx install --force "${SK_INSTALL_SPEC}" \
        || { err "spec-kitty installation failed: ${SK_INSTALL_SPEC}"; exit 5; }
    INSTALLED_SK_VERSION="$(spec-kitty --version 2>/dev/null | awk '{print $NF}' || echo "$SK_RESOLVED")"
    ok "spec-kitty installed: ${INSTALLED_SK_VERSION}"
    command -v spec-kitty >/dev/null 2>&1 \
        || warn "spec-kitty not yet on PATH — run 'pipx ensurepath' and reload your shell."
else
    dry_run "pipx install --force '${SK_INSTALL_SPEC}'"
    INSTALLED_SK_VERSION="${SK_RESOLVED} (dry-run)"
fi

# ===========================================================================
# PHASE: layers — extract verified archives (base -> overlay)
# ===========================================================================

phase "layers" "Applying doctrine packs (base -> overlay)"

if [ "$DRY_RUN" -eq 0 ]; then mkdir -p "$PACKS_DIR"; fi

extract_pack "$BASE_PACK_NAME" "$BASE_ARCHIVE" "$BASE_PACK_DIR"
INSTALLED_BASE_PACK_VERSION="$BASE_VER"
if [ "$DRY_RUN" -eq 0 ] && [ -f "$BASE_PACK_DIR/.pack-version" ]; then
    INSTALLED_BASE_PACK_VERSION="$(cat "$BASE_PACK_DIR/.pack-version" | tr -d '\r' | head -n1)"
fi

extract_pack "$OVERLAY_PACK_NAME" "$OVERLAY_ARCHIVE" "$OVERLAY_PACK_DIR"
INSTALLED_OVERLAY_PACK_VERSION="$OVERLAY_VER"
if [ "$DRY_RUN" -eq 0 ] && [ -f "$OVERLAY_PACK_DIR/.pack-version" ]; then
    INSTALLED_OVERLAY_PACK_VERSION="$(cat "$OVERLAY_PACK_DIR/.pack-version" | tr -d '\r' | head -n1)"
fi

# ===========================================================================
# PHASE: completion — manifest, cleanup, next steps
# ===========================================================================

phase "completion" "Writing manifest and cleaning up"

write_manifest "$INSTALLED_SK_VERSION" "$SK_REQUESTED" \
    "$INSTALLED_BASE_PACK_VERSION" "$INSTALLED_OVERLAY_PACK_VERSION"

if [ "$DRY_RUN" -eq 0 ] && [ -d "$TMP_DIR" ]; then rm -rf "$TMP_DIR"; fi

cat <<NEXTSTEPS

${GREEN}${BOLD}Regnology Agent Stack installed successfully.${NC}

  spec-kitty:    ${INSTALLED_SK_VERSION}  (requested: ${SK_REQUESTED})
  base pack:     ${BASE_PACK_NAME} ${INSTALLED_BASE_PACK_VERSION}
  overlay pack:  ${OVERLAY_PACK_NAME} ${INSTALLED_OVERLAY_PACK_VERSION}
  install root:  ${INSTALL_DIR}
  platform:      ${PLATFORM}

${BOLD}Ensure spec-kitty is on your PATH:${NC}

  pipx ensurepath        # run once, then reload your shell
  spec-kitty --version   # verify

${BOLD}Wire the packs into an engagement repo (.kittify/config.yaml):${NC}

  doctrine:
    org:
      packs:
        - name: ${BASE_PACK_NAME}
          local_path: ${PACKS_DIR}
          source_type: local
        - name: ${OVERLAY_PACK_NAME}
          local_path: ${PACKS_DIR}
          source_type: local
NEXTSTEPS
