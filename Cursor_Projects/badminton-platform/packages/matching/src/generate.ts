import { createRng, pairKey, type PlayerId, type Rng, type Team } from '@bp/domain';
import { emptyHistory } from './history';
import { MATCHING_ENGINE_VERSION, PRESETS } from './presets';
import type {
  CostWeights,
  GenerateRoundInput,
  GenerateRoundResult,
  GeneratedMatch,
  MatchExplanation,
  MatchingHistory,
  MatchingPlayer,
  PlacementLock,
  RepeatNote,
  SitOut,
  SitOutReason,
} from './types';

/**
 * Round generator (rating-and-matching.md Part B, round mode).
 *
 * Step 1–3: decide who sits out, fairness first (never traded for match quality).
 * Step 4:   split the players into groups of four and teams of two, minimising cost.
 * Step 5–6: assign courts and explain every match.
 *
 * Deterministic: the same input and seed always produce the same round.
 */

interface Unit {
  ids: PlayerId[]; // 1 player, or 2 for a fixed pair
  courtIndex: number | null; // locked court (index into used courts)
}

interface SplitResult {
  cost: number;
  teamA: [PlayerId, PlayerId];
  teamB: [PlayerId, PlayerId];
  expectedA: number;
}

const DEFAULT_LOW_CONFIDENCE = 150;
/** Per-court cost treated as perfect (≈ a 50.5% / 49.5% match with no repeats). */
const NEAR_PERFECT = 1e-4;

