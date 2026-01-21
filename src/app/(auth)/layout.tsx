export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Logo/Brand */}
      <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
        <h1 className="text-2xl font-bold">
          <span className="text-primary">Game</span> Gauge
        </h1>
      </div>

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}
