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

# Pack Governance Dashboard — Brand-Alignment Design Review

**Reviewer:** Designer Dagmar  
**Date:** 2026-05-21  
**Subject:** Angular 18 Pack Governance Dashboard (`tools/pack-dashboard/`) against Regnology docops design system

---

## 1. Brand Alignment Summary

The dashboard achieves solid structural brand alignment: Petrol Blue chrome, Regnology Green accents, Regnology Sans font stack, and token-driven colour throughout the majority of the surface. The canonical colour palette, spacing rhythm, and motion tokens are largely respected, and the dark-mode override block is a responsible stop-gap. However, several precision gaps break fidelity: hardcoded hover hex values that should be token references, a button class naming mismatch against the design system's canonical `.rn-btn-primary` selector, a table zebra-stripe rule that inverts the design system's intended light-on-odd / white-on-even pattern, inline `style=` blocks that bypass the token system entirely on the most data-critical page, and statement-card / KPI-tile implementations that diverge from the published component spec in typography scale and structural intent. The overall impression is professional and coherent; the deviations listed below are correctable without structural rework.

---

## 2. Token Compliance

| CSS variable used in app | Canonical name in `_tokens.scss` / `regnology-web.css` | Status | Notes |
|---|---|---|---|
| `--rn-petrol-blue` | `--rn-petrol-blue` | **OK** | Correct |
| `--rn-navy-dark` | `--rn-navy-dark` | **OK** | Correct |
| `--rn-green-dark` | `--rn-green-dark` | **OK** | Correct |
| `--rn-green-light` | `--rn-green-light` | **OK** | Correct |
| `--rn-ice-blue` | `--rn-ice-blue` | **OK** | Correct |
| `--rn-pure-white` | `--rn-pure-white` | **OK** | Correct |
| `--rn-pure-black` | `--rn-pure-black` | **OK** | Correct |
| `--rn-stone-grey` | `--rn-stone-grey` | **OK** | Correct |
| `--rn-sand-grey` | `--rn-sand-grey` | **OK** | Correct |
| `--rn-color-bg-primary` | `--rn-color-bg-primary` | **OK** | Correct |
| `--rn-color-bg-secondary` | `--rn-color-bg-secondary` | **OK** | Correct |
| `--rn-color-text-primary` | `--rn-color-text-primary` | **OK** | Correct |
| `--rn-color-text-secondary` | `--rn-color-text-secondary` | **OK** | Correct |
| `--rn-color-border-muted` | **Not in canonical tokens** | **MISSING** | App defines this as a local inline fallback `rgba(0,0,0,0.08–0.12)`. No `--rn-color-border-muted` token exists in the design system. Closest canonical token is `--rn-color-border` (`#E1E6E6`). Use `--rn-color-border` for default borders; `--rn-color-border-strong` for emphasis. |
| `--rn-color-border-strong` | `--rn-color-border-strong` | **OK** | Correctly resolved to `#9FA8A9` |
| `--rn-color-danger` | `--rn-color-danger` | **OK** | `#C62828` in design system; app also has hardcoded `#b42828` in `.sv-chip--no` and `#a01f1f` in `.rn-btn--danger` hover — see below |
| `#058540` (`.rn-btn--primary` hover) | Should be a green-dark hover derivation | **HARDCODED** | Design system hover background on primary button resolves to `var(--rn-color-heading)` = `#012D3F`. App uses an undocumented darker green. |
| `#d98000` (`.dash-kpi--warn`, `.ks-kpi--warn`) | `--rn-color-warning` = `--rn-hay-yellow` = `#EC9D1C` | **HARDCODED** | Warning amber is off-brand. Canonical warning is `#EC9D1C`. |
| `#b42828` (`.sv-chip--no` colour) | `--rn-color-danger` = `#C62828` | **HARDCODED / WRONG VALUE** | Off by 2 on the red channel from canonical `#C62828`. |
| `#a01f1f` (`.rn-btn--danger` hover) | No canonical hover token defined | **HARDCODED** | Acceptable as a derived dark; should be `color-mix(in srgb, var(--rn-color-danger) 80%, black)`. |
| `rgba(6, 167, 78, 0.1)` (sidebar active bg) | Derived from `--rn-green-dark` | **OK** | Acceptable alpha-derived value. |
| `rgba(1, 45, 63, 0.05)` (`.ks-kpi` bg) | Derived from `--rn-petrol-blue` | **OK** | Acceptable. |
| `#0082b4` (`.sv-chip--kind` colour) | `--rn-ice-blue` = `#1788BE` | **HARDCODED / WRONG VALUE** | `#0082b4` is darker than the canonical Ice Blue. Replace with `var(--rn-ice-blue)`. |

