import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameGrid } from '../GameGrid';

describe('GameGrid', () => {
  it('renders children when not loading', () => {
    render(
      <GameGrid>
        <div data-testid="child">Game</div>
      </GameGrid>
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('renders skeleton cards when loading', () => {
    const { container } = render(<GameGrid isLoading skeletonCount={6} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(6);
  });

  it('renders default 12 skeletons when loading without skeletonCount', () => {
    const { container } = render(<GameGrid isLoading />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(12);
  });
});
