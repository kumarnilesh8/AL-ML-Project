# Simulation findings (Step B, 27 October 2026)

The first full simulation of the engines, built exactly to `rating-and-matching.md` v1.2,
passed the fairness, variety, balance and speed targets but exposed problems with the
**newcomer rules**. This note records what was found and what changed.

## 1. What passed first time
| Check | Result |
|---|---|
| Rating order vs true level after 10 sessions | Spearman ≈ 0.93–0.94 (target ≥ 0.80) |
| Matches predicted between 35% and 65% (Balanced) | ≈ 96% (target ≥ 60%) |
| Games-per-player spread ≤ 1 after every round | 100% (target ≥ 95%) |
| Sitting out twice in a row when avoidable | 0 |
| Repeat partnerships within a session (≤ 20 players) | 0% (target ≤ 5%) |
| Generation time, 60 players / 12 courts | ≈ 45–60 ms after optimisation (target < 300 ms) |

## 2. Problem: the review prompt raised false alarms for almost everyone
Spec v1.2 prompted the organiser when the **average surprise over the last 5 matches** was ≥ 0.15.
One game's result is noisy (about ±0.38 around expectation), so ordinary win or loss streaks
crossed that line constantly: **94–100% of correctly rated newcomers** triggered a prompt within
15 matches, and the rule also made their ratings noisier.

**Change (engine 1.1.0):** a statistical check over the **last 20 matches**:
`z = sum of surprises ÷ (0.38 × √matches)`; prompt when `|z| ≥ 2.2` after at least **8** matches.

| Rule | False prompts (correct newcomers) | Under-rated newcomer flagged |
|---|---|---|
| v1.2 (5-match average ≥ 0.15) | 94–100% | match 5 (but meaningless given the false alarms) |
| z ≥ 2.5 | 0% | 58% within 30 matches |
| **z ≥ 2.2 (adopted)** | **≈ 5%** | **≈ 78–81% within 30 matches, median match 13** |

## 3. Limit: doubles results settle a badly mis-rated player slowly
Each doubles result is shared with a partner, so the evidence about one player builds up slowly.
A player who self-assessed 300 points too low (true 1600, started 1300):

| Approach | Rating after 15 matches | After 30 matches |
|---|---|---|
| Results only | ≈ 1410 | ≈ 1450–1460 (≈ 50% of the gap) |
| Organiser acts on the review prompt | — | ≈ 1500 (≈ 68%; limited by the tier steps, nearest tier is 1500) |

Variants tested and **not** adopted because they made every rating noisier (spread for correctly
rated newcomers rose from ≈ 42 to 57–73 points) for small gains: larger step size (K max 96),
slower confidence growth (0.95), and sharing each team change by uncertainty (a TrueSkill-style
rule). The uncertainty-sharing option remains in the engine (`sharing: 'uncertainty'`) so it can
be re-tested with real pilot data.

**Conclusion:** the most effective protection against wrong starting levels is a **person**,
not more maths. Recommended product additions (for approval):
1. Encourage organisers to set new players' starting level themselves (already in the design).
2. **First-session check:** after a new player's first session, show the organiser a one-tap
   "Level looks right?" card with that session's results.
3. Keep the automatic review prompt as a safety net.

## 4. Targets revised (for approval)
| Original v1.2 target | Measured | Proposed target |
|---|---|---|
| Players starting badly off: error halves within 10 matches | ≈ 82–85% of error remains after 10; ≈ 59–61% after 30 | Error ≤ 70% of start after 30 matches |
| Under-rated newcomer: half the gap closed within 15 matches | ≈ 37–47% after 15 | Reported as information; organiser review is the fix |
| Review prompt within 5–7 matches | Not achievable without false alarms | Prompt within 30 matches in ≥ 70% of cases, with ≤ 10% false prompts |
| Correctly rated newcomers not noisier with adaptive check | v1.2 check made them ≈ 23% noisier | Spread after 15 matches ≤ 60 points (measured ≈ 42–46) |
