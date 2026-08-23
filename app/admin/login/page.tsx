"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setError(
        data.error === "not_configured"
          ? "ADMIN_PASSWORD isn't set on this deployment. Add it in Vercel → Settings → Environment Variables, then redeploy."
          : "Wrong password."
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card w-full max-w-sm rounded-chunk p-7 shadow-chunk">
      <h1 className="font-display text-2xl font-extrabold">
        <span aria-hidden className="mr-2">
          🔐
        </span>
        Gauntlet HQ
      </h1>
      <p className="muted mt-2 text-sm">Password required. This is where the evidence lives.</p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        aria-label="Admin password"
        autoFocus
        autoComplete="current-password"
        className="field mt-5"
      />

      {error && <p className="mt-3 text-sm font-medium text-accent-600">{error}</p>}

      <button type="submit" disabled={busy || !password} className="btn-primary mt-5 w-full">
        {busy ? "Checking…" : "Let me in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="screen grid place-items-center px-5 py-12">
      <Suspense fallback={<p className="muted text-sm">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
