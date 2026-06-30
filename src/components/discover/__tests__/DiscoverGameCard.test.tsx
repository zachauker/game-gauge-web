import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { DiscoverGameCard } from '../DiscoverGameCard';
import type { DBGame, CommunityData } from '@/lib/search';
import type { IGDBGame } from '@/lib/api';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock Next.js Image to avoid SSR issues in tests
vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));

const mockDBGame: DBGame = {
  id: '1',
  title: 'Test Game',
  slug: 'test-game',
  genres: ['Action'],
  platforms: ['PC'],
  averageRating: 8.5,
  ratingCount: 20,
};

const mockIGDBGame: IGDBGame = {
  id: 1234,
  name: 'IGDB Game',
};

describe('DiscoverGameCard', () => {
  it('renders db mode card with link to game page', () => {
    render(<DiscoverGameCard mode="db" game={mockDBGame} />);
    expect(screen.getByText('Test Game')).toBeDefined();
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/games/test-game');
  });

  it('renders db mode card with community rating badge', () => {
    render(<DiscoverGameCard mode="db" game={mockDBGame} />);
    expect(screen.getByLabelText(/community rating: 8.5/i)).toBeDefined();
  });

  it('renders igdb mode card as button', () => {
    render(<DiscoverGameCard mode="igdb" game={mockIGDBGame} />);
    expect(screen.getByRole('button', { name: 'IGDB Game' })).toBeDefined();
  });

  it('renders igdb mode card with community rating when communityData provided', () => {
    const communityData: CommunityData = { igdbId: 1234, slug: 'test', averageRating: 9.1, ratingCount: 5 };
    render(<DiscoverGameCard mode="igdb" game={mockIGDBGame} communityData={communityData} />);
    expect(screen.getByLabelText(/community rating: 9.1/i)).toBeDefined();
  });

  it('does not show rating badge when ratingCount is 0', () => {
    const gameNoRatings = { ...mockDBGame, averageRating: 0, ratingCount: 0 };
    render(<DiscoverGameCard mode="db" game={gameNoRatings} />);
    expect(screen.queryByLabelText(/community rating/i)).toBeNull();
  });
});
