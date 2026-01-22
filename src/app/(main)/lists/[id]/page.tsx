"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Plus,
  Globe,
  Lock,
  Loader2,
  Trash2,
  Edit,
  Search,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api, getErrorMessage } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { AddGameToListDialog } from "@/components/lists/add-game-dialog";

interface GameList {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: ListItem[];
}

interface ListItem {
  id: string;
  listId: string;
  gameId: string;
  notes: string | null;
  order: number;
  addedAt: string;
  game: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    releaseDate: string | null;
    platforms: string[];
  };
}

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const listId = params.id as string;

  const [list, setList] = useState<GameList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddGameDialog, setShowAddGameDialog] = useState(false);

  useEffect(() => {
    if (listId) {
      loadList();
    }
  }, [listId]);

  const loadList = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get(`/lists/${listId}`);
      setList(response.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateList = async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    try {
      await api.put(`/lists/${listId}`, data);
      await loadList();
      setShowEditDialog(false);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleDeleteList = async () => {
    if (!confirm("Are you sure you want to delete this list?")) return;

    try {
      await api.delete(`/lists/${listId}`);
      router.push("/lists");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRemoveGame = async (gameId: string) => {
    if (!confirm("Remove this game from the list?")) return;

    try {
      await api.delete(`/lists/${listId}/games/${gameId}`);
      await loadList();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAddGame = async (gameId: string, notes?: string) => {
    try {
      await api.post(`/lists/${listId}/games`, { gameId, notes });
      await loadList();
      setShowAddGameDialog(false);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const isOwner = user && list && list.userId === user.id;
  const canView = list && (list.isPublic || isOwner);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !list || !canView) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">List Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "This list doesn't exist or is private."}
            </p>
            <Link href="/lists">
              <Button>Back to Lists</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{list.name}</h1>
              <Badge variant={list.isPublic ? "default" : "secondary"}>
                {list.isPublic ? (
                  <>
                    <Globe className="mr-1 h-3 w-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="mr-1 h-3 w-3" />
                    Private
                  </>
                )}
              </Badge>
            </div>
            {list.description && (
              <p className="text-muted-foreground">{list.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {list.items?.length || 0} games in this list
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDeleteList}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => setShowAddGameDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Game
              </Button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {(!list.items || list.items.length === 0) && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No games yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isOwner
                    ? "Add games to your list to get started"
                    : "This list is empty"}
                </p>
                {isOwner && (
                  <Button onClick={() => setShowAddGameDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Game
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Games Grid */}
        {list.items && list.items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {list.items.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-all">
                <CardContent className="p-3">
                  <Link href={`/games/${item.game.id}`}>
                    <div className="aspect-[3/4] relative mb-3 rounded-md overflow-hidden bg-muted">
                      {item.game.coverImage ? (
                        <Image
                          src={item.game.coverImage}
                          alt={item.game.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <Link href={`/games/${item.game.id}`}>
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 hover:text-primary transition-colors">
                      {item.game.title}
                    </h3>
                  </Link>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.notes}
                    </p>
                  )}

                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRemoveGame(item.game.id)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Remove
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit List Dialog */}
        {isOwner && list && (
          <CreateListDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSubmit={handleUpdateList}
            initialData={{
              name: list.name,
              description: list.description || undefined,
              isPublic: list.isPublic,
            }}
          />
        )}

        {/* Add Game Dialog */}
        {isOwner && (
          <AddGameToListDialog
            open={showAddGameDialog}
            onOpenChange={setShowAddGameDialog}
            onSubmit={handleAddGame}
          />
        )}
      </div>
    </MainLayout>
  );
}
