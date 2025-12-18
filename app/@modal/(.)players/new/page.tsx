import PlayerRegistrationWindow from "@/app/components/PlayerRegistrationWindow";

/**
 * Intercepting route that shows the registration form as a modal window.
 *
 * - When navigating to `/players/new` from within the app, this route is rendered
 *   into the `@modal` slot while the underlying page remains visible.
 * - On a direct refresh of `/players/new`, the non-modal page route will render instead.
 */
export default function PlayersNewModal() {
  return <PlayerRegistrationWindow />;
}