export function generateRound(input: GenerateRoundInput): GenerateRoundResult {
  const lowAt = input.lowConfidenceAt ?? DEFAULT_LOW_CONFIDENCE;
  const weights: CostWeights = { ...PRESETS[input.preset], ...input.weights };
  const history = input.history ?? emptyHistory();
  const fixedPairs = input.fixedPairs ?? [];
  const locks = input.locks ?? [];

  // ---------- validation ----------
  const byId = new Map<PlayerId, MatchingPlayer>();
  for (const p of input.players) {
    if (byId.has(p.id)) return invalid(`Player ${p.id} appears twice`);
    if (!Number.isFinite(p.rating) || !Number.isFinite(p.deviation)) return invalid(`Player ${p.id} has an invalid rating`);
    byId.set(p.id, p);
  }
  if (input.courtIds.length === 0) return { ok: false, error: 'NO_COURTS', message: 'No active courts' };
  if (new Set(input.courtIds).size !== input.courtIds.length) return invalid('Duplicate court ids');
  if (byId.size < 4) {
    return {
      ok: false,
      error: 'NOT_ENOUGH_PLAYERS',
      message: `At least 4 available players are needed; ${4 - byId.size} more required`,
      playersNeeded: 4 - byId.size,
    };
  }

  const partnerOf = new Map<PlayerId, PlayerId>();
  for (const fp of fixedPairs) {
    if (!byId.has(fp.a) || !byId.has(fp.b)) continue; // partner not available: pair ignored this round
    if (fp.a === fp.b || partnerOf.has(fp.a) || partnerOf.has(fp.b)) return invalid('A player can have only one fixed partner');
    partnerOf.set(fp.a, fp.b);
    partnerOf.set(fp.b, fp.a);
  }

  const lockByPlayer = new Map<PlayerId, PlacementLock>();
  for (const l of locks) {
    if (!byId.has(l.playerId)) return invalid(`Locked player ${l.playerId} is not available`);
    if (!input.courtIds.includes(l.courtId)) return invalid(`Lock refers to inactive court ${l.courtId}`);
    lockByPlayer.set(l.playerId, l);
  }
  for (const [a, b] of partnerOf) {
    const la = lockByPlayer.get(a);
    const lb = lockByPlayer.get(b);
    if (la && lb && la.courtId !== lb.courtId) return conflict('Fixed partners are locked to different courts');
    if (la && lb && la.team && lb.team && la.team !== lb.team) return conflict('Fixed partners are locked to different teams');
  }

  const rng = createRng(input.seed);

  // ---------- choose courts and sit-outs ----------
  const maxCourts = Math.min(input.courtIds.length, Math.floor(byId.size / 4));
  // Courts with locks are used first, then the rest in display order.
  const lockedCourtIds = new Set(locks.map((l) => l.courtId));
  const courtOrder = [
    ...input.courtIds.filter((c) => lockedCourtIds.has(c)),
    ...input.courtIds.filter((c) => !lockedCourtIds.has(c)),
  ];

  // Random tie-break value per player, drawn once (deterministic for the seed).
  const tieValue = new Map<PlayerId, number>();
  for (const id of [...byId.keys()].sort()) tieValue.set(id, rng());

  let courts = maxCourts;
  let selection: ReturnType<typeof selectSitOuts> | null = null;
  while (courts > 0) {
    const usedCourts = courtOrder.slice(0, courts);
    if ([...lockedCourtIds].some((c) => !usedCourts.includes(c))) {
      return conflict('Too few players to fill every court that has a locked player');
    }
    selection = selectSitOuts(byId, partnerOf, lockByPlayer, courts, tieValue);
    if (selection) break;
    courts--;
  }
  if (!selection || courts === 0) {
    return { ok: false, error: 'NOT_ENOUGH_PLAYERS', message: 'Not enough players to form a match', playersNeeded: 0 };
  }
  const usedCourts = courtOrder.slice(0, courts);
  const courtIndexOf = new Map(usedCourts.map((c, i) => [c, i] as const));

  // ---------- build units ----------
  const playingIds = selection.playing;
  const units: Unit[] = [];
  const seen = new Set<PlayerId>();
  for (const id of playingIds) {
    if (seen.has(id)) continue;
    const partner = partnerOf.get(id);
    const ids = partner && playingIds.includes(partner) ? [id, partner] : [id];
    ids.forEach((x) => seen.add(x));
    const lock = ids.map((x) => lockByPlayer.get(x)).find((l) => l);
    units.push({ ids, courtIndex: lock ? courtIndexOf.get(lock.courtId)! : null });
  }

  // ---------- initial arrangement ----------
  const groups: Unit[][] = Array.from({ length: courts }, () => []);
  const size = (g: Unit[]) => g.reduce((s, u) => s + u.ids.length, 0);
  const place = (u: Unit, gi: number) => groups[gi]!.push(u);

  for (const u of units.filter((u) => u.courtIndex !== null)) {
    place(u, u.courtIndex!);
    if (size(groups[u.courtIndex!]!) > 4) return conflict('More than four players locked to one court');
  }
  const rating = (id: PlayerId) => byId.get(id)!.rating;
  const unitRating = (u: Unit) => u.ids.reduce((s, id) => s + rating(id), 0) / u.ids.length;
  const freePairs = units.filter((u) => u.courtIndex === null && u.ids.length === 2).sort((a, b) => unitRating(b) - unitRating(a));
  const freeSingles = units.filter((u) => u.courtIndex === null && u.ids.length === 1).sort((a, b) => unitRating(b) - unitRating(a));
  for (const u of freePairs) {
    const gi = groups.findIndex((g) => size(g) <= 2);
    if (gi < 0) return conflict('Cannot place fixed pairs with the current locks');
    place(u, gi);
  }
  // Snake order for singles gives a reasonable starting balance.
  const snake: number[] = [];
  for (let i = 0; i < courts; i++) snake.push(i);
  for (let i = courts - 1; i >= 0; i--) snake.push(i);
  let pointer = 0;
  for (const u of freeSingles) {
    let guard = 0;
    while (size(groups[snake[pointer % snake.length]!]!) >= 4 && guard++ < snake.length * 2) pointer++;
    const gi = snake[pointer % snake.length]!;
    if (size(groups[gi]!) >= 4) return conflict('Could not fill courts');
    place(u, gi);
    pointer++;
  }
  if (groups.some((g) => size(g) !== 4)) return conflict('Could not form complete groups of four');

  // ---------- cost ----------
  const ctx = buildCostContext(byId, history, weights, partnerOf, lockByPlayer, lowAt);
  const evalGroup = (g: Unit[]): SplitResult => bestSplit(g, ctx);

  let current = groups.map((g) => g.slice());
  let currentEval = current.map(evalGroup);
  let currentCost = currentEval.reduce((s, e) => s + e.cost, 0);
  let best = current.map((g) => g.slice());
  let bestEval = currentEval.slice();
  let bestCost = currentCost;

  // Tie band: sit-outs and players with identical sit-out priority may be exchanged.
  const sitting = selection.sitting.slice();
  const tieBand = new Set(selection.tieBand);
  let bestSitting: PlayerId[] | undefined;

  const iterations = input.iterations ?? Math.min(12000, Math.max(1500, 1500 * courts));
  const t0 = 0.5;
  const t1 = 0.002;

  // Deterministic early exits: a perfect round, or no improvement for a long stretch.
  const patience = Math.max(800, Math.floor(iterations / 5));
  let sinceImprovement = 0;
  let iterationsRun = 0;
  for (let it = 0; it < iterations; it++) {
    if (bestCost <= NEAR_PERFECT * courts || sinceImprovement > patience) break;
    iterationsRun++;
    sinceImprovement++;
    const temp = t0 * (t1 / t0) ** (it / iterations);
    const move = proposeMove(current, sitting, tieBand, rng);
    if (!move) continue;
    const { groupsAfter, sittingAfter, changed } = move;
    const newEvals = currentEval.slice();
    let newCost = currentCost;
    for (const gi of changed) {
      const e = evalGroup(groupsAfter[gi]!);
      newCost += e.cost - currentEval[gi]!.cost;
      newEvals[gi] = e;
    }
    const delta = newCost - currentCost;
    if (delta <= 0 || rng() < Math.exp(-delta / temp)) {
      current = groupsAfter;
      currentEval = newEvals;
      currentCost = newCost;
      if (sittingAfter) sitting.splice(0, sitting.length, ...sittingAfter);
      if (currentCost < bestCost - 1e-12) {
        best = current.map((g) => g.slice());
        bestEval = currentEval.slice();
        bestCost = currentCost;
        bestSitting = sitting.slice();
        sinceImprovement = 0;
      }
    }
  }

  // ---------- output ----------
  const finalSitting = bestSitting ?? selection.sitting;
  const playingNow = new Set(best.flat().flatMap((u) => u.ids));
  const matches: GeneratedMatch[] = best.map((_, gi) => {
    const ev = bestEval[gi]!;
    return {
      courtId: usedCourts[gi]!,
      teamA: ev.teamA,
      teamB: ev.teamB,
      predictedA: ev.expectedA,
      cost: ev.cost,
      explanation: explainMatch(ev, byId, history, lowAt),
    };
  });

  const sitOuts: SitOut[] = finalSitting.map((id) => sitOutNote(id, byId, playingNow));

  const quality = {
    totalCost: round(bestCost, 4),
    closeMatches: matches.filter((m) => m.predictedA >= 0.35 && m.predictedA <= 0.65).length,
    repeatPartnerships: matches.reduce((s, m) => s + m.explanation.repeats.filter((r) => r.type === 'partner' && r.timesThisSession > 0).length, 0),
    repeatOpponents: matches.reduce((s, m) => s + m.explanation.repeats.filter((r) => r.type === 'opponent' && r.timesThisSession > 0).length, 0),
    maxRatingRange: Math.max(
      ...matches.map((m) => {
        const rs = [...m.teamA, ...m.teamB].map(rating);
        return Math.max(...rs) - Math.min(...rs);
      }),
    ),
  };

  return {
    ok: true,
    matches,
    sitOuts,
    quality,
    seed: input.seed,
    iterations: iterationsRun,
    engineVersion: MATCHING_ENGINE_VERSION,
  };
}

