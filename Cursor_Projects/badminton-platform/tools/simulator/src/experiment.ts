/** Compares rating-model variants on the same synthetic data (development tool). */
import { DEFAULT_RATING_CONFIG, type RatingConfig } from '@bp/rating';
import { runCalibration, runNewcomers } from './scenarios';

const variants: [string, Partial<RatingConfig>][] = JSON.parse(process.argv[2] ?? '[]');
const seeds = Number(process.argv[3] ?? 3);
const runs = Number(process.argv[4] ?? 12);
for (const [name, patch] of variants) {
  const cfg = { ...DEFAULT_RATING_CONFIG, ...patch };
  const c = runCalibration(cfg, seeds, 12);
  const n = runNewcomers(cfg, runs);
  console.log(
    [
      name.padEnd(28),
      `rho10 ${c.spearman10.toFixed(3)}`,
      `err10 ${(c.errorAfter10 / c.startError * 100).toFixed(0)}%`,
      `under@15 ${n.underRatedAt15.toFixed(0)} (${(n.underRatedGapClosed * 100).toFixed(0)}%)`,
      `@30 ${n.underRatedAt30.toFixed(0)}`,
      `prompt ${n.medianPromptMatch} (${(n.promptedWithin30Share * 100).toFixed(0)}% by 30)`,
      `correctSD ${n.correctSpread.toFixed(1)}`,
      `falsePrompt ${(n.correctFalsePromptShare * 100).toFixed(0)}%`,
    ].join(' | '),
  );
}
