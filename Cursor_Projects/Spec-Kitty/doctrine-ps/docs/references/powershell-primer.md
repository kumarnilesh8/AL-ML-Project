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

# PowerShell Primer (Reference)

| Field | Value |
|-------|-------|
| Source author | Stijn Dejongh |
| Source date | 2025-11-13 |
| Status | Derived from draft primer — **styleguide is authoritative for enforcement** |
| Related | `pack/styleguides/powershell-conventions.styleguide.yaml` |

> **Enforcement note:** Pack validation and agent routing use
> `powershell-conventions.styleguide.yaml` as the contract. This reference document
> provides depth and learning context only.

---

## 1. Language Philosophy

PowerShell is a task automation framework combining a command-line shell and scripting
language built on .NET. Unlike traditional Unix shells that pass text between commands,
PowerShell passes **structured objects** through the pipeline. That design enables
composable automation: each cmdlet reads objects, transforms them, and emits objects for
the next command.

For Regnology engagements, default to **PowerShell 7+** (`pwsh`) for cross-platform
automation. Use Windows PowerShell 5.1 only when a charter explicitly requires legacy
Windows-only modules.

---

## 2. Cmdlets and Verb-Noun Naming

Cmdlets follow the **Verb-Noun** pattern with approved verbs (`Get-`, `Set-`, `New-`,
`Remove-`, `Invoke-`, etc.). Functions you author should mirror this pattern so operators
can discover intent quickly.

| Element | Convention | Example |
|---------|------------|---------|
| Variables | `$camelCase` | `$serviceName` |
| Parameters | `-PascalCase` | `-ResourceGroupName` |
| Functions | `Verb-Noun` | `Get-DeploymentStatus` |

---

## 3. Pipeline Patterns

Preserve objects until the final presentation step. Formatting cmdlets (`Format-Table`,
`Format-List`, `Out-String`) destroy the object stream for downstream cmdlets.

```powershell
# Good: filter and sort on objects, format last
Get-Service |
    Where-Object Status -eq 'Running' |
    Sort-Object DisplayName |
    Select-Object DisplayName, Status |
    Format-Table -AutoSize
```

See the **Pipeline Object Preservation** pattern in `powershell-conventions`.

---

## 4. Module Structure

Reusable modules should include:

- `<ModuleName>.psd1` — manifest (version, exports, dependencies)
- `<ModuleName>.psm1` — root module dot-sourcing Public/Private scripts
- `Public/` — exported functions (one per file recommended)
- `Private/` — internal helpers
- `Tests/` — Pester tests (`*.Tests.ps1`)
- `build.ps1` — Lint / Test / Build / Clean tasks

Apply the `powershell-module-scaffold` tactic when bootstrapping a new module.

---

## 5. Testing with Pester

Pester 5.x uses `Describe` / `Context` / `It` blocks with `Should` assertions.

```powershell
Describe 'Get-Greeting' {
    It 'returns a personalised greeting' {
        Get-Greeting -Name 'Ada' | Should -Be 'Hello, Ada'
    }
}
```

Run tests locally:

```powershell
Invoke-Pester -Path ./Tests -Output Detailed
```

Integrate via `build.ps1 -Task Test`. See `powershell-pester-workflow` tactic.

---

## 6. Quality, Strict Mode, and Safety

Before handoff:

1. **PSScriptAnalyzer** — lint Public/, Private/, and scripts
2. **Set-StrictMode -Version Latest** — catch undefined variables early
3. **#Requires -Version 7.0** — on entry scripts
4. **C-001 baseline** — no secrets in repo, no `Invoke-Expression` on untrusted input,
   declare gallery dependencies in the manifest

Use `powershell-script-quality-gate` for the full checklist. When an engagement charter
classifies PowerShell artifacts as deliverable application software, the DevOps specialist
integrates SonarQube, SBOM, and CI gates — the PowerShell specialist delivers
script/module quality at source.

---

## 7. Error Handling

Use terminating errors inside `try/catch`:

```powershell
try {
    Get-Content -Path $Path -ErrorAction Stop
} catch {
    Write-Error "Failed to read '$Path': $($_.Exception.Message)"
    throw
}
```

---

## 8. Cross-Platform `pwsh`

PowerShell 7 runs on Windows, Linux, and macOS. Prefer `$PSScriptRoot`, `[IO.Path]::Combine`,
and .NET APIs over Windows-only paths. Test automation on the target platform when paths
or module availability differ.

---

## 9. Related Resources

| Resource | Purpose |
|----------|---------|
| `pack/styleguides/powershell-conventions.styleguide.yaml` | Enforceable contract |
| `pack/tactics/powershell-module-scaffold.tactic.yaml` | Bootstrap module layout |
| `pack/procedures/powershell-pester-workflow.procedure.yaml` | Author and run tests |
| `pack/tactics/powershell-script-quality-gate.tactic.yaml` | Lint and security baseline |
| `pack/toolguides/pester.toolguide.yaml` | Pester testing framework reference |
| `pack/toolguides/psscriptanalyzer.toolguide.yaml` | PSScriptAnalyzer static analysis reference |
| `pack/templates/powershell/powershell-module-layout.md` | Module project scaffold template |
| `.kittify/memory/templates/POWERSHELL_SYNTAX.md` | spec-kitty CLI invocations in PowerShell shells |

---

## Attribution

Adapted from the **PowerShell Primer** by **Stijn Dejongh** (2025-11-13, draft), distilled
for Regnology Professional Services internal use. The pack styleguide remains the
authoritative enforcement surface for PowerShell Peter and engagement reviewers.
