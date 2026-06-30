import { describe, it, expect } from 'vitest';
import { getIgdbGenreId, IGDB_GENRE_IDS } from '../igdb-genres';

describe('getIgdbGenreId', () => {
  it('returns the correct IGDB genre id for a known genre name', () => {
    expect(getIgdbGenreId('Role-playing (RPG)')).toBe(12);
    expect(getIgdbGenreId('Adventure')).toBe(31);
    expect(getIgdbGenreId('Shooter')).toBe(5);
  });

  it('returns undefined for an unknown genre name', () => {
    expect(getIgdbGenreId('NotARealGenre')).toBeUndefined();
  });

  it('contains entries for all expected genres', () => {
    expect(Object.keys(IGDB_GENRE_IDS).length).toBe(22);
  });
});
