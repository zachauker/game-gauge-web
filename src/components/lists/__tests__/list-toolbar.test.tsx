import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ListToolbar } from "../list-toolbar";
import { DEFAULT_LIST_FILTER_STATE } from "@/lib/list-sort-filter";

afterEach(cleanup);

const defaultProps = {
  search: "",
  onSearchChange: vi.fn(),
  sortBy: "custom" as const,
  sortDir: "asc" as const,
  onSortChange: vi.fn(),
  availableGenres: ["Action", "RPG"],
  availablePlatforms: ["PC", "Switch"],
  selectedGenres: DEFAULT_LIST_FILTER_STATE.genres,
  onGenresChange: vi.fn(),
  selectedPlatforms: DEFAULT_LIST_FILTER_STATE.platforms,
  onPlatformsChange: vi.fn(),
  showStatusFilter: true,
  status: DEFAULT_LIST_FILTER_STATE.status,
  onStatusChange: vi.fn(),
};

describe("ListToolbar", () => {
  it("calls onSearchChange as the user types", () => {
    const onSearchChange = vi.fn();
    render(<ListToolbar {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText("Search this list..."), {
      target: { value: "hades" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("hades");
  });

  it("does not show a direction toggle when sort is custom", () => {
    render(<ListToolbar {...defaultProps} sortBy="custom" />);
    expect(screen.queryByLabelText(/Sort (ascending|descending)/)).toBeNull();
  });

  it("shows a direction toggle when a non-custom sort is active", () => {
    render(<ListToolbar {...defaultProps} sortBy="title" sortDir="asc" />);
    expect(screen.getByLabelText("Sort descending")).toBeDefined();
  });

  it("toggles sort direction when the direction button is clicked", () => {
    const onSortChange = vi.fn();
    render(<ListToolbar {...defaultProps} sortBy="title" sortDir="asc" onSortChange={onSortChange} />);
    fireEvent.click(screen.getByLabelText("Sort descending"));
    expect(onSortChange).toHaveBeenCalledWith("title", "desc");
  });

  it("toggles a genre on and off via onGenresChange", () => {
    const onGenresChange = vi.fn();
    render(<ListToolbar {...defaultProps} onGenresChange={onGenresChange} />);
    fireEvent.click(screen.getByRole("button", { name: /^Genre/ }));
    fireEvent.click(screen.getByText("Action"));
    expect(onGenresChange).toHaveBeenCalledWith(["Action"]);
  });

  it("hides the status filter when showStatusFilter is false", () => {
    render(<ListToolbar {...defaultProps} showStatusFilter={false} />);
    expect(screen.queryByText("All statuses")).toBeNull();
  });
});
