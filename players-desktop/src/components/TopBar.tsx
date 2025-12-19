export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="logo" aria-label="Logo" />
        <div className="title-block">
          <p className="app-name">PRO Command Center</p>
          <h1 className="room-name">Ace&apos;s Poker</h1>
        </div>
        <p className="role">Role: Admin</p>
      </div>
    </header>
  );
}
