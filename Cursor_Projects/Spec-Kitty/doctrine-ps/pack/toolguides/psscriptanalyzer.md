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

# PSScriptAnalyzer — PowerShell Static Analysis

| Field | Value |
|-------|-------|
| Tool | PSScriptAnalyzer |
| Platform | PowerShell 7+ (cross-platform) |
| Purpose | Static analysis, linting, and security checking for PowerShell code |
| Install | `Install-Module PSScriptAnalyzer -Scope CurrentUser -Force` |

---

## 1. Overview

PSScriptAnalyzer is the standard linter for PowerShell. It checks scripts and modules
against configurable rules covering:

- **Code quality** — unused variables, missing output types, cmdlet alias usage
- **Style** — verb-noun naming, parameter casing, brace placement
- **Security** — Invoke-Expression usage, plaintext credentials, missing input validation
- **Compatibility** — PSEdition, OS-specific API usage

---

## 2. Basic Usage

```powershell
# Lint all scripts in a directory recursively
Invoke-ScriptAnalyzer -Path ./Public -Recurse

# Filter by severity
Invoke-ScriptAnalyzer -Path ./Module.psm1 -Severity Error,Warning

# Use the PSGallery preset (stricter)
Invoke-ScriptAnalyzer -Path . -Recurse -Settings PSGallery
```

---

## 3. Rule Management

```powershell
# List all available rules
Get-ScriptAnalyzerRule

# List only security-related rules
Get-ScriptAnalyzerRule -Severity Error | Where-Object RuleName -like '*Security*'

# Exclude specific rules
Invoke-ScriptAnalyzer -Path . -Recurse -ExcludeRule PSAvoidUsingWriteHost
```

### Per-Function Suppression

Use the `SuppressMessageAttribute` to suppress a rule for a specific function with documented rationale:

```powershell
function Write-StatusLine {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute(
        'PSAvoidUsingWriteHost', '',
        Justification = 'Status output intentionally uses Write-Host for colour')]
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}
```

---

## 4. Custom Settings File

Create a `.PSScriptAnalyzerSettings.psd1` at the project root:

```powershell
@{
    Severity     = @('Error', 'Warning')
    ExcludeRules = @('PSAvoidUsingWriteHost')
    Rules        = @{
        PSUseCompatibleSyntax = @{
            Enable         = $true
            TargetVersions = @('7.0')
        }
    }
}
```

Then invoke with the settings file:

```powershell
Invoke-ScriptAnalyzer -Path . -Recurse -Settings .PSScriptAnalyzerSettings.psd1
```

---

## 5. Security-Relevant Rules

| Rule | Risk | Mitigation |
|------|------|------------|
| `PSAvoidUsingInvokeExpression` | Code injection | Use `& operator` or `Invoke-Command` with controlled input |
| `PSAvoidUsingPlainTextForPassword` | Credential leak | Use `[SecureString]` or `Get-Secret` |
| `PSAvoidUsingConvertToSecureStringWithPlainText` | Weak credential handling | Read from secret store, never hardcode |
| `PSUseShouldProcessForStateChangingFunctions` | Unintended side effects | Add `[CmdletBinding(SupportsShouldProcess)]` |

---

## 6. CI Integration

In `build.ps1`:

```powershell
'Lint' {
    $results = Invoke-ScriptAnalyzer -Path ./Public,./Private -Recurse -Severity Error,Warning
    if ($results) {
        $results | Format-Table -AutoSize
        throw "PSScriptAnalyzer found $($results.Count) issue(s)"
    }
    Write-Host 'PSScriptAnalyzer: clean' -ForegroundColor Green
}
```

---

## 7. Related Pack Artifacts

| Artifact | Purpose |
|----------|---------|
| `powershell-conventions` (styleguide) | Coding standards enforced by PSScriptAnalyzer rules |
| `powershell-script-quality-gate` (tactic) | Pre-handoff checklist referencing PSScriptAnalyzer |
| `pester` (toolguide) | Testing framework used alongside static analysis |
