"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/niches", label: "Niches" },
  { href: "/personas", label: "Personas" },
  { href: "/media", label: "Media" },
  { href: "/jobs", label: "Jobs" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1">
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
