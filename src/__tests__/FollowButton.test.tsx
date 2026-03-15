import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FollowButton from "@/components/social/FollowButton";

const mockUsePermissions = vi.fn();
const mockUseFollow = vi.fn();

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@/hooks/useFollow", () => ({
  useFollow: (...args: unknown[]) => mockUseFollow(...args),
}));

describe("FollowButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermissions.mockReturnValue({
      canFollow: true,
      userId: "viewer-1",
    });
    mockUseFollow.mockReturnValue({
      isFollowing: false,
      toggle: vi.fn(),
      loading: false,
    });
  });

  it("hides the button for the current user's own profile", () => {
    render(<FollowButton targetId="viewer-1" />);

    expect(screen.queryByRole("button", { name: "팔로우" })).not.toBeInTheDocument();
  });

  it("renders a follow action for other players", () => {
    render(<FollowButton targetId="player-2" />);

    expect(screen.getByRole("button", { name: "팔로우" })).toBeInTheDocument();
  });

  it("renders an unfollow action when already following", () => {
    mockUseFollow.mockReturnValue({
      isFollowing: true,
      toggle: vi.fn(),
      loading: false,
    });

    render(<FollowButton targetId="player-2" initialFollowing />);

    expect(screen.getByRole("button", { name: "팔로잉 취소" })).toBeInTheDocument();
  });
});
