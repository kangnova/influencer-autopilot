"use client";

import { useEffect, useState } from "react";

type Job = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  doneAt: string | null;
  error: string | null;
  result: Record<string, unknown> | null;
};

function statusColor(status: string) {
  switch (status) {
    case "SUCCEEDED":
      return "bg-green-100 text-green-700";
    case "FAILED":
      return "bg-red-100 text-red-700";
    case "RUNNING":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch("/api/jobs");
      const json = await res.json().catch(() => null);
      if (active && json?.ok) {
        setJobs(json.data);
        setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 2000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  if (loading) return <p className="text-sm text-neutral-500">Loading jobs...</p>;

  return (
    <ul className="space-y-2">
      {jobs.length === 0 && (
        <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          No jobs yet. Trigger a pipeline step (e.g. run research on a niche).
        </p>
      )}
      {jobs.map((job) => (
        <li key={job.id} className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{job.type}</p>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor(job.status)}`}
            >
              {job.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            {new Date(job.createdAt).toLocaleString("id-ID", {
              hour12: false,
              timeZone: "Asia/Jakarta",
            })}{" "}
            · attempts {job.attempts}
          </p>
          {job.error && (
            <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600">{job.error}</p>
          )}
          {job.result && (
            <pre className="mt-2 overflow-x-auto rounded bg-neutral-50 p-2 text-xs text-neutral-700">
              {JSON.stringify(job.result, null, 2)}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
}
