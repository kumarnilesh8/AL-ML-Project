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

---
artifact: ps-intake-trace
project: [project name]
seed_ticket: [absolute Jira/Confluence URL, or null]
date: YYYY-MM-DD
operator: [name / account]
status: [in-progress | complete | blocked]
blocked_if_unresolved: [list of open items that block completion, or none]
---

# Intake Trace: [Project name]

> One trace per project intake. Fill top-to-bottom while running the
> `ps-project-intake` procedure. An incomplete section with an unresolved item
> listed in `blocked_if_unresolved` means the intake is **not** complete.

## 0. Profile loaded

- **Profile:** [which specialist profile was loaded and why it fit]

## 1. Interview answers

_Capture one block per dimension. "Unknown" is a valid answer — record it and
carry it into `blocked_if_unresolved` if it blocks Epic creation._

| Dimension | Answer |
|---|---|
| Identity & why (what problem, for whom) | |
| Maturity (idea / POC / partial repo / existing) | |
| In scope | |
| Out of scope | |
| Definition of done (binary) | |
| Work item type | |
| Handoff / stakeholders | |
| Repository (exists? where? or to be created) | |
| Tech stack | |

## 2. Reality reconciliation

- **What was inspected:** [repo URL, POC, docs actually reviewed]
- **Discrepancies vs interview:** [naming, scope, stack differences found]
- **Resolved naming / scope:** [the reconciled truth used downstream]

## 3. Jira resolution evidence (live)

- **Project key source:** [how the key was resolved — jira_list_projects result]
- **Issue types / field schema:** [Epic / Story issue types + key custom-field IDs resolved live via jira_get_create_meta for this project]
- **Assignee(s):** [username(s) used — Server/DC usernames, resolved/confirmed, not guessed]

## 4. Consent log

_One row per external write action. Paste the human's exact words (verbatim) as
the consent quote — a paraphrase does not count. No consent quote → the action
did not happen (Directive 044)._

| Action | Consent quote (verbatim) | Timestamp |
|---|---|---|
| Create Epic | | |
| Create first stories | | |
| Create/scaffold repo (if any) | | |
| Push (if any) | | |

## 5. Artifacts created

- **Epic:** [KEY + absolute URL]
- **Stories:** [KEYs incl. the "(initial intake)" story]
- **Repository:** [URL, or n/a]

## 6. Verification

- **JQL run:** `[query]`
- **Result:** [count + keys returned]
- **Link-back to seed ticket:** [semantic link type + evidence]

## 7. Open follow-ups

- [Anything deferred out of this intake — e.g. deeper decomposition]
