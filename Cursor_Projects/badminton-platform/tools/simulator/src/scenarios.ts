/**
 * Simulation scenarios (rating-and-matching.md §D1).
 * Synthetic clubs with a hidden "true" level per player; sessions simulated rally by rally
 * through the real matching and rating engines.
 */
import { createRng, randomNormal, type Rng, type Tier } from '@bp/domain';
import { buildHistory, generateRound, type MatchingPlayer, type PastMatch } from '@bp/matching';
import {
  DEFAULT_RATING_CONFIG,
  TIER_ORDER,
  TIER_RATINGS,
  rateMatch,
  startingRating,
  type PlayerRating,
  type RatingConfig,
} from '@bp/rating';

const RALLY_SCALE = 1600; // calibrated so simulated results match the model's expectations
const HOUR = 3600_000;
const WEEK = 7 * 24 * HOUR;

// ---------------------------------------------------------------------------
// Synthetic players and games
// ---------------------------------------------------------------------------

export interface SimPlayer {
  id: string;
  trueLevel: number;
}

export function nearestTier(level: number): Tier {
  let best: Tier = 'intermediate';
  for (const t of TIER_ORDER) if (Math.abs(TIER_RATINGS[t] - level) < Math.abs(TIER_RATINGS[best] - level)) best = t;
  return best;
}

/** Self-assessment: nearest tier, but 40% of players are one tier off. */
function selfAssessedTier(level: number, rng: Rng): Tier {
  const idx = TIER_ORDER.indexOf(nearestTier(level));
  const r = rng();
  const shift = r < 0.2 ? -1 : r < 0.4 ? 1 : 0;
  return TIER_ORDER[Math.min(TIER_ORDER.length - 1, Math.max(0, idx + shift))]!;
}

