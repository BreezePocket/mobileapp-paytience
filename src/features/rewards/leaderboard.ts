/** Season leaderboard. Points only: never volume, deal size or addresses. */
export type LeaderRow = { name: string; emoji: string; points: number; you?: boolean; rank: number };

/** Other players come from a rewards service that does not exist yet, so the list holds only you. */
const OTHERS: { name: string; emoji: string; points: number }[] = [];

/** Full ranked list with "you" inserted by points (ties go to the other player). */
export function rankWithYou(points: number): LeaderRow[] {
  const rows = [...OTHERS.map((r) => ({ ...r, you: false })), { name: 'You', emoji: '🌱', points, you: true }];
  rows.sort((a, b) => b.points - a.points || (a.you ? 1 : b.you ? -1 : 0));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
