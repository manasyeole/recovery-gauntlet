import Link from "next/link";
import AdminToolbar from "@/components/AdminToolbar";
import { hasDatabase, prisma } from "@/lib/prisma";
import { TOTAL_STEPS, labelFor } from "@/lib/steps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Gauntlet HQ" };

interface SessionRow {
  id: string;
  visitorName: string | null;
  completed: boolean;
  createdAt: Date;
  answers: { stepNumber: number; question: string; answer: string }[];
}

function fmt(d: Date) {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Numeric answer for a step across sessions, for the little stats strip. */
function numbersFor(sessions: SessionRow[], step: number): number[] {
  return sessions
    .map((s) => Number(s.answers.find((a) => a.stepNumber === step)?.answer))
    .filter((n) => Number.isFinite(n));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; since?: string }>;
}) {
  const { q = "", since = "" } = await searchParams;

  if (!hasDatabase) {
    return (
      <Shell q={q} since={since}>
        <div className="card rounded-chunk p-6">
          <h2 className="font-display text-lg font-bold">No database connected</h2>
          <p className="muted mt-2 text-sm leading-relaxed">
            Set <code className="font-mono text-xs">DATABASE_URL</code> and run{" "}
            <code className="font-mono text-xs">npx prisma db push</code>. On Vercel, add Postgres
            from the Storage tab — it injects the variable for you — then redeploy.
          </p>
        </div>
      </Shell>
    );
  }

  const sinceDate = since ? new Date(`${since}T00:00:00`) : null;
  const validSince = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

  let sessions: SessionRow[] = [];
  let dbError = "";
  try {
    sessions = await prisma.session.findMany({
      where: {
        ...(q ? { visitorName: { contains: q, mode: "insensitive" as const } } : {}),
        ...(validSince ? { createdAt: { gte: validSince } } : {}),
      },
      include: { answers: { orderBy: { stepNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Unknown database error";
  }

  const finished = sessions.filter((s) => s.completed).length;
  const drama = numbersFor(sessions, 2);
  const pillows = numbersFor(sessions, 9);
  const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—");

  return (
    <Shell q={q} since={since}>
      {dbError && (
        <div className="card mb-5 rounded-chunk border-clay-300 p-5">
          <p className="text-sm font-semibold text-clay-600">Database error</p>
          <p className="muted mt-1 break-words font-mono text-xs">{dbError}</p>
          <p className="muted mt-2 text-xs">
            Usually means the tables don&apos;t exist yet — run{" "}
            <code className="font-mono">npx prisma db push</code> against this database.
          </p>
        </div>
      )}

      <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Runs" value={String(sessions.length)} />
        <Stat label="Finished all 20" value={String(finished)} />
        <Stat label="Avg drama level" value={avg(drama)} hint="Step 2, out of 10" />
        <Stat label="Avg pillows" value={avg(pillows)} hint="Step 9" />
      </dl>

      {sessions.length === 0 ? (
        <div className="card rounded-chunk p-6">
          <h2 className="font-display text-lg font-bold">Nothing here yet</h2>
          <p className="muted mt-2 text-sm">
            {q || since ? "No runs match that filter." : "Send them the link and wait."}{" "}
            <Link href="/" className="underline hover:text-clay-600">
              Open the site
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <details key={s.id} className="card group rounded-chunk px-5 py-4" open={sessions.length === 1}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 list-none">
                <span className="font-display text-lg font-bold">
                  {s.visitorName || "Anonymous coward"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    s.completed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {s.answers.length}/{TOTAL_STEPS}
                  {s.completed ? " · done" : " · in progress"}
                </span>
                <span className="muted ml-auto text-xs tabular-nums">{fmt(s.createdAt)}</span>
                <span className="muted text-xs group-open:hidden">▾</span>
              </summary>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[540px] border-collapse text-sm">
                  <thead>
                    <tr className="muted text-left text-xs uppercase tracking-wide">
                      <th className="w-10 pb-2 font-semibold">#</th>
                      <th className="w-52 pb-2 font-semibold">Question</th>
                      <th className="pb-2 font-semibold">Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.answers.map((a) => (
                      <tr key={a.stepNumber} className="border-t" style={{ borderColor: "var(--line)" }}>
                        <td className="py-2 align-top tabular-nums opacity-50">{a.stepNumber}</td>
                        <td className="py-2 pr-4 align-top">
                          <span className="font-medium">{labelFor(a.stepNumber)}</span>
                          <span className="muted block text-xs leading-snug">{a.question}</span>
                        </td>
                        <td className="py-2 align-top font-medium">{a.answer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="muted mt-3 font-mono text-[11px]">session {s.id}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card rounded-2xl p-4">
      <dt className="muted text-[11px] font-bold uppercase tracking-wider">{label}</dt>
      <dd className="font-display mt-1 text-2xl font-extrabold tabular-nums">{value}</dd>
      {hint && <p className="muted mt-0.5 text-[11px]">{hint}</p>}
    </div>
  );
}

function Shell({
  q,
  since,
  children,
}: {
  q: string;
  since: string;
  children: React.ReactNode;
}) {
  return (
    <main className="screen px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">
              <span aria-hidden className="mr-2">
                🗂️
              </span>
              Gauntlet HQ
            </h1>
            <p className="muted mt-1 text-sm">Every answer, newest first.</p>
          </div>
          <AdminToolbar q={q} since={since} />
        </header>
        {children}
      </div>
    </main>
  );
}
