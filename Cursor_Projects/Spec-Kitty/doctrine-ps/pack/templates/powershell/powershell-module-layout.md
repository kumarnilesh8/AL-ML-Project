---
template: powershell-module-layout
version: "1.0"
styleguide: powershell-conventions
---

<!--
████          R E G N O L O G Y
    ██        Professional Services
████
    ██        professional_services@regnology.net

PowerShell Module Layout Template
Apply when bootstrapping a new reusable PowerShell module.
Companion to: powershell-conventions (styleguide), powershell-module-scaffold (tactic).
-->

# {ModuleName}

> One-line description of what the module does.

## Directory Structure

```
{ModuleName}/
├── {ModuleName}.psd1          # Module manifest (version, exports, dependencies)
├── {ModuleName}.psm1          # Root module — dot-sources Public/ and Private/
├── Public/                    # Exported functions (one per file, Verb-Noun.ps1)
│   ├── Get-{Resource}.ps1
│   ├── Set-{Resource}.ps1
│   └── New-{Resource}.ps1
├── Private/                   # Internal helpers (not exported)
│   └── Resolve-{Internal}.ps1
├── Tests/                     # Pester 5.x tests
│   ├── Get-{Resource}.Tests.ps1
│   ├── Set-{Resource}.Tests.ps1
│   └── {ModuleName}.Tests.ps1
├── build.ps1                  # Task runner: Lint, Test, Build, Clean
└── README.md                  # Usage, installation, examples
```

## Module Manifest (`{ModuleName}.psd1`)

<!-- Fill in the placeholders. Remove comments before committing. -->

```powershell
@{
    RootModule        = '{ModuleName}.psm1'
    ModuleVersion     = '0.1.0'
    GUID              = '{generate-a-new-guid}'
    Author            = '{Author Name}'
    CompanyName       = 'Regnology Group GmbH'
    Description       = '{One-line description}'
    PowerShellVersion = '7.0'
    FunctionsToExport = @(
        'Get-{Resource}'
        'Set-{Resource}'
        'New-{Resource}'
    )
    CmdletsToExport   = @()
    VariablesToExport  = @()
    AliasesToExport    = @()
    RequiredModules    = @(
        # @{ ModuleName = 'Pester'; ModuleVersion = '5.0.0' }
    )
    PrivateData = @{
        PSData = @{
            Tags       = @('{domain}', 'regnology')
            ProjectUri = '{repository-url}'
        }
    }
}
```

## Root Module (`{ModuleName}.psm1`)

```powershell
#Requires -Version 7.0
Set-StrictMode -Version Latest

$publicFunctions = Get-ChildItem -Path "$PSScriptRoot/Public" -Filter '*.ps1' -ErrorAction SilentlyContinue
$privateFunctions = Get-ChildItem -Path "$PSScriptRoot/Private" -Filter '*.ps1' -ErrorAction SilentlyContinue

foreach ($function in @($privateFunctions; $publicFunctions)) {
    . $function.FullName
}

Export-ModuleMember -Function $publicFunctions.BaseName
```

## Public Function Template (`Public/Get-{Resource}.ps1`)

```powershell
function Get-{Resource} {
    <#
    .SYNOPSIS
        {Brief description of what this function does.}
    .DESCRIPTION
        {Detailed description including behaviour, assumptions, and limitations.}
    .PARAMETER {ParameterName}
        {Description of the parameter.}
    .EXAMPLE
        Get-{Resource} -Name 'Example'
        {Description of what this example does.}
    .OUTPUTS
        [{OutputType}]
    #>
    [CmdletBinding()]
    [OutputType([{OutputType}])]
    param(
        [Parameter(Mandatory)]
        [ValidateNotNullOrEmpty()]
        [string]${ParameterName}
    )

    # Implementation here
}
```

## Test Template (`Tests/Get-{Resource}.Tests.ps1`)

```powershell
Describe 'Get-{Resource}' {
    BeforeAll {
        Import-Module "$PSScriptRoot/../{ModuleName}.psd1" -Force
    }

    Context 'when called with valid input' {
        It 'returns the expected result' {
            $result = Get-{Resource} -Name 'Test'
            $result | Should -Not -BeNullOrEmpty
        }
    }

    Context 'when called with invalid input' {
        It 'throws a meaningful error' {
            { Get-{Resource} -Name '' } | Should -Throw
        }
    }
}
```

## build.ps1 Template

```powershell
#!/usr/bin/env pwsh
#Requires -Version 7.0
<#
.SYNOPSIS
    Task runner for {ModuleName}.
.EXAMPLE
    ./build.ps1 -Task Test
#>
param(
    [ValidateSet('Lint', 'Test', 'Build', 'Clean')]
    [string]$Task = 'Build'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

switch ($Task) {
    'Lint' {
        Write-Host '--- PSScriptAnalyzer ---' -ForegroundColor Cyan
        $results = Invoke-ScriptAnalyzer -Path ./Public, ./Private -Recurse -Severity Error, Warning
        if ($results) {
            $results | Format-Table -AutoSize
            throw "PSScriptAnalyzer found $($results.Count) issue(s)"
        }
        Write-Host 'PSScriptAnalyzer: clean' -ForegroundColor Green
    }
    'Test' {
        Write-Host '--- Pester ---' -ForegroundColor Cyan
        $config = New-PesterConfiguration
        $config.Run.Path = './Tests'
        $config.Run.Exit = $true
        $config.Output.Verbosity = 'Detailed'
        Invoke-Pester -Configuration $config
    }
    'Build' {
        Write-Host '--- Build ---' -ForegroundColor Cyan
        & $PSScriptRoot/build.ps1 -Task Lint
        & $PSScriptRoot/build.ps1 -Task Test
        Test-ModuleManifest -Path "./{ModuleName}.psd1"
        Write-Host 'Build: OK' -ForegroundColor Green
    }
    'Clean' {
        Write-Host '--- Clean ---' -ForegroundColor Cyan
        Remove-Item -Path ./coverage.xml, ./test-results.xml -ErrorAction SilentlyContinue
        Write-Host 'Clean: done' -ForegroundColor Green
    }
}
```

## Checklist

- [ ] Module manifest (.psd1) created with explicit FunctionsToExport
- [ ] Root module (.psm1) dot-sources Public/ and Private/
- [ ] At least one public function with comment-based help
- [ ] At least one Pester test per public function
- [ ] build.ps1 Lint and Test tasks operational
- [ ] `#Requires -Version 7.0` on entry scripts
- [ ] `Set-StrictMode -Version Latest` in root module
- [ ] No secrets, credentials, or hardcoded connection strings
- [ ] PSScriptAnalyzer passes with 0 Errors and 0 Warnings