// =====================================================================
// Sit-out selection (fairness first)
// =====================================================================

interface SitOutSelection {
  playing: PlayerId[];
  sitting: PlayerId[];
  /** Single players (playing or sitting) sharing the boundary priority; exchangeable. */
  tieBand: PlayerId[];
}

function selectSitOuts(
  byId: Map<PlayerId, MatchingPlayer>,
  partnerOf: Map<PlayerId, PlayerId>,
  lockByPlayer: Map<PlayerId, PlacementLock>,
  courts: number,
  tieValue: Map<PlayerId, number>,
): SitOutSelection | null {
  const needSitting = byId.size - courts * 4;
  type SUnit = { ids: PlayerId[]; locked: boolean; protectedFlag: number; games: number; sitOuts: number; tie: number };
  const done = new Set<PlayerId>();
  const sunits: SUnit[] = [];
  for (const id of [...byId.keys()].sort()) {
    if (done.has(id)) continue;
    const partner = partnerOf.get(id);
    const ids = partner ? [id, partner] : [id];
    ids.forEach((x) => done.add(x));
    const ps = ids.map((x) => byId.get(x)!);
    sunits.push({
      ids,
      locked: ids.some((x) => lockByPlayer.has(x)),
      protectedFlag: ps.some((p) => p.satOutLastRound) ? 1 : 0,
      games: Math.max(...ps.map((p) => p.gamesPlayed)),
      sitOuts: Math.min(...ps.map((p) => p.sitOutsTotal)),
      tie: Math.min(...ids.map((x) => tieValue.get(x)!)),
    });
  }

  // Order: who should sit out first.
  // 1) players who did NOT sit out last round (hard protection for those who did)
  // 2) most games played  3) fewest sit-outs  4) seeded random
  const order = sunits
    .filter((u) => !u.locked)
    .sort((a, b) => a.protectedFlag - b.protectedFlag || b.games - a.games || a.sitOuts - b.sitOuts || a.tie - b.tie);

  const sitting: SUnit[] = [];
  let count = 0;
  for (const u of order) {
    if (count === needSitting) break;
    if (count + u.ids.length <= needSitting) {
      sitting.push(u);
      count += u.ids.length;
    }
  }
  if (count !== needSitting) return null;

  const sittingSet = new Set(sitting.flatMap((u) => u.ids));
  const playing = [...byId.keys()].filter((id) => !sittingSet.has(id)).sort();

  // Tie band: singles whose (protected, games, sitOuts) equals that of the last chosen sitter.
  let tieBand: PlayerId[] = [];
  const boundary = sitting[sitting.length - 1];
  if (boundary) {
    const same = (u: SUnit) =>
      u.ids.length === 1 &&
      !u.locked &&
      u.protectedFlag === boundary.protectedFlag &&
      u.games === boundary.games &&
      u.sitOuts === boundary.sitOuts;
    tieBand = sunits.filter(same).flatMap((u) => u.ids);
  }
  return { playing, sitting: [...sittingSet].sort(), tieBand };
}

