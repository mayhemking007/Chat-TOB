"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const userLabel = session?.user?.name ?? session?.user?.email ?? null;

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
      <Link
        href="/"
        className="text-sm font-semibold text-gray-900 hover:text-gray-700"
      >
        Chat TOB
      </Link>
      <div className="flex items-center gap-3">
        {userLabel && (
          <span className="text-sm text-gray-600 truncate max-w-[12rem]">
            {userLabel}
          </span>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