---

## 3. Typography

### Scale deviations

The design system defines a font-size scale: `display → h1 → h2 → h3 (22px) → subhead (18px) → body (16px) → sm (14px) → tag (12px) → footer (10px)`. The app introduces several intermediate sizes that fall outside this scale:

| Location | App value | Nearest token | Status |
|---|---|---|---|
| `.rn-header__wordmark strong` | `0.8125rem` (13px) | `--rn-font-size-tag` = 12px or `--rn-font-size-sm` = 14px | **Off-scale** |
| `.rn-header__badge` | `0.6875rem` (11px) | `--rn-font-size-footer` = 10px or `--rn-font-size-tag` = 12px | **Off-scale** |
| `.ks-card__summary` | `0.8rem` (12.8px) | `--rn-font-size-tag` = 12px | **Off-scale** |
| `.ks-kpi__value` | `1.5rem` (24px) | Between subhead and h3 | **Off-scale** |
| `.ks-card__layer`, `.do-card__eyebrow` | `0.625rem` / `0.6875rem` | `--rn-font-size-tag` = 12px | **Off-scale** — tag labels should be 12px |
| `.sv-card__key` | `0.7rem` (11.2px) | `--rn-font-size-tag` = 12px | **Off-scale** |
| `.ks-kpi__label` | `0.5625rem` (9px) | `--rn-font-size-footer` = 10px | **Below floor** |

### Weight

Design system only codifies `400` and `500`. App widely uses `600`. Statement-card spec uses `500` for eyebrow labels; app applies `600` in `.ks-card__layer` and `.do-card__eyebrow`.

### Letter-spacing

Canonical: `--rn-letter-spacing-tag: 0.2em`. App applies multiple bespoke values: `0.14em`, `0.18em`, `0.12em`, `0.1em`. Only tag/eyebrow elements use the canonical `0.2em`.

---

## 4. Component Fidelity

### Statement Cards (`.ks-card`)

Design system specifies three variants: **Petrol** (dark bg, white text), **Dashed** (white bg, dashed border), **Grey** (surface bg). App maps `--blue → dashed`, `--green → grey`, `--petrol → white with petrol outline border`. The dark petrol variant is entirely absent, removing a key visual hierarchy tool.

### KPI Tiles

Top-level `.dash-kpi` closely matches spec. Inner `.ks-kpi` and `.do-kpi` diverge:
- `.ks-kpi__value`: 24px vs spec 32px (acceptable for nested context)
- `.ks-kpi__label`: 9px — below `--rn-font-size-footer` floor
- Background: `rgba(petrol, 0.05)` vs spec `var(--rn-pure-white)` with `box-shadow`

### Badges

`rn-badge--success` and `rn-badge--danger` are used but **not defined** anywhere — `rn-badge--danger` will render with the base green background.

### Tables

Dark-mode override stripes `tr:nth-child(even)` — inverts the design system's `odd=striped / even=white` convention.

### Buttons

App uses BEM `.rn-btn--primary` while design system exports flat `.rn-btn-primary`. Namespace collision risk.

---

## 5. Spacing & Layout

Key deviations from 4pt grid:

| Location | Value | Fix |
|---|---|---|
| `.dash-kpi` padding | `14px 16px 16px` | `16px 16px 16px` |
| `.do-panel__toggle` padding | `13px 18px` | `12px 16px` |
| `.ks-kpi` padding | `8px 8px 10px` | `8px 8px 8px` |
| `.do-card` padding | `28px 16px 16px` | `24px 16px 16px` |
| `.rn-main-content` padding | `2rem 2.5rem 3rem` | `2rem 2rem 3rem` (keep 2.5rem only if 40px is intentional) |
| `.sv-row__label` padding | `7px 12px` | `8px 12px` |
| `.sv-card__key` padding | `5px 10px` | `4px 8px` |

---

## 6. Accessibility Notes