// =====================================================================
// Moves for the optimiser
// =====================================================================

function proposeMove(
  groups: Unit[][],
  sitting: PlayerId[],
  tieBand: Set<PlayerId>,
  rng: Rng,
): { groupsAfter: Unit[][]; sittingAfter?: PlayerId[]; changed: number[] } | null {
  const g = groups.length;
  const r = rng();

  // Occasionally try exchanging a tie-band player with a tie-band sit-out.
  if (tieBand.size > 1 && sitting.length > 0 && (g === 1 || r < 0.15)) {
    const sitCandidates = sitting.filter((id) => tieBand.has(id));
    const playCandidates: { gi: number; ui: number }[] = [];
    groups.forEach((grp, gi) =>
      grp.forEach((u, ui) => {
        if (u.courtIndex === null && u.ids.length === 1 && tieBand.has(u.ids[0]!)) playCandidates.push({ gi, ui });
      }),
    );
    if (sitCandidates.length && playCandidates.length) {
      const out = sitCandidates[Math.floor(rng() * sitCandidates.length)]!;
      const pick = playCandidates[Math.floor(rng() * playCandidates.length)]!;
      const groupsAfter = groups.slice();
      const grp = groupsAfter[pick.gi]!.slice();
      const inId = grp[pick.ui]!.ids[0]!;
      grp[pick.ui] = { ids: [out], courtIndex: null };
      groupsAfter[pick.gi] = grp;
      const sittingAfter = sitting.map((id) => (id === out ? inId : id)).sort();
      return { groupsAfter, sittingAfter, changed: [pick.gi] };
    }
  }
  if (g < 2) return null;

  const i = Math.floor(rng() * g);
  let j = Math.floor(rng() * (g - 1));
  if (j >= i) j++;
  const gi = groups[i]!;
  const gj = groups[j]!;
  const freeI = gi.map((u, idx) => ({ u, idx })).filter((x) => x.u.courtIndex === null);
  if (!freeI.length) return null;
  const a = freeI[Math.floor(rng() * freeI.length)]!;
  const freeJ = gj.map((u, idx) => ({ u, idx })).filter((x) => x.u.courtIndex === null);

  let newI: Unit[];
  let newJ: Unit[];
  if (a.u.ids.length === 1) {
    const singlesJ = freeJ.filter((x) => x.u.ids.length === 1);
    if (!singlesJ.length) return null;
    const b = singlesJ[Math.floor(rng() * singlesJ.length)]!;
    newI = gi.slice();
    newJ = gj.slice();
    newI[a.idx] = b.u;
    newJ[b.idx] = a.u;
  } else {
    // Pair: swap with another pair, or with two singles.
    const pairsJ = freeJ.filter((x) => x.u.ids.length === 2);
    const singlesJ = freeJ.filter((x) => x.u.ids.length === 1);
    const usePair = pairsJ.length > 0 && (singlesJ.length < 2 || rng() < 0.5);
    if (usePair) {
      const b = pairsJ[Math.floor(rng() * pairsJ.length)]!;
      newI = gi.slice();
      newJ = gj.slice();
      newI[a.idx] = b.u;
      newJ[b.idx] = a.u;
    } else {
      if (singlesJ.length < 2) return null;
      const s1 = Math.floor(rng() * singlesJ.length);
      let s2 = Math.floor(rng() * (singlesJ.length - 1));
      if (s2 >= s1) s2++;
      const b1 = singlesJ[s1]!;
      const b2 = singlesJ[s2]!;
      newI = gi.filter((_, idx) => idx !== a.idx).concat([b1.u, b2.u]);
      newJ = gj.filter((_, idx) => idx !== b1.idx && idx !== b2.idx).concat([a.u]);
    }
  }
  const groupsAfter = groups.slice();
  groupsAfter[i] = newI;
  groupsAfter[j] = newJ;
  return { groupsAfter, changed: [i, j] };
}

