import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FilterChips } from '../FilterChips';

afterEach(cleanup);

const defaultProps = {
  activeGenre: null,
  activePlatform: null,
  activeSort: 'top-rated' as const,
  searchMode: false,
  onGenreChange: vi.fn(),
  onPlatformChange: vi.fn(),
  onSortChange: vi.fn(),
};

describe('FilterChips', () => {
  it('renders Genre, Platform, and Sort chips', () => {
    render(<FilterChips {...defaultProps} />);
    expect(screen.getByText('Genre')).toBeDefined();
    expect(screen.getByText('Platform')).toBeDefined();
    expect(screen.getByText(/Sort:/)).toBeDefined();
  });

  it('disables Platform and Sort chips in search mode', () => {
    render(<FilterChips {...defaultProps} searchMode={true} />);
    // Disabled chips render as divs with cursor-not-allowed, not buttons
    const disabledPlatform = screen.getByTitle('Platform filter not available in search mode');
    expect(disabledPlatform).toBeDefined();
    const disabledSort = screen.getByTitle('Sort not available in search mode');
    expect(disabledSort).toBeDefined();
  });

  it('Genre chip remains active in search mode', () => {
    render(<FilterChips {...defaultProps} searchMode={true} />);
    // Genre chip should still be a button (not disabled)
    const genreButton = screen.getByRole('button', { name: /Genre/i });
    expect(genreButton).toBeDefined();
  });

  it('shows active genre as amber dismissible pill', () => {
    render(<FilterChips {...defaultProps} activeGenre="Action" />);
    expect(screen.getByText('Action')).toBeDefined();
    expect(screen.getByLabelText('Remove Genre filter')).toBeDefined();
  });

  it('calls onGenreChange(null) when genre pill X is clicked', () => {
    const onGenreChange = vi.fn();
    render(<FilterChips {...defaultProps} activeGenre="Action" onGenreChange={onGenreChange} />);
    fireEvent.click(screen.getByLabelText('Remove Genre filter'));
    expect(onGenreChange).toHaveBeenCalledWith(null);
  });

  it('opens genre dropdown and calls onGenreChange when option selected', () => {
    const onGenreChange = vi.fn();
    render(<FilterChips {...defaultProps} onGenreChange={onGenreChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Genre/i }));
    fireEvent.click(screen.getByText('Adventure'));
    expect(onGenreChange).toHaveBeenCalledWith('Adventure');
  });
});
