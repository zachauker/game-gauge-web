import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CuratedRows } from '../CuratedRows';
import type { DBGame } from '@/lib/search';
import type { IGDBGame } from '@/lib/api';

afterEach(cleanup);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/image', () => ({
  default: (props: { src: string; alt: string }) => <img src={props.src} alt={props.alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockDBGame: DBGame = {
  id: '1',
  title: 'Test Game',
  slug: 'test-game',
  genres: [],
  platforms: [],
};

const mockIGDBGame: IGDBGame = {
  id: 9999,
  name: 'New Game',
};

const defaultProps = {
  topRated: [mockDBGame],
  trending: [{ ...mockDBGame, id: '2', title: 'Trending Game', slug: 'trending-game' }],
  newReleases: [mockIGDBGame],
  isLoading: false,
  onSeeAllTopRated: vi.fn(),
  onSeeAllTrending: vi.fn(),
  onSeeAllNew: vi.fn(),
};

describe('CuratedRows', () => {
  it('renders all three section headers', () => {
    render(<CuratedRows {...defaultProps} />);
    expect(screen.getByText(/Top Rated on Game Gauge/i)).toBeDefined();
    expect(screen.getByText(/Trending This Week/i)).toBeDefined();
    expect(screen.getByText(/New Releases/i)).toBeDefined();
  });

  it('renders game cards for each section', () => {
    render(<CuratedRows {...defaultProps} />);
    expect(screen.getByText('Test Game')).toBeDefined();
    expect(screen.getByText('Trending Game')).toBeDefined();
    expect(screen.getByText('New Game')).toBeDefined();
  });

  it('calls onSeeAllTopRated when See all is clicked for Top Rated', () => {
    const onSeeAllTopRated = vi.fn();
    render(<CuratedRows {...defaultProps} onSeeAllTopRated={onSeeAllTopRated} />);
    const buttons = screen.getAllByText('See all →');
    fireEvent.click(buttons[0]); // first "See all →" is Top Rated
    expect(onSeeAllTopRated).toHaveBeenCalled();
  });

  it('shows skeleton loading state when isLoading is true', () => {
    const { container } = render(<CuratedRows {...defaultProps} isLoading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
