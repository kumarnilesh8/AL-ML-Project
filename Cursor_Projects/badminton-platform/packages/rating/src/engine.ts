import type { Confidence, PlayerId, StartSource, Tier } from '@bp/domain';
import { DEFAULT_RATING_CONFIG, ENGINE_VERSION, START_DEVIATION, TIER_RATINGS, type RatingConfig } from './config';
import type { PlayerRating, RateMatchResult, RatedMatchInput, RatingChange } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const round = (x: number, dp = 4) => Math.round(x * 10 ** dp) / 10 ** dp;

/** Expected performance of a team rated `r` against a team rated `rOpp` (§A5). */
export function expectedScore(r: number, rOpp: number, cfg: RatingConfig = DEFAULT_RATING_CONFIG): number {
  return 1 / (1 + 10 ** ((rOpp - r) / cfg.scale));
}

/** Actual performance (0..1) blending win/loss with points share. */
export function actualScore(pointsFor: number, pointsAgainst: number, cfg: RatingConfig = DEFAULT_RATING_CONFIG): number {
  const total = pointsFor + pointsAgainst;
  const share = total > 0 ? pointsFor / total : 0.5;
  const won = pointsFor > pointsAgainst ? 1 : 0;
  return cfg.marginWeight * won + (1 - cfg.marginWeight) * share;
}

/** Step size from a player's own uncertainty. */
export function stepSize(deviation: number, cfg: RatingConfig = DEFAULT_RATING_CONFIG): number {
  const d = clamp(deviation, cfg.dMin, cfg.dMax);
  return cfg.kMin + ((cfg.kMax - cfg.kMin) * (d - cfg.dMin)) / (cfg.dMax - cfg.dMin);
}

/** Damping factor (0.5..1) when the opponents' ratings are uncertain. */
export function opponentConfidence(opponentTeamDeviation: number, cfg: RatingConfig = DEFAULT_RATING_CONFIG): number {
  const d = clamp(opponentTeamDeviation, cfg.dMin, cfg.dMax);
  return 1 - (0.5 * (d - cfg.dMin)) / (cfg.dMax - cfg.dMin);
}

export function teamRating(ratings: number[]): number {
  return ratings.reduce((s, r) => s + r, 0) / ratings.length;
}

export function teamDeviation(deviations: number[]): number {
  return Math.sqrt(deviations.reduce((s, d) => s + d * d, 0) / deviations.length);
}

/** Confidence badge from uncertainty: Low (≥150), Medium (90–149), High (<90). */
export function confidenceOf(deviation: number, cfg: RatingConfig = DEFAULT_RATING_CONFIG): Confidence {
  if (deviation >= cfg.lowConfidenceAt) return 'low';
  if (deviation >= cfg.mediumConfidenceAt) return 'medium';
  return 'high';
}

/** Estimated number of further matches until the badge reaches Medium (0 if already there). */
export function matchesToMediumConfidence(deviation: number, cfg: RatingConfig = DEFAULT_RATING_CONFIG): number {
  let d = deviation;
  let n = 0;
  while (d >= cfg.lowConfidenceAt && n < 1000) {
    d = Math.max(cfg.dMin, d * cfg.shrink);
    n++;
  }
  return n;
}

/** Uncertainty grows while a player is away; the rating itself never changes. */
export function applyInactivity(state: PlayerRating, now: number, cfg: RatingConfig = DEFAULT_RATING_CONFIG): PlayerRating {
  if (state.lastPlayedAt === null || now <= state.lastPlayedAt) return state;
  const weeks = (now - state.lastPlayedAt) / WEEK_MS;
  const grown = Math.sqrt(state.deviation ** 2 + cfg.inactivityPerWeek ** 2 * weeks);
  return { ...state, deviation: Math.min(cfg.dMax, grown) };
}

/**
 * Starting state for a player joining a club.
 * `unknown` uses the club median rating (or 1300 when fewer than 5 rated players).
 */
export function startingRating(
  playerId: PlayerId,
  source: StartSource,
  tier: Tier | null,
  clubMedianRating: number | null = null,
): PlayerRating {
  const rating = tier ? TIER_RATINGS[tier] : (clubMedianRating ?? TIER_RATINGS.intermediate);
  return {
    playerId,
    rating,
    deviation: START_DEVIATION[source],
    matchesCounted: 0,
    lastPlayedAt: null,
    recentSurprises: [],
    startSource: source,
  };
}

/**
 * Rates one confirmed match (§A5, §A5a).
 * `states` must contain every player in the match; it is not mutated.
 */