// =====================================================================
// Cost of one group of four (B4)
// =====================================================================

const SPLITS: [number, number, number, number][] = [
  [0, 1, 2, 3],
  [0, 2, 1, 3],
  [0, 3, 1, 2],
];

/** Precomputed numeric tables so the optimiser's inner loop avoids string work. */
interface CostContext {
  index: Map<PlayerId, number>;
  ids: PlayerId[];
  rating: Float64Array;
  low: Uint8Array;
  partnerPen: Float64Array; // n*n: session + 0.25 * recent (0 for fixed partners)
  oppPen: Float64Array; // n*n: 0.5 * session + 0.1 * recent
  fixedPartner: Int32Array; // index of fixed partner or -1
  teamLock: Int8Array; // 0 none, 1 = A, 2 = B
  n: number;
  w: CostWeights;
}

function buildCostContext(
  byId: Map<PlayerId, MatchingPlayer>,
  history: MatchingHistory,
  w: CostWeights,
  partnerOf: Map<PlayerId, PlayerId>,
  lockByPlayer: Map<PlayerId, PlacementLock>,
  lowAt: number,
): CostContext {
  const ids = [...byId.keys()].sort();
  const n = ids.length;
  const index = new Map(ids.map((id, i) => [id, i] as const));
  const rating = new Float64Array(n);
  const low = new Uint8Array(n);
  const fixedPartner = new Int32Array(n).fill(-1);
  const teamLock = new Int8Array(n);
  ids.forEach((id, i) => {
    const p = byId.get(id)!;
    rating[i] = p.rating;
    low[i] = p.deviation >= lowAt ? 1 : 0;
    const fp = partnerOf.get(id);
    if (fp !== undefined) fixedPartner[i] = index.get(fp)!;
    const t = lockByPlayer.get(id)?.team;
    teamLock[i] = t === 'A' ? 1 : t === 'B' ? 2 : 0;
  });
  const partnerPen = new Float64Array(n * n);
  const oppPen = new Float64Array(n * n);
  for (const [key, c] of history.partners) {
    const [a, b] = key.split('|');
    const ia = index.get(a!);
    const ib = index.get(b!);
    if (ia === undefined || ib === undefined) continue;
    if (fixedPartner[ia] === ib) continue; // fixed partners are expected to repeat
    const v = c.session + 0.25 * c.recent;
    partnerPen[ia * n + ib] = v;
    partnerPen[ib * n + ia] = v;
  }
  for (const [key, c] of history.opponents) {
    const [a, b] = key.split('|');
    const ia = index.get(a!);
    const ib = index.get(b!);
    if (ia === undefined || ib === undefined) continue;
    const v = 0.5 * c.session + 0.1 * c.recent;
    oppPen[ia * n + ib] = v;
    oppPen[ib * n + ia] = v;
  }
  return { index, ids, rating, low, partnerPen, oppPen, fixedPartner, teamLock, n, w };
}

