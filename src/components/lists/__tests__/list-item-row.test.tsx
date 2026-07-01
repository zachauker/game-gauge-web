import { describe, it, expect, vi, afterEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { ListItemRow } from "../list-item-row";
import type { GameListItem } from "@/lib/api";

afterEach(cleanup);

const item: GameListItem = {
  id: "item-1",
  listId: "list-1",
  gameId: "game-1",
  order: 0,
  progressPct: 40,
  createdAt: "2026-01-01T00:00:00.000Z",
  game: { id: "game-1", title: "Hollow Knight", slug: "hollow-knight" },
};

function renderRow(overrides: Partial<ComponentProps<typeof ListItemRow>> = {}) {
  return render(
    <DndContext>
      <SortableContext items={[item.id]}>
        <ListItemRow
          item={item}
          isOwner={true}
          isPlayingList={true}
          dragEnabled={true}
          syncingAchievements={false}
          hasSteam={false}
          onRemove={vi.fn()}
          onProgressEditClick={vi.fn()}
          onSyncAchievements={vi.fn()}
          onCompleteClick={vi.fn()}
          {...overrides}
        />
      </SortableContext>
    </DndContext>
  );
}

describe("ListItemRow", () => {
  it("shows a drag handle when dragEnabled is true", () => {
    renderRow({ dragEnabled: true });
    expect(screen.getByLabelText("Drag to reorder")).toBeDefined();
  });

  it("hides the drag handle when dragEnabled is false", () => {
    renderRow({ dragEnabled: false });
    expect(screen.queryByLabelText("Drag to reorder")).toBeNull();
  });

  it("calls onRemove with the game id when the remove button is clicked", () => {
    const onRemove = vi.fn();
    renderRow({ onRemove });
    fireEvent.click(screen.getByLabelText("Remove game"));
    expect(onRemove).toHaveBeenCalledWith("game-1");
  });

  it("hides owner-only controls when isOwner is false", () => {
    renderRow({ isOwner: false, dragEnabled: false });
    expect(screen.queryByLabelText("Remove game")).toBeNull();
  });
});
