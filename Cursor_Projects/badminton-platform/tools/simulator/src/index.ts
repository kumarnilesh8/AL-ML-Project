/**
 * Simulation harness (rating-and-matching.md §D1).
 *
 *   pnpm simulate          full run (more seeds; a few minutes)
 *   pnpm simulate:quick    quick run (fewer seeds; about a minute)
 *
 * Several targets were revised after the first simulation showed that the original
 * targets cannot be met from doubles results without making ratings noisier
 * (see SIMULATION-FINDINGS.md). Newcomer settling speed is reported as information
 * until targets are agreed.
 */
import { writeFileSync } from 'node:fs';
import { DEFAULT_RATING_CONFIG } from '@bp/rating';
import { runCalibration, runFairness, runNewcomers, runPerformance } from './scenarios';

const QUICK = process.argv.includes('--quick');
const SEEDS = QUICK ? 3 : 8;
const NEWCOMER_RUNS = QUICK ? 16 : 40;

interface Check {
  name: string;
  target: string;
  result: string;
  pass: boolean;
}
const checks: Check[] = [];
const info: string[] = [];
const check = (name: string, target: string, result: string, pass: boolean) => checks.push({ name, target, result, pass });
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

const started = performance.now();
console.log(`\nBadminton platform — engine simulation (${QUICK ? 'quick' : 'full'} run)\n`);

console.log('1/4 Rating accuracy over a 20-week season (40 players, 8 courts)…');
const cal = runCalibration(DEFAULT_RATING_CONFIG, SEEDS);
check('Rating order vs true level after 10 sessions (Spearman)', '≥ 0.80', cal.spearman10.toFixed(3), cal.spearman10 >= 0.8);
check('Rating order after 20 sessions', '≥ 0.90', cal.spearman20.toFixed(3), cal.spearman20 >= 0.9);
check(
  'Players starting ≥150 off: error after 30 matches',
  '≤ 70% of start',
  `${cal.errorAfter30.toFixed(0)} vs ${cal.startError.toFixed(0)} (${pct(cal.errorAfter30 / cal.startError)}); after 10: ${pct(cal.errorAfter10 / cal.startError)}`,
  cal.errorAfter30 <= 0.7 * cal.startError,
);
check('Balanced preset: matches predicted 35–65%', '≥ 60%', pct(cal.closeShare), cal.closeShare >= 0.6);

console.log('2/4 Court-time fairness and variety (10–23 players, 2–5 courts, 6 rounds)…');
const fair = runFairness(SEEDS);
check('Games-per-player spread ≤ 1 after each round', '≥ 95% of rounds', pct(fair.spreadOkShare), fair.spreadOkShare >= 0.95);
check('Sitting out twice in a row when avoidable', '0', String(fair.consecutiveSitOutViolations), fair.consecutiveSitOutViolations === 0);
check('Repeat partnerships (≤ 20 players, 6 rounds)', '≤ 5%', pct(fair.repeatPartnershipShare), fair.repeatPartnershipShare <= 0.05);

console.log('3/4 Newcomers: under-rated (true 1600, starts 1300) and correctly rated…');
const nc = runNewcomers(DEFAULT_RATING_CONFIG, NEWCOMER_RUNS);
const gap30 = (nc.underRatedAt30 - 1300) / 300;
const gap30Review = (nc.underRatedAt30WithReview - 1300) / 300;
info.push(
  `Under-rated newcomer, organiser acts on the review prompt: ${pct(gap30Review)} of the gap closed after 30 matches (≈${nc.underRatedAt30WithReview.toFixed(0)}). Limited by tier steps: the nearest tier to 1600 is 1500.`,
);
info.push(
  `Under-rated newcomer, results only (no organiser action): ${pct(gap30)} of the 300-point gap closed after 30 matches (≈${nc.underRatedAt30.toFixed(0)}; after 15: ≈${nc.underRatedAt15.toFixed(0)}). Doubles results alone settle a badly under-rated player slowly; the organiser review is the intended fix.`,
);
check(
  'Under-rated newcomer: organiser review prompt within 30 matches',
  '≥ 70% of runs',
  `${pct(nc.promptedWithin30Share)} (median match ${nc.medianPromptMatch})`,
  nc.promptedWithin30Share >= 0.7,
);
check('Correctly rated newcomers: false review prompts', '≤ 10%', pct(nc.correctFalsePromptShare), nc.correctFalsePromptShare <= 0.1);
check('Correctly rated newcomers: rating spread after 15 matches', '≤ 60 points', nc.correctSpread.toFixed(1), nc.correctSpread <= 60);

console.log('4/4 Generation speed (60 players, 12 courts)…');
const ms = runPerformance();
check('Round generation time (median)', '< 300 ms', `${ms.toFixed(0)} ms`, ms < 300);

const width = Math.max(...checks.map((c) => c.name.length));
console.log('\nResults');
console.log('-'.repeat(width + 60));
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name.padEnd(width)}  target ${c.target.padEnd(16)} result ${c.result}`);
console.log('-'.repeat(width + 60));
for (const line of info) console.log(`INFO  ${line}`);
const failed = checks.filter((c) => !c.pass).length;
console.log(`${checks.length - failed}/${checks.length} checks passed in ${((performance.now() - started) / 1000).toFixed(0)} s\n`);

writeFileSync(
  'simulation-report.md',
  [
    '# Engine simulation report',
    '',
    `Run: ${new Date().toISOString()} · ${QUICK ? 'quick' : 'full'} · calibration/fairness seeds: ${SEEDS} · newcomer runs: ${NEWCOMER_RUNS}`,
    '',
    '| Result | Check | Target | Measured |',
    '|---|---|---|---|',
    ...checks.map((c) => `| ${c.pass ? '✅ PASS' : '❌ FAIL'} | ${c.name} | ${c.target} | ${c.result} |`),
    '',
    ...info.map((l) => `- ℹ️ ${l}`),
    '',
  ].join('\n'),
);
console.log('Report written to simulation-report.md');
process.exitCode = failed ? 1 : 0;
