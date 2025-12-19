import { useId, useState } from "react";
import type { FormEvent } from "react";
import { API_BASE } from "../env";

type SubmissionState =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function PlayerRegistrationForm() {
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
      const response = await fetch(`${API_BASE}/api/players`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to register player.");
      }

      setStatus({
        type: "success",
        message: `Player registered with ID #${payload.playerId}.`,
      });

      form.reset();
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
      className="form-card"
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      autoComplete="off"
    >
      <div className="grid-2">
        <div className="field">
          <label htmlFor={`${formId}-first`}>First name</label>
          <input
            id={`${formId}-first`}
            type="text"
            name="player_first_name"
            required
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor={`${formId}-last`}>Last name</label>
          <input
            id={`${formId}-last`}
            type="text"
            name="player_last_name"
            required
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor={`${formId}-dob`}>Date of birth (MM-DD-YYYY)</label>
          <input
            id={`${formId}-dob`}
            type="text"
            name="player_dob"
            required
            inputMode="numeric"
            autoComplete="bday"
            placeholder="MM-DD-YYYY"
            pattern="\d{1,2}[-/]\d{1,2}[-/]\d{4}"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${formId}-address1`}>Address line 1</label>
        <input
          id={`${formId}-address1`}
          type="text"
          name="player_address_1"
          autoComplete="off"
          placeholder="123 Main Street"
        />
      </div>
      <div className="field">
        <label htmlFor={`${formId}-address2`}>Address line 2</label>
        <input
          id={`${formId}-address2`}
          type="text"
          name="player_address_2"
          autoComplete="off"
          placeholder="Apt, suite, etc."
        />
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor={`${formId}-city`}>City</label>
          <input id={`${formId}-city`} type="text" name="player_city" autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor={`${formId}-state`}>State</label>
          <input
            id={`${formId}-state`}
            type="text"
            name="player_state"
            maxLength={2}
            placeholder="WA"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor={`${formId}-zip`}>ZIP</label>
          <input
            id={`${formId}-zip`}
            type="text"
            name="player_zip"
            inputMode="numeric"
            pattern="[0-9]{5}(-[0-9]{4})?"
            placeholder="98052"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor={`${formId}-email`}>Email</label>
          <input
            id={`${formId}-email`}
            type="email"
            name="player_email"
            required
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor={`${formId}-phone`}>Phone</label>
          <input
            id={`${formId}-phone`}
            type="text"
            name="player_phone"
            inputMode="tel"
            placeholder="(555) 123-4567"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${formId}-picture`}>Player photo (optional)</label>
        <input
          id={`${formId}-picture`}
          className="file-input"
          type="file"
          name="player_picture"
          accept="image/*"
        />
      </div>

      <button type="submit" className="button" disabled={submitting}>
        {submitting ? "Registering..." : "Register Player"}
      </button>

      {status.type !== "idle" && (
        <div className={`status ${status.type === "success" ? "success" : "error"}`}>
          {status.message}
        </div>
      )}
    </form>
  );
}
