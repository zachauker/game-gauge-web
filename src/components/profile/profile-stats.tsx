import Link from "next/link";

interface ProfileStatsProps {
  username: string;
  totalRatings: number;
  totalReviews: number;
  averageRating: number;
  publicListsCount: number;
  followerCount: number;
  followingCount: number;
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center px-4 first:pl-0 last:pr-0 border-r border-brand-purple/15 last:border-0">
      <p className="text-[18px] font-medium text-foreground leading-tight tabular-nums">
        {value}
      </p>
      <p className="text-[11px] text-foreground/35 uppercase tracking-[0.06em] mt-0.5">
        {label}
      </p>
    </div>
  );
}

function LinkStatPill({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="text-center px-4 first:pl-0 last:pr-0 border-r border-brand-purple/15 last:border-0 hover:bg-brand-purple/5 rounded transition-colors"
    >
      <p className="text-[18px] font-medium text-brand-purple/80 leading-tight tabular-nums">
        {value}
      </p>
      <p className="text-[11px] text-foreground/35 uppercase tracking-[0.06em] mt-0.5">
        {label}
      </p>
    </Link>
  );
}

export function ProfileStats({
  username,
  totalRatings,
  totalReviews,
  averageRating,
  publicListsCount,
  followerCount,
  followingCount,
}: ProfileStatsProps) {
  return (
    <div className="flex items-center gap-0 mb-8 p-4 bg-card border border-brand-purple/15 rounded-lg">
      <StatPill value={totalRatings} label="Ratings" />
      <StatPill value={totalReviews} label="Reviews" />
      <StatPill
        value={averageRating > 0 ? averageRating.toFixed(1) : "—"}
        label="Avg score"
      />
      <StatPill value={publicListsCount} label="Lists" />
      <LinkStatPill
        value={followerCount}
        label="Followers"
        href={`/users/${username}/followers`}
      />
      <LinkStatPill
        value={followingCount}
        label="Following"
        href={`/users/${username}/following`}
      />
    </div>
  );
}
