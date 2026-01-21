export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to Game Gauge
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Track, rate, and review your favorite video games
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/search"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Search Games
          </a>
          <a
            href="/login"
            className="text-sm font-semibold leading-6"
          >
            Sign in <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          🚀 Next.js 14 • TypeScript • Tailwind CSS • Shadcn/ui
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Run <code className="bg-muted px-2 py-1 rounded">npx shadcn-ui@latest add button</code> to start adding components
        </p>
      </div>
    </div>
  );
}
