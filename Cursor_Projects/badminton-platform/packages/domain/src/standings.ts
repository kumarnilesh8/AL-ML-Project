import type { PlayerId, StandingsMethod } from './types';

/** One confirmed game from a player's point of view. Voided games must not be included. */
export interface PlayerGame {
  won: boolean;
  pointsFor: number;
  pointsAgainst: number;
}

export interface StandingsInput {
  playerId: PlayerId;
  games: PlayerGame[];
}

export interface StandingsOptions {
  method: StandingsMethod;
  /** Organiser minimum games to receive a rank number (e.g. 3). */
  minGames: number;
}

export interface StandingsRow {
  playerId: PlayerId;
  games: number;
  wins: number;
  losses: number;
  winPct: number; // 0..1
  pointsFor: number;
  pointsAgainst: number;
  avgPointsDiff: number;
  qualified: boolean;
  /** Shared position for ties; null when not qualified ("Not enough games"). */
  rank: number | null;
}

export interface StandingsResult {
  qualificationThreshold: number;
  ranked: StandingsRow[];
  notEnoughGames: StandingsRow[];
}

/**
 * Session standings (rating-and-matching.md Part E).
 * Default ranking: win %, then average points difference per game, then total wins.
 * Qualification: games >= max(minGames, half the session's average games).
 */
export function computeStandings(inputs: StandingsInput[], options: StandingsOptions): StandingsResult {
  const rows: StandingsRow[] = inputs
    .filter((p) => p.games.length > 0)
    .map((p) => {
      const games = p.games.length;
      const wins = p.games.filter((g) => g.won).length;
      const pf = p.games.reduce((s, g) => s + g.pointsFor, 0);
      const pa = p.games.reduce((s, g) => s + g.pointsAgainst, 0);
      return {
        playerId: p.playerId,
        games,
        wins,
        losses: games - wins,
        winPct: wins / games,
        pointsFor: pf,
        pointsAgainst: pa,
        avgPointsDiff: (pf - pa) / games,
        qualified: false,
        rank: null,
      };
    });

  const avgGames = rows.length ? rows.reduce((s, r) => s + r.games, 0) / rows.length : 0;
  const threshold = Math.max(options.minGames, avgGames / 2);
  for (const r of rows) r.qualified = r.games >= threshold;

  const primary = (r: StandingsRow) => (options.method === 'win_pct' ? r.winPct : r.wins);
  const secondary = (r: StandingsRow) => r.avgPointsDiff;
  const tertiary = (r: StandingsRow) => (options.method === 'win_pct' ? r.wins : r.winPct);

  const EPS = 1e-9;
  const cmp = (a: StandingsRow, b: StandingsRow): number => {
    const d1 = primary(b) - primary(a);
    if (Math.abs(d1) > EPS) return d1;
    const d2 = secondary(b) - secondary(a);
    if (Math.abs(d2) > EPS) return d2;
    const d3 = tertiary(b) - tertiary(a);
    if (Math.abs(d3) > EPS) return d3;
    return 0;
  };

  const ranked = rows.filter((r) => r.qualified).sort((a, b) => cmp(a, b) || a.playerId.localeCompare(b.playerId));
  // Competition ranking: ties share a position (1, 2, 2, 4).
  ranked.forEach((r, i) => {
    const prev = ranked[i - 1];
    r.rank = prev && cmp(prev, r) === 0 ? prev.rank : i + 1;
  });

  const notEnoughGames = rows
    .filter((r) => !r.qualified)
    .sort((a, b) => cmp(a, b) || a.playerId.localeCompare(b.playerId));

  return { qualificationThreshold: threshold, ranked, notEnoughGames };
}
