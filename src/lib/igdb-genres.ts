export const IGDB_GENRE_IDS: Record<string, number> = {
  'Point-and-click': 2,
  Fighting: 4,
  Shooter: 5,
  Music: 7,
  Platform: 8,
  Puzzle: 9,
  Racing: 10,
  'Real Time Strategy (RTS)': 11,
  'Role-playing (RPG)': 12,
  Simulator: 13,
  Sport: 14,
  Strategy: 15,
  'Turn-based strategy (TBS)': 16,
  Tactical: 24,
  "Hack and slash/Beat 'em up": 25,
  'Quiz/Trivia': 26,
  'Card & Board Game': 28,
  MOBA: 29,
  Adventure: 31,
  Indie: 32,
  Arcade: 33,
  'Visual Novel': 34,
};

export function getIgdbGenreId(genreName: string): number | undefined {
  return IGDB_GENRE_IDS[genreName];
}
