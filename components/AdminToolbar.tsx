"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Name/date filters, JSON export, and logout for /admin. */
export default function AdminToolbar({ q, since }: { q: string; since: string }) {
  const router = useRouter();
  const [name, setName] = useState(q);
  const [from, setFrom] = useState(since);

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());
    if (from) params.set("since", from);
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  };

  const clear = () => {
    setName("");
    setFrom("");
    router.push("/admin");
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  const exportHref = (() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (since) params.set("since", since);
    const qs = params.toString();
    return `/api/admin/sessions${qs ? `?${qs}` : ""}`;
  })();

  return (
    <form onSubmit={apply} className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Filter by name"
        aria-label="Filter by name"
        className="field w-40 !py-2 !text-sm sm:w-48"
      />
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        aria-label="Only runs since"
        className="field w-auto !py-2 !text-sm"
      />
      <button type="submit" className="btn-primary !px-4 !py-2 !text-sm">
        Filter
      </button>
      {(q || since) && (
        <button type="button" onClick={clear} className="btn-ghost muted !px-3 !py-2 !text-sm">
          Clear
        </button>
      )}
      <a href={exportHref} className="btn-ghost card !px-3 !py-2 !text-sm" download>
        JSON
      </a>
      <button type="button" onClick={logout} className="btn-ghost muted !px-3 !py-2 !text-sm">
        Log out
      </button>
    </form>
  );
}
