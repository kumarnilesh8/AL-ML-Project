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

# Pester — PowerShell Testing Framework

| Field | Value |
|-------|-------|
| Tool | Pester 5.x |
| Platform | PowerShell 7+ (cross-platform) |
| Purpose | Unit, integration, and acceptance testing for PowerShell modules and scripts |
| Install | `Install-Module Pester -Scope CurrentUser -Force -MinimumVersion 5.0.0` |

---

## 1. Core Concepts

Pester organises tests into a hierarchy:

- **Describe** — groups tests for a function, module, or feature
- **Context** — optional sub-grouping within a Describe (e.g. "when input is valid")
- **It** — a single test case asserting one behaviour
- **Should** — assertion operator (`-Be`, `-BeExactly`, `-Throw`, `-HaveCount`, etc.)

```powershell
Describe 'Get-Greeting' {
    Context 'when a name is provided' {
        It 'returns a personalised greeting' {
            Get-Greeting -Name 'Ada' | Should -Be 'Hello, Ada'
        }
    }
    Context 'when no name is provided' {
        It 'throws a parameter error' {
            { Get-Greeting } | Should -Throw
        }
    }
}
```

---

## 2. Setup and Teardown

| Block | Scope | Runs |
|-------|-------|------|
| `BeforeAll` | Describe / Context | Once before all It blocks |
| `BeforeEach` | Describe / Context | Before every It block |
| `AfterEach` | Describe / Context | After every It block |
| `AfterAll` | Describe / Context | Once after all It blocks |

```powershell
Describe 'Database operations' {
    BeforeAll {
        $connection = New-TestDatabaseConnection
    }
    AfterAll {
        $connection | Close-TestDatabaseConnection
    }
    BeforeEach {
        Reset-TestData -Connection $connection
    }
    It 'inserts a record' {
        Add-Record -Connection $connection -Name 'Test'
        Get-RecordCount -Connection $connection | Should -Be 1
    }
}
```

---

## 3. Mocking

Pester can mock any command within a Describe scope:

```powershell
Describe 'Send-Report' {
    BeforeAll {
        Mock Send-MailMessage {}
        Mock Get-ReportData { return @{ Total = 42 } }
    }
    It 'sends exactly one email' {
        Send-Report -To 'team@regnology.net'
        Should -Invoke Send-MailMessage -Times 1 -Exactly
    }
}
```

To test **private** module functions, use `InModuleScope`:

```powershell
Describe 'Format-InternalData' {
    It 'formats correctly' {
        InModuleScope 'MyModule' {
            Format-InternalData -Raw 'test' | Should -Be 'TEST'
        }
    }
}
```

---

## 4. Code Coverage

```powershell
$config = New-PesterConfiguration
$config.CodeCoverage.Enabled = $true
$config.CodeCoverage.Path = @('./Public', './Private')
$config.CodeCoverage.OutputFormat = 'JaCoCo'
$config.CodeCoverage.OutputPath = './coverage.xml'
Invoke-Pester -Configuration $config
```

---

## 5. CI Integration

For build pipelines, use `-Output CI` or a configuration object:

```powershell
$config = New-PesterConfiguration
$config.Run.Path = './Tests'
$config.Run.Exit = $true
$config.Output.Verbosity = 'Detailed'
$config.TestResult.Enabled = $true
$config.TestResult.OutputFormat = 'JUnitXml'
$config.TestResult.OutputPath = './test-results.xml'
Invoke-Pester -Configuration $config
```

---

## 6. Related Pack Artifacts

| Artifact | Purpose |
|----------|---------|
| `powershell-conventions` (styleguide) | Pester Describe/It pattern and naming rules |
| `powershell-pester-workflow` (procedure) | End-to-end test authoring and execution workflow |
| `powershell-script-quality-gate` (tactic) | Pre-handoff quality checklist including test pass |