export function makeClub(n: number, rng: Rng, prefix = 'p'): SimPlayer[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefix}${String(i + 1).padStart(2, '0')}`,
    trueLevel: Math.min(1900, Math.max(700, randomNormal(rng, 1300, 230))),
  }));
}

/** One game to 21 (cap 30, win by 2), rally by rally. */
function playGame(teamA: string[], teamB: string[], level: Map<string, number>, rng: Rng): [number, number] {
  const avg = (t: string[]) => t.reduce((s, id) => s + level.get(id)!, 0) / t.length;
  const q = 1 / (1 + 10 ** (-(avg(teamA) - avg(teamB)) / RALLY_SCALE));
  let a = 0;
  let b = 0;
  for (;;) {
    if (rng() < q) a++;
    else b++;
    if ((a >= 21 || b >= 21) && Math.abs(a - b) >= 2) return [a, b];
    if (a === 30 || b === 30) return [a, b];
  }
}

// ---------------------------------------------------------------------------
// Session simulation
// ---------------------------------------------------------------------------

interface RoundLog {
  gamesSpread: number;
  consecutiveSitOutViolations: number;
  predicted: number[];
  partnerPairs: string[];
  genMs: number;
}

interface SessionLog {
  rounds: RoundLog[];
  repeatPartnerships: number;
  partnerships: number;
}

function simulateSession(
  players: SimPlayer[],
  ratings: Map<string, PlayerRating>,
  courts: number,
  rounds: number,
  seed: number,
  startTime: number,
  recentHistory: PastMatch[],
  rng: Rng,
  cfg: RatingConfig,
  preset: 'social' | 'balanced' | 'competitive' = 'balanced',
  onChange?: (playerId: string, reviewSuggested: boolean, rating: number) => void,
): { log: SessionLog; matches: PastMatch[] } {
  const level = new Map(players.map((p) => [p.id, p.trueLevel]));
  const games = new Map(players.map((p) => [p.id, 0]));
  const sitOuts = new Map(players.map((p) => [p.id, 0]));
  let satOutLast = new Set<string>();
  const sessionMatches: PastMatch[] = [];
  const log: SessionLog = { rounds: [], repeatPartnerships: 0, partnerships: 0 };
  const seenPartners = new Set<string>();
  const courtIds = Array.from({ length: courts }, (_, i) => `c${i + 1}`);

  for (let r = 0; r < rounds; r++) {
    const mps: MatchingPlayer[] = players.map((p) => {
      const st = ratings.get(p.id)!;
      return {
        id: p.id,
        rating: st.rating,
        deviation: st.deviation,
        gamesPlayed: games.get(p.id)!,
        sitOutsTotal: sitOuts.get(p.id)!,
        satOutLastRound: satOutLast.has(p.id),
      };
    });
    const history = buildHistory([...recentHistory, ...sessionMatches]);
    const t = performance.now();
    const res = generateRound({ players: mps, courtIds, preset, seed: seed * 1000 + r, history });
    const genMs = performance.now() - t;
    if (!res.ok) throw new Error(res.message);

    const sittingNow = new Set(res.sitOuts.map((s) => s.playerId));
    const violations = [...sittingNow].filter((id) => satOutLast.has(id)).length;
    const protectedCount = satOutLast.size;
    const places = res.matches.length * 4;
    const avoidable = protectedCount <= places;

    const partnerPairs: string[] = [];
    for (const m of res.matches) {
      for (const [x, y] of [m.teamA, m.teamB]) {
        const key = [x, y].sort().join('|');
        partnerPairs.push(key);
        log.partnerships++;
        if (seenPartners.has(key)) log.repeatPartnerships++;
        seenPartners.add(key);
      }
      const [pa, pb] = playGame(m.teamA, m.teamB, level, rng);
      const played = rateMatch(
        ratings,
        {
          matchId: `${seed}-${r}-${m.courtId}`,
          teamA: m.teamA,
          teamB: m.teamB,
          pointsA: pa,
          pointsB: pb,
          playedAt: startTime + r * 15 * 60_000,
          resultKind: 'finished',
        },
        cfg,
      );
      for (const u of played.updated) ratings.set(u.playerId, u);
      for (const c of played.changes) onChange?.(c.playerId, c.reviewSuggested, c.ratingAfter);
      for (const id of [...m.teamA, ...m.teamB]) games.set(id, games.get(id)! + 1);
      sessionMatches.push({ teamA: m.teamA, teamB: m.teamB, scope: 'session' });
    }
    for (const id of sittingNow) sitOuts.set(id, sitOuts.get(id)! + 1);
    satOutLast = sittingNow;

    const g = [...games.values()];
    log.rounds.push({
      gamesSpread: Math.max(...g) - Math.min(...g),
      consecutiveSitOutViolations: avoidable ? violations : 0,
      predicted: res.matches.map((m) => m.predictedA),
      partnerPairs,
      genMs,
    });
  }
  return { log, matches: sessionMatches.map((m) => ({ ...m, scope: 'recent' as const })) };
}

// ---------------------------------------------------------------------------
// Metrics helpers
// ---------------------------------------------------------------------------

export function spearman(xs: number[], ys: number[]): number {
  const rank = (v: number[]) => {
    const idx = v.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
    const r = new Array<number>(v.length);
    idx.forEach(([, i], k) => (r[i] = k));
    return r;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const n = xs.length;
  const d2 = rx.reduce((s, r, i) => s + (r - ry[i]!) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

export const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
export const sd = (xs: number[]) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)));
export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[Math.floor((s.length - 1) / 2)]! + s[Math.ceil((s.length - 1) / 2)]!) / 2 : NaN;
};

// ---------------------------------------------------------------------------
// Scenario 1: rating accuracy over a season (40 players, 8 courts, weekly)
// ---------------------------------------------------------------------------

export interface CalibrationMetrics {
  spearman10: number;
  spearman20: number;
  startError: number;
  errorAfter10: number;
  errorAfter30: number;
  closeShare: number;
}

export function runCalibration(cfg: RatingConfig, seeds: number, weeks = 20): CalibrationMetrics {
  const corr10: number[] = [];
  const corr20: number[] = [];
  const errStart: number[] = [];
  const errAfter10: number[] = [];
  const errAfter30: number[] = [];
  const closeShares: number[] = [];

  for (let s = 0; s < seeds; s++) {
    const rng = createRng(1000 + s);
    const players = makeClub(40, rng);
    const ratings = new Map(players.map((p) => [p.id, startingRating(p.id, 'self', selfAssessedTier(p.trueLevel, rng))]));
    const startErr = new Map(players.map((p) => [p.id, Math.abs(ratings.get(p.id)!.rating - p.trueLevel)]));
    const matchCount = new Map(players.map((p) => [p.id, 0]));
    const ratingAt10 = new Map<string, number>();
    const ratingAt30 = new Map<string, number>();
    let recent: PastMatch[] = [];
    let predicted: number[] = [];

    for (let w = 0; w < weeks; w++) {
      const { log, matches } = simulateSession(
        players, ratings, 8, 6, s * 100 + w, Date.UTC(2026, 0, 1) + w * WEEK, recent, rng, cfg, 'balanced',
        (id, _review, rating) => {
          const n = matchCount.get(id)! + 1;
          matchCount.set(id, n);
          if (n === 10) ratingAt10.set(id, rating);
          if (n === 30) ratingAt30.set(id, rating);
        },
      );
      recent = [...recent, ...matches].slice(-3 * 48);
      if (w >= 3) predicted = predicted.concat(log.rounds.flatMap((r) => r.predicted));
      const truth = players.map((p) => p.trueLevel);
      const est = players.map((p) => ratings.get(p.id)!.rating);
      if (w === 9) corr10.push(spearman(truth, est));
      if (w === weeks - 1) corr20.push(spearman(truth, est));
    }
    for (const p of players) {
      if (startErr.get(p.id)! < 150 || !ratingAt30.has(p.id)) continue;
      errStart.push(startErr.get(p.id)!);
      errAfter10.push(Math.abs(ratingAt10.get(p.id)! - p.trueLevel));
      errAfter30.push(Math.abs(ratingAt30.get(p.id)! - p.trueLevel));
    }
    closeShares.push(predicted.filter((x) => x >= 0.35 && x <= 0.65).length / predicted.length);
  }
  return {
    spearman10: mean(corr10),
    spearman20: mean(corr20),
    startError: mean(errStart),
    errorAfter10: mean(errAfter10),
    errorAfter30: mean(errAfter30),
    closeShare: mean(closeShares),
  };
}

// ---------------------------------------------------------------------------
// Scenario 2: fairness of court time and variety (stable attendance)
// ---------------------------------------------------------------------------

export interface FairnessMetrics {
  spreadOkShare: number;
  consecutiveSitOutViolations: number;
  repeatPartnershipShare: number;
}

export function runFairness(seeds: number): FairnessMetrics {
  const configs: [number, number][] = [[10, 2], [13, 3], [16, 4], [18, 4], [20, 4], [23, 5]];
  let rounds = 0;
  let spreadOk = 0;
  let violations = 0;
  let repeats = 0;
  let partnerships = 0;
  for (const [n, c] of configs) {
    for (let s = 0; s < seeds; s++) {
      const rng = createRng(5000 + s * 31 + n);
      const players = makeClub(n, rng);
      const ratings = new Map(players.map((p) => [p.id, startingRating(p.id, 'organiser', nearestTier(p.trueLevel))]));
      const { log } = simulateSession(players, ratings, c, 6, 7000 + s, Date.UTC(2026, 2, 1), [], rng, DEFAULT_RATING_CONFIG);
      for (const r of log.rounds) {
        rounds++;
        if (r.gamesSpread <= 1) spreadOk++;
        violations += r.consecutiveSitOutViolations;
      }
      if (n <= 20) {
        repeats += log.repeatPartnerships;
        partnerships += log.partnerships;
      }
    }
  }
  return {
    spreadOkShare: spreadOk / rounds,
    consecutiveSitOutViolations: violations,
    repeatPartnershipShare: repeats / partnerships,
  };
}

// ---------------------------------------------------------------------------
// Scenario 3: newcomers (§A5a)
// ---------------------------------------------------------------------------

export function newcomerRun(trueLevel: number, startTier: Tier, cfg: RatingConfig, seed: number, horizon = 30, organiserActs = false) {
  const rng = createRng(seed);
  const club = makeClub(23, rng, 'e');
  const ratings = new Map<string, PlayerRating>(
    club.map((p) => [p.id, { ...startingRating(p.id, 'organiser', null), rating: p.trueLevel + randomNormal(rng, 0, 40), deviation: 70 }]),
  );
  const newcomer: SimPlayer = { id: 'new', trueLevel };
  ratings.set('new', startingRating('new', 'self', startTier));
  const players = [...club, newcomer];
  let matches = 0;
  let firstPrompt: number | null = null;
  let ratingAt15: number | null = null;
  let ratingAt30: number | null = null;
  let recent: PastMatch[] = [];
  for (let w = 0; w < 20 && matches < horizon; w++) {
    const { matches: m } = simulateSession(players, ratings, 4, 6, seed * 10 + w, Date.UTC(2026, 3, 1) + w * WEEK, recent, rng, cfg, 'balanced', (id, review, rating) => {
      if (id !== 'new') return;
      matches++;
      if (review && firstPrompt === null) {
        firstPrompt = matches;
        if (organiserActs) {
          // The organiser reviews the level after the prompt: picks the tier nearest to how the player
          // actually plays, recorded as an organiser assessment (rating-and-matching.md §A5a, Safeguard 2).
          const st = ratings.get('new')!;
          ratings.set('new', { ...st, rating: TIER_RATINGS[nearestTier(trueLevel)], deviation: 220, recentSurprises: [] });
        }
      }
      if (matches === 15) ratingAt15 = rating;
      if (matches === 30) ratingAt30 = rating;
    });
    recent = [...recent, ...m].slice(-72);
  }
  const final = ratings.get('new')!.rating;
  return { ratingAt15: ratingAt15 ?? final, ratingAt30: ratingAt30 ?? final, firstPrompt };
}

export interface NewcomerMetrics {
  underRatedAt15: number;
  underRatedAt30: number;
  underRatedAt30WithReview: number;
  promptedWithin30Share: number;
  underRatedGapClosed: number;
  medianPromptMatch: number;
  correctSpread: number;
  correctFalsePromptShare: number;
}

export function runNewcomers(cfg: RatingConfig, runs: number): NewcomerMetrics {
  const under: number[] = [];
  const under30: number[] = [];
  const under30Review: number[] = [];
  const prompts: number[] = [];
  const correct: number[] = [];
  let falsePrompts = 0;
  for (let s = 0; s < runs; s++) {
    const a = newcomerRun(1600, 'intermediate', cfg, 9000 + s);
    under.push(a.ratingAt15);
    under30.push(a.ratingAt30);
    under30Review.push(newcomerRun(1600, 'intermediate', cfg, 9000 + s, 30, true).ratingAt30);
    prompts.push(a.firstPrompt ?? 99);
    const b = newcomerRun(1300, 'intermediate', cfg, 12000 + s);
    correct.push(b.ratingAt15 - 1300);
    if (b.firstPrompt !== null) falsePrompts++;
  }
  return {
    underRatedAt15: mean(under),
    underRatedAt30: mean(under30),
    underRatedAt30WithReview: mean(under30Review),
    promptedWithin30Share: prompts.filter((p) => p <= 30).length / runs,
    underRatedGapClosed: (mean(under) - 1300) / 300,
    medianPromptMatch: median(prompts),
    correctSpread: sd(correct),
    correctFalsePromptShare: falsePrompts / runs,
  };
}

// ---------------------------------------------------------------------------
// Scenario 4: generation speed (60 players, 12 courts)
// ---------------------------------------------------------------------------

export function runPerformance(): number {
  const rng = createRng(77);
  const players = makeClub(60, rng);
  const times: number[] = [];
  for (let i = 0; i < 7; i++) {
    const mps: MatchingPlayer[] = players.map((p) => ({
      id: p.id, rating: p.trueLevel, deviation: 80, gamesPlayed: i, sitOutsTotal: 0, satOutLastRound: false,
    }));
    const t = performance.now();
    generateRound({ players: mps, courtIds: Array.from({ length: 12 }, (_, k) => `c${k}`), preset: 'balanced', seed: i });
    times.push(performance.now() - t);
  }
  return median(times.slice(2));
}
