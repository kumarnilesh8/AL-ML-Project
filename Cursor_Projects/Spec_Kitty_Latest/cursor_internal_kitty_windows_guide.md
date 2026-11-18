# Internal Kitty Windows guide
_Exported on 7/21/2026 at 15:31:29 GMT+4 from Cursor (3.12.10)_

---

**User**

@Spec_Kitty_Latest/INTERNAL_KITTY_WINDOWS_INSTALL_GUIDE.md  Follow this guide end to end

---

**Cursor**

I’ll follow the Windows install guide from the referenced file and verify each step as I go, starting by reading the guide and checking the workspace layout.

I’m Receptionist Rob for this setup: I’ll check the machine, install Spec Kitty, add the doctrine pack, wire it 

**Setup Confirmations**

> **Do you have Cursor installed and open on this machine?**
> - Yes (Recommended) ✔
> - No / not sure

> **Are you connected to the Regnology VPN right now?**
> - Yes (Recommended) ✔
> - No / not sure

into `C:\code`, and verify the result. Before I touch the internal Regnology sources, I need two quick confirmations.

Confirmed. I’m creating/using `C:\code` now, then I’ll verify the VPN path plus Python and Git before installing anything internal.

`C:\code` is ready, the Artifactory endpoint is reachable over VPN, and both Python and Git are already present. I’m installing the Regnology CLI from Artifactory next and removing any legacy open-source package that could shadow it.

The CLI install is running now. Since it uses the internal package feed and may take a bit, I’ll wait for the result before changing the profile or project configuration.

The Regnology package installed successfully and the inline command reports `regnology-spec-kitty-cli version 3.2.5+rgn.10`. I’m applying the permanent `spec-kitty` launcher now so new terminals use the Python-based wrapper instead of the blocked `.exe`.

The permanent wrapper and profile snippet are written. The fresh-shell check hit a Windows PATH quirk when launching `powershell` by name, so I’m rerunning the same check through the explicit PowerShell executable path.

The permanent command now verifies from a fresh PowerShell session and reports the Regnology build. Next I’m initializing `C:\code` as a Git workspace and refreshing the Regnology doctrine pack from Artifactory.

The doctrine download and extraction are in progress. I’ll wait for it to finish before running `spec-kitty init`, because the config needs the exact pack path.

The doctrine pack refreshed successfully at `C:\code\.regnology\doctrine-org\pack`. Git is installed, but this shell lost the Git PATH entry after the launcher PATH update, so I’m locating Git directly and then finishing the repository initialization.

Git is now initialized in `C:\code`, and I restored Git’s user PATH entry while keeping the `spec-kitty` wrapper available. I’m running `spec-kitty init` next, then I’ll inspect and update the generated config to point at the doctrine pack.

Before editing configuration, I’m making the `spec-kitty init` change that creates the project’s `.kittify` setup under `C:\code`.

`spec-kitty.cmd` exposed a machine-specific issue: PowerShell can find Python, but `cmd.exe` cannot resolve `python` inside the wrapper. I’m updating the wrapper to use the detected Python executable path, then I’ll rerun initialization.

The wrapper update attempt did not complete cleanly, so I’m checking the captured output and will adjust it with the exact Python path instead of guessing.

Python itself is installed, but this long-lived shell’s PATH is now unreliable. I’m locating the actual `python.exe` on disk and using that explicit path for the wrapper and remaining setup steps.

I found and corrected the root cause: my earlier PATH update accidentally wrote a bad placeholder entry into the user PATH. I’m cleaning that up now, using the Windows `py` launcher for `spec-kitty`, and then I’ll rerun the fresh-shell verification.

That last cleanup script had a quoting typo before it made changes. I’m rerunning the corrected cleanup and verification now.

The same PATH assignment typo was still present. I’m simplifying that line and proceeding with the actual cleanup.

The PATH is clean again, `py` works, and both the `.cmd` wrapper and fresh PowerShell profile check report the Regnology Spec Kitty version. I’m rerunning `spec-kitty init` now.

`spec-kitty init` completed and created the project setup under `C:\code`. I’m reading the generated config and adding the doctrine `local_path` to the downloaded Regnology pack.

The config does not yet have a doctrine section, so I’m adding the pack reference at `C:/code/.regnology/doctrine-org/pack`.

The doctrine path is now in `.kittify/config.yaml`. I’m verifying that Spec Kitty can load the pack and that the artifact counts are non-zero.

Doctrine verification passed: the Regnology pack loaded with non-zero artifact counts and `org-charter.yaml` present. The warning shown is the known informational packaging warning from the guide, so I’m moving on to the optional Cursor rule install.

I’m attempting the optional Cursor Kitty invocation rule now. If Artifactory cannot provide it, the core Spec Kitty setup will still remain complete.

The optional Cursor rule installed in both the user-level and `C:\code` workspace rule folders. I’m doing a final sanity pass now: command availability, doctrine check, and any editor diagnostics on the config I changed.

Setup completed end to end.

PASS: VPN reachable, Python and Git ready, Regnology Spec Kitty installed, `spec-kitty` command works, `C:\code` is a Git repo, and the doctrine pack loads from `C:/code/.regnology/doctrine-org/pack`.

PASS: Optional Cursor Kitty rule installed in both:
`C:\Users\NileshKumar\.cursor\rules`
`C:\code\.cursor\rules`

Verified version:
`regnology-spec-kitty-cli version 3.2.5+rgn.10`

Note: `spec-kitty doctor doctrine` shows the known informational `terminology-guard.toolguide.yaml` warning from the guide, but the pack loads correctly with non-zero artifact counts and `org-charter.yaml` present.

Next: re-open `C:\code` in Cursor. In a new terminal, run `spec-kitty --version` to sanity-check. When ready to set up governance for this project, run `spec-kitty charter interview`.

