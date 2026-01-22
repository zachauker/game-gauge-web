"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Lock, Globe, Loader2, Trash2, Edit } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api, getErrorMessage } from "@/lib/api";
import Link from "next/link";
import { CreateListDialog } from "@/components/lists/create-list-dialog";

interface GameList {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
}

export default function ListsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [lists, setLists] = useState<GameList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadLists();
    }
  }, [isAuthenticated, user]);

  const loadLists = async () => {
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await api.get(`/lists/user/${user.id}`);
      setLists(response.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (data: { name: string; description?: string; isPublic: boolean }) => {
    try {
      await api.post("/lists", data);
      await loadLists();
      setShowCreateDialog(false);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this list?")) return;

    try {
      await api.delete(`/lists/${listId}`);
      await loadLists();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">My Lists</h1>
            <p className="text-muted-foreground mb-6">
              Sign in to create and manage your game lists
            </p>
            <Link href="/login">
              <Button size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Lists</h1>
            <p className="text-muted-foreground">
              Create and organize your game collections
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create List
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && lists.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first list to start organizing your games
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First List
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lists Grid */}
        {!isLoading && lists.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">
                        <Link
                          href={`/lists/${list.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {list.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {list.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{list._count?.items || 0} games</span>
                      <span>•</span>
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/lists/${list.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View List
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteList(list.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create List Dialog */}
        <CreateListDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateList}
        />
      </div>
    </MainLayout>
  );
}
