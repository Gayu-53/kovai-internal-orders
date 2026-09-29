"use client";

import { useState } from "react";

type OwnerAccessPromptProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function OwnerAccessPrompt({
  onSuccess,
  onCancel,
}: OwnerAccessPromptProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password) {
      setError("Please enter the owner PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/owner-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError("Incorrect owner PIN.");
        setPassword("");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-ink">
          Owner Access Required
        </h2>

        <p className="mt-2 text-sm text-ink-muted">
          Enter the owner PIN to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={password}
            onChange={(e) =>
              setPassword(e.target.value.replace(/\D/g, ""))
            }
            placeholder="Enter 4-digit PIN"
            className="w-full rounded-xl border border-border px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-ink"
            autoFocus
          />

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}