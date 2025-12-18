'use client';

import { FormEvent, useId, useState } from "react";

type SubmissionState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export type PlayerRegistrationFormProps = {
  /**
   * Optional callback invoked after a successful registration.
   * Useful for closing a modal window immediately after the insert.
   */
  onSuccess?: (playerId: number) => void;
};

/**
 * PlayerRegistrationForm
 *
 * - Posts multipart/form-data to `/api/players`
 * - The API inserts into Postgres and saves an optional image to `public/uploads`
 *
 * Autofill/autocomplete notes:
 * - Browsers can ignore `autocomplete="off"` and still show suggestions based on user settings.
 * - This component uses best-effort suppression for high-volume data entry.
 * - It cannot fully override user/browser policies.
 */
export default function PlayerRegistrationForm({
  onSuccess,
}: PlayerRegistrationFormProps) {
  const [status, setStatus] = useState<SubmissionState>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to register player.");
      }

      setStatus({
        type: "success",
        message: `Player registered with ID #${payload.playerId}.`,
      });

      form.reset();
      onSuccess?.(payload.playerId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="space-y-6"
      encType="multipart/form-data"
      autoComplete="off"
    >
      {/* Decoy fields: some browsers aggressively try to autofill "login-like" forms.
          These off-screen fields try to absorb that behavior so real fields stay clean. */}
      <input
        className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
        type="text"
        name="fake_username"
        autoComplete="username"
      />
      <input
        className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
        type="password"
        name="fake_password"
        autoComplete="new-password"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          First name
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_first_name"
            required
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          Last name
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_last_name"
            required
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </label>
      </div>

      <div className="space-y-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          Address line 1
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_address_1"
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            placeholder="123 Main Street"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          Address line 2
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_address_2"
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            placeholder="Apt, suite, etc."
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          City
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_city"
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          State
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_state"
            maxLength={2}
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            placeholder="WA"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          ZIP
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_zip"
            inputMode="numeric"
            pattern="[0-9]{5}(-[0-9]{4})?"
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            placeholder="98052"
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          Email
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_email"
            required
            inputMode="email"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
          Phone
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-500/30"
            type="text"
            name="player_phone"
            inputMode="tel"
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            placeholder="(555) 123-4567"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-white/80">
        Player photo (optional)
        <input
          className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-sm text-white outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-indigo-300/50"
          type="file"
          name="player_picture"
          accept="image/*"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-[0_12px_30px_rgba(79,70,229,0.35)] transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Registering..." : "Register Player"}
      </button>

      {status.type !== "idle" && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
            status.type === "success"
              ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20"
              : "bg-rose-500/10 text-rose-200 ring-rose-500/20"
          }`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}

