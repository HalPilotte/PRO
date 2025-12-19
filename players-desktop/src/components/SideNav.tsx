import type { ReactNode } from "react";

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6l6 6-6 6" stroke="#c7d1dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AddPlayerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <path d="M19 8v6M16 11h6" stroke="#111925" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const navItems: { id: string; label: string; icon: ReactNode; onClick?: () => void }[] = [
  { id: "players", label: "Players", icon: <AddPlayerIcon className="icon" /> },
  { id: "tables", label: "Tables", icon: <ChevronRightIcon className="icon" /> },
  { id: "waitlist", label: "Waitlist", icon: <ChevronRightIcon className="icon" /> },
  { id: "cage", label: "Cage", icon: <ChevronRightIcon className="icon" /> },
  { id: "reports", label: "Reports", icon: <ChevronRightIcon className="icon" /> },
];

export default function SideNav({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <aside aria-label="Primary navigation" className="sidenav">
      <div className="sidenav-inner">
        <p className="sidenav-title">Navigation</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            className="nav-button"
            onClick={() => {
              item.onClick?.();
              onSelect(item.id);
            }}
          >
            <div className="nav-icon">{item.icon}</div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
