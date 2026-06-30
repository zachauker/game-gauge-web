"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { RatingsTab } from "@/components/profile/ratings-tab";
import { ReviewsTab } from "@/components/profile/reviews-tab";
import { ActivityTab } from "@/components/profile/activity-tab";
import { ListsTab } from "@/components/profile/lists-tab";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Star, BookOpen, Activity, List, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Tab = "ratings" | "reviews" | "activity" | "lists";

interface UserProfile {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  avatar: string | null;
  createdAt: string;
}

interface UserStats {
  totalRatings: number;
  totalReviews: number;
  totalLists: number;
  averageRating: number;
  publicListsCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
        active
          ? "border-brand-amber text-foreground/90 font-medium"
          : "border-transparent text-foreground/40 hover:text-foreground/70"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("ratings");

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    setIsLoading(true);
    setError("");
    Promise.allSettled([
      api.get(`/users/${username}`),
      api.get(`/users/${username}/stats`),
    ]).then(([profileResult, statsResult]) => {
      if (profileResult.status === "rejected") {
        const err = profileResult.reason as { response?: { data?: { error?: { message?: string } } } };
        const msg = err?.response?.data?.error?.message ?? "Failed to load profile";
        setError(msg);
        toast.error("Failed to load profile");
      } else {
        setProfile(profileResult.value.data.data);
      }
      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value.data.data);
      }
    }).finally(() => setIsLoading(false));
  }, [username]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-7 w-7 animate-spin text-foreground/20" />
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-[14px] text-foreground/40 mb-4">
            {error || "This user couldn't be found."}
          </p>
          <button
            onClick={() => router.back()}
            className="text-[13px] text-brand-purple hover:text-foreground/70 transition-colors"
          >
            ← Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors mb-8"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isFollowing={stats?.isFollowing ?? false}
          followerCount={stats?.followerCount ?? 0}
        />

        {stats && (
          <ProfileStats
            username={username}
            totalRatings={stats.totalRatings}
            totalReviews={stats.totalReviews}
            averageRating={stats.averageRating}
            publicListsCount={stats.publicListsCount}
            followerCount={stats.followerCount}
            followingCount={stats.followingCount}
          />
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-brand-purple/15 mb-6">
          <TabButton
            active={activeTab === "ratings"}
            onClick={() => setActiveTab("ratings")}
            icon={<Star className="h-3.5 w-3.5" />}
            label="Ratings"
          />
          <TabButton
            active={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label="Reviews"
          />
          <TabButton
            active={activeTab === "activity"}
            onClick={() => setActiveTab("activity")}
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Activity"
          />
          <TabButton
            active={activeTab === "lists"}
            onClick={() => setActiveTab("lists")}
            icon={<List className="h-3.5 w-3.5" />}
            label="Lists"
          />
        </div>

        {activeTab === "ratings" && <RatingsTab username={username} />}
        {activeTab === "reviews" && <ReviewsTab username={username} />}
        {activeTab === "activity" && <ActivityTab username={username} />}
        {activeTab === "lists" && <ListsTab userId={profile.id} />}
      </div>
    </MainLayout>
  );
}
