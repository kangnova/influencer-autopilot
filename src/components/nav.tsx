"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/niches", label: "Niches" },
  { href: "/personas", label: "Personas" },
  { href: "/courses", label: "Courses" },
  { href: "/content-plans", label: "Content plans" },
  { href: "/media", label: "Media" },
  { href: "/social-accounts", label: "Accounts" },
  { href: "/posts", label: "Posts" },
  { href: "/metrics", label: "Metrics" },
  { href: "/jobs", label: "Jobs" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1">
      {links.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
