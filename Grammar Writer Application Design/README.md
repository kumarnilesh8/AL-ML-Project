# Grammar Writer

Turns a plain-language requirement into a valid Regnology regulatory expression, following the grammar of the detected sub-topic. Built as a single self-contained Design Component (`Grammar Writer.dc.html`).

## What it does
- **Auto-detects the grammar sub-topic** from the wording of your ask (override it any time from the left list).
- **Generates a formula** that follows that sub-topic's grammar, using only elements from the grammar dictionary.
- **Explains** the formula in plain English and **validates** it — flagging any token not found in the grammar (a grammar lint).
- **Saves history** in the browser (localStorage) so you can revisit past generations.
- **Live grammar reference** on the right: every element of the active sub-topic, searchable.

## Running it without Claude (standalone on your PC)

There are two ways. **Option A is the easiest** and needs no tools.

### Option A — Single self-contained file (recommended)
`Grammar Writer (standalone).html` is one file with everything embedded — the app, the runtime, the fonts, the logo, and the full grammar dictionary. No server, no install.

1. Copy `Grammar Writer (standalone).html` to any PC (or a shared drive).
2. Double-click it — it opens in the default browser (Chrome/Edge/Firefox).
3. Type a requirement and **Generate**.

The machine needs internet only for the LLM call itself. With a shared key baked in (below), users do **not** need to enter anything.

### Option B — Host one instance for everyone on the network
Use this if you want a single shared URL instead of distributing a file.

1. Put this whole folder on the host PC.
2. Open a terminal in the folder and start any static web server, e.g.:

   ```
   python -m http.server 8080
   ```
   (or `npx serve -l 8080`)

3. From the host: open `http://localhost:8080/Grammar%20Writer.dc.html`
   From other PCs on the LAN: open `http://<host-ip>:8080/Grammar%20Writer.dc.html`

In Option B the app reads the grammar from the `data/` JSON files, so you can edit those files to change the grammars without rebuilding.

> To run as an always-on service, point IIS / nginx / `http-server` at this folder, or wrap the command above in a Windows service / Task Scheduler task.

## The shared API key (one key for everyone)
The key is **baked into the file** so users never have to enter one. Set it once:

1. Open the HTML file in a text editor (Notepad++, VS Code — works for both `Grammar Writer.dc.html` and `Grammar Writer (standalone).html`).
2. Near the top, find the `GW_CONFIG` block:

   ```js
   window.GW_CONFIG = {
     geminiKey:   "__REGNOLOGY_SHARED_GEMINI_KEY__",
     geminiModel: "gemini-2.0-flash",
     claudeKey:   "",
     claudeModel: "claude-sonnet-4-20250514"
   };
   ```

3. Replace `__REGNOLOGY_SHARED_GEMINI_KEY__` with your Gemini API key. Save. Distribute the file.

That's it — every user of that file uses your shared key. The status pill in the top bar reads **“Gemini connected”** once a valid key is in place.

**Switching to Claude later:** put your Anthropic key in `claudeKey`, then choose the **Claude** tab in Settings (or it is used automatically when Gemini has no key).

**Per-machine override:** an individual can still paste a different key under **Settings** — it is kept in that browser only and overrides the shared key there. Without any key, **Show sample result** previews the full output.

> Security: a baked-in key is visible to anyone who opens the file or views its source. Use this only for internal / trusted local deployments. To rotate the key, edit the file again and re-distribute.

## The grammar dictionary
Two data files drive the app:

- `data/grammar_dictionary.json` — the exhaustive syntax. An array of element rows:

  ```json
  { "element": "rate_type", "dataType": "string", "category": "deal characteristic",
    "description": "...", "example": "loan.rate_type = \"FIXED\"",
    "executionContext": "GENERAL", "grammarType": "DealSelectionExpression" }
  ```

  It currently holds **2,282 elements across 31 sub-topics** (DealSelectionExpression, Expected Credit Loss Formula, Loss Given Default Formula, Exposure At Default Formula, Behavior Model, FX/CRF/CC/CU/IR selection expressions, and more). The generated formula must adhere to the syntax of the active sub-topic — only its elements are sent to the model and used to validate the output.

- `data/grammar_types.json` — the sub-topic list with friendly labels (from the Formula Definition file), e.g. `{ "name": "DealSelectionExpression", "label": "Deal Selection Formula", "count": 302 }`. This drives the left-hand tag list and auto-detection.

### Auto-detection
The detected sub-topic is scored from the wording of the ask against each grammar's own vocabulary (element identifiers + label, idf-weighted, with light stemming and a small domain-term boost). It is a best-effort match — always overridable by clicking a tag on the left.

### Adding or updating sub-topics
Append rows for another sub-topic with its `grammarType` value, and add a matching entry to `grammar_types.json`. The app groups by `grammarType` on load, so the new sub-topic's tag, reference panel, detection and generation light up automatically — no code change needed.
