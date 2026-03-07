import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BottomTab from "@/components/layout/BottomTab";

const mockUsePathname = vi.fn<() => string>();
const mockPrefetch = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ prefetch: mockPrefetch }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    role: "player",
    verified: false,
    canUploadClip: true,
    canVoteMvp: true,
    canFollow: true,
    canScoutReview: false,
    canUseWatchlist: false,
    canDm: () => true,
  }),
}));

describe("BottomTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 5 tab labels", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomTab />);

    expect(screen.getByText("홈")).toBeInTheDocument();
    expect(screen.getByText("MVP")).toBeInTheDocument();
    expect(screen.getByText("DM")).toBeInTheDocument();
    expect(screen.getByText("프로필")).toBeInTheDocument();
    expect(screen.getByText("팀")).toBeInTheDocument();
  });

  it("highlights home tab when pathname is /", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomTab />);

    const homeLabel = screen.getByText("홈");
    expect(homeLabel.className).toContain("text-accent");
  });

  it("highlights profile tab when pathname starts with /profile", () => {
    mockUsePathname.mockReturnValue("/profile");
    render(<BottomTab />);

    const profileLabel = screen.getByText("프로필");
    expect(profileLabel.className).toContain("text-accent");

    const homeLabel = screen.getByText("홈");
    expect(homeLabel.className).toContain("text-text-3");
  });

  it("highlights dm tab when pathname starts with /dm", () => {
    mockUsePathname.mockReturnValue("/dm");
    render(<BottomTab />);

    const dmLabel = screen.getByText("DM");
    expect(dmLabel.className).toContain("text-accent");
  });

  it("highlights team tab when pathname starts with /team", () => {
    mockUsePathname.mockReturnValue("/team/abc");
    render(<BottomTab />);

    const teamLabel = screen.getByText("팀");
    expect(teamLabel.className).toContain("text-accent");
  });
});