function bestSplit(group: Unit[], ctx: CostContext): SplitResult {
  const { rating, low, partnerPen, oppPen, fixedPartner, teamLock, n, w } = ctx;
  const q: number[] = [];
  for (const u of group) for (const id of u.ids) q.push(ctx.index.get(id)!);
  q.sort((x, y) => x - y);

  let rMin = Infinity;
  let rMax = -Infinity;
  let sum = 0;
  for (const i of q) {
    const r = rating[i]!;
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    sum += r;
  }
  const mean = sum / 4;
  const cRange = Math.max(0, (rMax - rMin - w.rangeTolerance) / 400);
  let cLow = 0;
  let lowCount = 0;
  for (const i of q)
    if (low[i]) {
      cLow += Math.abs(rating[i]! - mean) / 400;
      lowCount++;
    }
  if (lowCount > 2) cLow += 1;
  const fixedTerms = w.range * cRange + w.lowConfidence * cLow;

  let bestCost = Infinity;
  let bestA0 = -1, bestA1 = -1, bestB0 = -1, bestB1 = -1, bestE = 0.5;
  for (const sp of SPLITS) {
    let a0 = q[sp[0]]!, a1 = q[sp[1]]!, b0 = q[sp[2]]!, b1 = q[sp[3]]!;
    // Fixed partners must share a team.
    let valid = true;
    for (const i of q) {
      const f = fixedPartner[i]!;
      if (f < 0 || !q.includes(f)) continue;
      const iA = i === a0 || i === a1;
      const fA = f === a0 || f === a1;
      if (iA !== fA) valid = false;
    }
    if (!valid) continue;
    // Team-side locks: orient the teams, or reject the split.
    const fits = (x0: number, x1: number, y0: number, y1: number) =>
      teamLock[x0] !== 2 && teamLock[x1] !== 2 && teamLock[y0] !== 1 && teamLock[y1] !== 1;
    if (!fits(a0, a1, b0, b1)) {
      if (fits(b0, b1, a0, a1)) [a0, a1, b0, b1] = [b0, b1, a0, a1];
      else continue;
    }
    const rA = (rating[a0]! + rating[a1]!) / 2;
    const rB = (rating[b0]! + rating[b1]!) / 2;
    const eA = 1 / (1 + 10 ** ((rB - rA) / 400));
    const d = (eA - 0.5) / 0.5;
    const cPartner = partnerPen[a0 * n + a1]! + partnerPen[b0 * n + b1]!;
    const cOpp = oppPen[a0 * n + b0]! + oppPen[a0 * n + b1]! + oppPen[a1 * n + b0]! + oppPen[a1 * n + b1]!;
    const cost = w.balance * d * d + w.partner * cPartner + w.opponent * cOpp + fixedTerms;
    if (cost < bestCost - 1e-12) {
      bestCost = cost;
      bestA0 = a0; bestA1 = a1; bestB0 = b0; bestB1 = b1; bestE = eA;
    }
  }
  const id = (i: number) => ctx.ids[i]!;
  if (bestA0 < 0) {
    // No split satisfies the constraints (prevented by validation); make it very unattractive.
    return { cost: 1e6, teamA: [id(q[0]!), id(q[1]!)], teamB: [id(q[2]!), id(q[3]!)], expectedA: 0.5 };
  }
  return { cost: bestCost, teamA: [id(bestA0), id(bestA1)], teamB: [id(bestB0), id(bestB1)], expectedA: bestE };
}

// =====================================================================
// Explanations
// =====================================================================

