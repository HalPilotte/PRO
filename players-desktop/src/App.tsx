import "./App.css";
import PlayerRegistrationForm from "./components/PlayerRegistrationForm";
import Modal from "./components/Modal";
import TopBar from "./components/TopBar";
import SideNav from "./components/SideNav";
import { useState } from "react";

function App() {
  const [, setActivePane] = useState<string>("players");
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  return (
    <div className="pro-shell">
      <TopBar />
      <SideNav
        onSelect={(id) => {
          setActivePane(id);
          if (id === "players") {
            setShowPlayerModal(true);
          }
        }}
      />

      <main className="workspace" aria-label="Workspace" />

      <Modal
        open={showPlayerModal}
        title="Register a new player"
        onClose={() => setShowPlayerModal(false)}
      >
        <PlayerRegistrationForm />
      </Modal>
    </div>
  );
}

export default App;
