'use client';

import { useRouter } from "next/navigation";
import PlayerRegistrationForm from "@/app/components/PlayerRegistrationForm";
import UndockedWindow from "@/app/components/UndockedWindow";

/**
 * PlayerRegistrationWindow
 *
 * A draggable "window" modal that overlays the current screen.
 *
 * Close behavior:
 * - Uses `router.back()` so the URL returns to the previous route and the
 *   intercepting modal segment is removed.
 *
 * Drag behavior:
 * - Implemented by `UndockedWindow` (shared draggable window wrapper)
 */
export default function PlayerRegistrationWindow() {
  const router = useRouter();

  const close = () => {
    // Prefer "back" so the intercepting modal segment is removed.
    // If the user landed directly on `/players/new` with no history entry,
    // fall back to the home route.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <UndockedWindow
      sectionLabel="Players"
      title="Register a new player"
      onClose={close}
    >
      <PlayerRegistrationForm />
    </UndockedWindow>
  );
}
