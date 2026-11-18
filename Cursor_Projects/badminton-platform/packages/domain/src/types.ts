export type Team = 'A' | 'B';
export type PlayerId = string;

export type MatchingPreset = 'social' | 'balanced' | 'competitive';
export type StandingsMethod = 'win_pct' | 'most_wins';
export type Confidence = 'low' | 'medium' | 'high';

/** Plain-language starting tiers (original to this product). */
export type Tier = 'new' | 'beginner' | 'improver' | 'intermediate' | 'advanced' | 'competitive';

export type StartSource = 'unknown' | 'self' | 'organiser' | 'external';

export type ResultKind = 'finished' | 'unfinished_time' | 'retired_injury';

/** Canonical key for an unordered pair of players. */
export function pairKey(a: PlayerId, b: PlayerId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
