/**
 * Fixed top navigation bar based on the Figma "Top Bar" component (node 72:107).
 *
 * Currently static text ("Ace's Poker Room", "Role: Admin").
 * When authentication is added, this is the obvious place to show:
 * - logged-in user name
 * - role
 * - navigation / logout
 */
export default function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 bg-[#111925]">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-6">
        <div
          className="h-8 w-[120px] shrink-0 bg-[#d9d9d9]"
          aria-label="Logo"
        />

        <h1 className="text-center text-2xl font-semibold leading-8 tracking-tight text-[#f5f7fa]">
          Ace&apos;s Poker Room
        </h1>

        <p className="shrink-0 text-base font-normal leading-6 text-[#c7d1dc]">
          Role: Admin
        </p>
      </div>
    </header>
  );
}