function explainMatch(
  ev: SplitResult,
  byId: Map<PlayerId, MatchingPlayer>,
  history: MatchingHistory,
  lowAt: number,
): MatchExplanation {
  const all = [...ev.teamA, ...ev.teamB];
  const p = (id: PlayerId) => byId.get(id)!;
  const selected = all.map((id) => ({
    playerId: id,
    reason: p(id).satOutLastRound
      ? 'sat out last round'
      : `has played ${p(id).gamesPlayed} game${p(id).gamesPlayed === 1 ? '' : 's'} this session`,
  }));
  const rA = (p(ev.teamA[0]).rating + p(ev.teamA[1]).rating) / 2;
  const rB = (p(ev.teamB[0]).rating + p(ev.teamB[1]).rating) / 2;

  const repeats: RepeatNote[] = [];
  for (const [x, y] of [ev.teamA, ev.teamB]) {
    const c = history.partners.get(pairKey(x, y));
    if (c && (c.session > 0 || c.recent > 0))
      repeats.push({ type: 'partner', players: [x, y], timesThisSession: c.session, timesRecently: c.recent });
  }
  for (const x of ev.teamA)
    for (const y of ev.teamB) {
      const c = history.opponents.get(pairKey(x, y));
      if (c && c.session > 0) repeats.push({ type: 'opponent', players: [x, y], timesThisSession: c.session, timesRecently: c.recent });
    }
  const lowConfidencePlayers = all.filter((id) => p(id).deviation >= lowAt);

  const pct = (x: number) => Math.round(x * 100);
  const lines: string[] = [];
  const satOut = selected.filter((s) => s.reason === 'sat out last round').map((s) => s.playerId);
  lines.push(
    satOut.length
      ? `Selected to play: ${satOut.join(', ')} sat out last round; others chosen by games played.`
      : 'Selected to play: chosen by games played so far, so court time stays even.',
  );
  lines.push(`Predicted: ${pct(ev.expectedA)}% / ${pct(1 - ev.expectedA)}% (team averages ${Math.round(rA)} vs ${Math.round(rB)}).`);
  const sessionRepeats = repeats.filter((r) => r.timesThisSession > 0);
  if (sessionRepeats.length === 0) lines.push('Variety: no repeated partners or opponents from this session.');
  else
    for (const r of sessionRepeats)
      lines.push(
        `Variety: ${r.players[0]} and ${r.players[1]} have already been ${r.type === 'partner' ? 'partners' : 'opponents'} ${r.timesThisSession} time${r.timesThisSession === 1 ? '' : 's'} this session (no better option found).`,
      );
  for (const id of lowConfidencePlayers)
    lines.push(`Note: ${id}'s rating has low confidence, so they are placed in a mid-range game to help settle it.`);

  return {
    selected,
    teamARating: round(rA, 1),
    teamBRating: round(rB, 1),
    predictedA: round(ev.expectedA, 4),
    predictedB: round(1 - ev.expectedA, 4),
    repeats,
    lowConfidencePlayers,
    lines,
  };
}

function sitOutNote(id: PlayerId, byId: Map<PlayerId, MatchingPlayer>, playing: Set<PlayerId>): SitOut {
  const p = byId.get(id)!;
  const players = [...playing].map((x) => byId.get(x)!);
  const minGamesPlaying = Math.min(...players.map((x) => x.gamesPlayed));
  const maxSitOutsPlaying = Math.max(...players.map((x) => x.sitOutsTotal));
  let reason: SitOutReason;
  let text: string;
  if (p.satOutLastRound) {
    reason = 'repeat_unavoidable';
    text = 'Sitting out again: there were not enough places this round.';
  } else if (p.gamesPlayed > minGamesPlaying) {
    reason = 'most_games';
    text = `Has played ${p.gamesPlayed} games, more than some players who are on court.`;
  } else if (p.sitOutsTotal < maxSitOutsPlaying) {
    reason = 'fewest_sit_outs';
    text = 'Has sat out fewer times than others this session.';
  } else {
    reason = 'tie_break';
    text = 'Level with others on games and sit-outs; chosen by a fair random draw.';
  }
  return { playerId: id, reason, text };
}

// =====================================================================

function round(x: number, dp: number) {
  return Math.round(x * 10 ** dp) / 10 ** dp;
}
function invalid(message: string): GenerateRoundResult {
  return { ok: false, error: 'INVALID_INPUT', message };
}
function conflict(message: string): GenerateRoundResult {
  return { ok: false, error: 'LOCKS_CONFLICT', message };
}