1. **`.sv-chip--kind`** at 12px with `color: #0082b4` (non-canonical): 4.6:1 against white, borderline AA — only passing at bold weight.
2. **`.ks-kpi--warn .ks-kpi__value { color: #d98000 }`**: 3.1:1 on white — **fails WCAG AA**. Replace with darker amber.
3. **`.ks-kpi__label`** at 9px: below readable minimum for non-retina displays.
4. **`.rn-sidebar__nav-item`**: no `:focus-visible` style on dark background.
5. **Icon `aria-hidden="true"` + `[alt]="meta.name"` conflict**: set `alt=""` when `aria-hidden` is used.
6. Button `:focus-visible` implementation is **better** than the design system base — retain.

---

## 7. Prioritized Findings

| ID | Severity | Component | Finding | Recommended Fix |
|---|---|---|---|---|
| F-01 | **Critical** | Badges | `rn-badge--success` and `rn-badge--danger` are not defined; `rn-badge--danger` renders green | Add definitions to `styles.scss` using `--rn-color-danger` / `--rn-color-success` |
| F-02 | **Critical** | Warning colour / A11y | `#d98000` on white = 3.1:1, fails WCAG AA | Replace with `#B36800` (4.7:1) or use background+dark-text pattern |
| F-03 | **Major** | Buttons | `.rn-btn--primary` (BEM) vs `.rn-btn-primary` (flat) namespace collision | Document as local extension; add bridge rule or align to system |
| F-04 | **Major** | Statement Cards | Dark petrol card variant absent; all three layers use light backgrounds, removing visual hierarchy | Introduce `.ks-card--petrol-dark` for strategic layer |
| F-05 | **Major** | Tables / Dark mode | Dark-mode stripe targets `even` rows, inverts design system's `odd=striped` convention | Change to `tr:nth-child(odd)` |
| F-06 | **Major** | Token | `--rn-color-border-muted` used 14+ times but not a canonical token; no dark-mode override | Replace with `--rn-color-border`; or define formally in token extension file |
| F-07 | **Major** | Dashboard / Detail | Inline `style="background: #f8d7da"` Bootstrap legacy colours bypass token system and dark mode | Move to classes in `styles.scss` using `--rn-status-*` tokens |
| F-08 | **Minor** | Typography | `.ks-kpi__label` at 9px below `--rn-font-size-footer` floor | Set to `var(--rn-font-size-footer)` (10px) |
| F-09 | **Minor** | Token / Colour | `.sv-chip--kind { color: #0082b4 }` wrong non-canonical blue | Replace with `var(--rn-ice-blue)` |
| F-10 | **Minor** | Spacing | Multiple values off 4pt grid: `14px`, `13px`, `18px`, `10px`, `7px`, `5px` | Snap to nearest token per table in §5 |
| F-11 | **Minor** | Accessibility / Focus | `.rn-sidebar__nav-item` has no `:focus-visible` style on dark surface | Add `outline: 2px solid var(--rn-green-light); outline-offset: -2px` |
| F-12 | **Minor** | Typography | Inconsistent letter-spacing values across eyebrow/tag roles | Consolidate to `var(--rn-letter-spacing-tag)` (0.2em) for all tag-role text |

---

## 8. Design Recommendations

1. **Formalise a dashboard token extension layer** — create `_dashboard-tokens.scss` to hold local token extensions (`--rn-color-border-muted`, warning text colour, dark-surface muted text), each referencing its parent token as a derivation.

2. **Reinstate the dark Petrol statement card** — restoring the dark petrol card for the Strategic layer would reinstate the visual weight hierarchy the statement-card spec was designed to communicate.

3. **Align the button namespace and document it** — the app's BEM `.rn-btn / .rn-btn--*` pattern is more complete than the design system's base. Formalise via a DDR and propose upstream contribution to docops.

4. **Resolve all inline `style=` blocks** — six instances in `dashboard.component.ts` and `artifact-detail.component.ts` use bare Bootstrap hex colours. Move every inline style to a `styles.scss` class backed by the appropriate `--rn-status-*` token.

5. **Typography and spacing pass** — snapping the font-size scale to token steps and the spacing to the 4pt grid would noticeably tighten the visual rhythm without any structural change.

---

_Findings F-01, F-02, F-05, F-07, F-08, F-09, F-10, F-11 are addressed as immediate fixes in commit `fix(pack-dashboard): dagmar brand-alignment remediation`. Findings F-03, F-04, F-06, F-12 and all Recommendations are tracked as requirements in the next mission spec._