export function rateMatch(
  states: ReadonlyMap<PlayerId, PlayerRating>,
  match: RatedMatchInput,
  cfg: RatingConfig = DEFAULT_RATING_CONFIG,
): RateMatchResult {
  if (match.teamA.length === 0 || match.teamA.length !== match.teamB.length) {
    throw new Error(`Match ${match.matchId}: teams must be non-empty and equal in size`);
  }
  const all = [...match.teamA, ...match.teamB];
  if (new Set(all).size !== all.length) throw new Error(`Match ${match.matchId}: a player appears twice`);
  if (match.pointsA === match.pointsB) throw new Error(`Match ${match.matchId}: a game cannot be drawn`);

  if (match.resultKind === 'retired_injury') return { rated: false, changes: [], updated: [] };

  const before = new Map<PlayerId, PlayerRating>();
  for (const id of all) {
    const s = states.get(id);
    if (!s) throw new Error(`Match ${match.matchId}: no rating state for player ${id}`);
    before.set(id, applyInactivity(s, match.playedAt, cfg));
  }
  const get = (id: PlayerId) => before.get(id)!;

  const weight = match.resultKind === 'unfinished_time' ? cfg.unfinishedWeight : 1;
  const rA = teamRating(match.teamA.map((id) => get(id).rating));
  const rB = teamRating(match.teamB.map((id) => get(id).rating));
  const dA = teamDeviation(match.teamA.map((id) => get(id).deviation));
  const dB = teamDeviation(match.teamB.map((id) => get(id).deviation));
  const eA = expectedScore(rA, rB, cfg);
  const sA = actualScore(match.pointsA, match.pointsB, cfg);
  const aWon = match.pointsA > match.pointsB;

  const changes: RatingChange[] = [];
  const updated: PlayerRating[] = [];

  const sides = [
    { team: 'A' as const, ids: match.teamA, rTeam: rA, rOpp: rB, dOpp: dB, e: eA, s: sA, won: aWon },
    { team: 'B' as const, ids: match.teamB, rTeam: rB, rOpp: rA, dOpp: dA, e: 1 - eA, s: 1 - sA, won: !aWon },
  ];

  for (const side of sides) {
    const fOpp = opponentConfidence(side.dOpp, cfg);
    const surprise = side.s - side.e;
    const varSum = side.ids.reduce((s, id) => s + get(id).deviation ** 2, 0);
    const teamK = stepSize(teamDeviation(side.ids.map((id) => get(id).deviation)), cfg);
    for (const id of side.ids) {
      const st = get(id);
      const original = states.get(id)!;
      // 'equal': own step size. 'uncertainty': the team's step size, shared by uncertainty².
      const k =
        cfg.sharing === 'uncertainty'
          ? (teamK * side.ids.length * st.deviation ** 2) / varSum
          : stepSize(st.deviation, cfg);
      const raw = k * fOpp * surprise * weight;
      let change = raw;
      let guardrailApplied = false;
      if (cfg.guardrail === 'B' && side.won && change < 0) {
        change = 0;
        guardrailApplied = true;
      }

      const recent = [...st.recentSurprises, surprise].slice(-cfg.surpriseWindow);
      const sumSurprise = recent.reduce((s, x) => s + x, 0);
      let adaptive = false;
      if (cfg.adaptiveMode === 'window') {
        adaptive = recent.length >= cfg.surpriseWindow && Math.abs(sumSurprise / recent.length) >= cfg.surpriseThreshold;
      } else if (cfg.adaptiveMode === 'zscore') {
        const z = sumSurprise / (cfg.perMatchNoise * Math.sqrt(recent.length));
        adaptive = recent.length >= cfg.zMinMatches && Math.abs(z) >= cfg.zThreshold;
      }
      const newDeviation = adaptive
        ? Math.min(cfg.dMax, st.deviation * cfg.adaptiveGrowth)
        : Math.max(cfg.dMin, st.deviation * cfg.shrink);

      const next: PlayerRating = {
        ...st,
        rating: st.rating + change,
        deviation: newDeviation,
        matchesCounted: st.matchesCounted + 1,
        lastPlayedAt: match.playedAt,
        recentSurprises: recent,
      };
      updated.push(next);
      changes.push({
        matchId: match.matchId,
        playerId: id,
        team: side.team,
        won: side.won,
        ratingBefore: round(original.rating, 2),
        ratingAfter: round(next.rating, 2),
        deviationBefore: round(original.deviation, 2),
        deviationAtStart: round(st.deviation, 2),
        deviationAfter: round(next.deviation, 2),
        teamRating: round(side.rTeam, 2),
        opponentRating: round(side.rOpp, 2),
        expected: round(side.e),
        actual: round(side.s),
        k: round(k, 3),
        opponentConfidence: round(fOpp, 3),
        weight,
        rawChange: round(raw, 3),
        change: round(change, 3),
        guardrailApplied,
        adaptiveTriggered: adaptive,
        reviewSuggested: adaptive && st.deviation < cfg.dMax,
        engineVersion: ENGINE_VERSION,
      });
    }
  }

  return { rated: true, changes, updated };
}

/** Plain-language explanation shown to the player (§A7). */
export function explainChange(c: RatingChange, cfg: RatingConfig = DEFAULT_RATING_CONFIG): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const sign = c.change >= 0 ? '+' : '';
  const conf = confidenceOf(c.deviationAtStart, cfg);
  const stepNote =
    conf === 'low' ? 'low confidence, so your rating moves faster' : conf === 'medium' ? 'medium confidence' : 'established rating';
  const parts = [
    `Your team (avg ${Math.round(c.teamRating)}) vs opponents (avg ${Math.round(c.opponentRating)}): expected share ${pct(c.expected)}.`,
    `You ${c.won ? 'won' : 'lost'}, a performance of ${pct(c.actual)} (${c.actual >= c.expected ? 'above' : 'below'} expectation by ${Math.round(Math.abs(c.actual - c.expected) * 100)} points).`,
    `Change: ${sign}${c.change.toFixed(1)} = step size ${c.k.toFixed(1)} (${stepNote}) × ${c.opponentConfidence.toFixed(2)} (opponent confidence) × ${(c.actual - c.expected).toFixed(2)}${c.weight !== 1 ? ` × ${c.weight} (unfinished game)` : ''}.`,
  ];
  if (c.guardrailApplied) parts.push('A win never lowers your rating, so this change was set to 0.');
  return parts.join(' ');
}
