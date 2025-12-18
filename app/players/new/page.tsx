import { redirect } from "next/navigation";

/**
 * `/players/new` full-page route.
 *
 * We intentionally do not render the registration form here. The registration UI
 * is designed to open as an undocked modal window via the intercepting route in
 * `app/@modal/(.)players/new/page.tsx`.
 *
 * Redirecting keeps the app's "blank workspace" behavior on refresh and prevents
 * the form from appearing as the main screen when someone loads `/players/new`
 * directly (e.g. after a hard refresh).
 */
export default function PlayersNewPage() {
  redirect("/");
}
