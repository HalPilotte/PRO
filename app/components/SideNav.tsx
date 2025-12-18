/**
 * Fixed vertical navigation bar based on the Figma "Vertical Nav Bar" component (node 92:773).
 *
 * Layout intent:
 * - Fixed position on the left side of the viewport
 * - Aligned below the fixed TopBar
 * - Used as persistent navigation (no page reload required to show/hide it)
 *
 * This is currently a static UI shell. When routing/navigation is added, replace
 * the placeholder buttons with Next.js <Link> components (or a router-aware nav).
 */
import type { ReactNode } from "react";
import Link from "next/link";

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
};

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9 6l6 6-6 6"
      stroke="#c7d1dc"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AddPlayerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      stroke="#111925"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      stroke="#111925"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 8v6M16 11h6"
      stroke="#111925"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const navItems: NavItem[] = [
  {
    id: "add-player",
    label: "Add Player",
    icon: <AddPlayerIcon className="h-6 w-6" />,
  },
  { id: "nav-2", label: "Nav Label", icon: <ChevronRightIcon className="h-6 w-6" /> },
  { id: "nav-3", label: "Nav Label", icon: <ChevronRightIcon className="h-6 w-6" /> },
  { id: "nav-4", label: "Nav Label", icon: <ChevronRightIcon className="h-6 w-6" /> },
  { id: "nav-5", label: "Nav Label", icon: <ChevronRightIcon className="h-6 w-6" /> },
];

export default function SideNav() {
  return (
    <aside
      aria-label="Primary navigation"
      className="fixed left-[2px] top-[calc(64px+2px)] z-40 hidden h-[calc(100dvh-(64px+4px))] w-[88px] rounded-[8px] border border-solid border-[#1e2a3a] bg-[#111925] px-3 py-4 sm:block"
    >
      <div className="flex h-full flex-col items-center gap-3">
        <p className="text-xs font-normal leading-4 text-white">Navigation</p>

        <Link
          href="/players/new"
          scroll={false}
          className="flex h-[72px] w-full flex-col items-center justify-center gap-1.5 rounded-[8px] p-2 text-left outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-indigo-400/50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
            {navItems[0].icon}
          </div>
          <span className="text-xs font-normal leading-4 text-[#f5f7fa]">
            {navItems[0].label}
          </span>
        </Link>

        {navItems.slice(1).map((item) => (
          <div
            key={item.id}
            className="flex h-[72px] w-full flex-col items-center justify-center gap-1.5 rounded-[8px] p-2 opacity-90"
            aria-hidden="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
              {item.icon}
            </div>
            <span className="text-xs font-normal leading-4 text-[#f5f7fa]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
