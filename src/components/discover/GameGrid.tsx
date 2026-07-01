import React from 'react';

interface GameGridProps {
  children?: React.ReactNode;
  skeletonCount?: number;
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="aspect-[3/4] rounded-lg bg-card border border-brand-purple/10 animate-pulse motion-reduce:animate-none" />
  );
}

export function GameGrid({ children, skeletonCount = 12, isLoading = false }: GameGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {children}
    </div>
  );
}
