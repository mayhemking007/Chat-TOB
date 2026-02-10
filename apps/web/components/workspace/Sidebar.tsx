"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FolderTree } from "./FolderTree";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Sidebar() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-gray-50/80">
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-3">
        <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-700">
          Chat TOB
        </Link>
      </div>
      <div className="flex flex-col gap-4 px-3 py-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Workspace
          </label>
          <WorkspaceSwitcher />
          <Link
            href="/?create=workspace"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Create workspace
          </Link>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Folders
          </span>
          {workspaceId ? (
            <FolderTree workspaceId={workspaceId} />
          ) : (
            <p className="text-sm text-gray-500">Select a workspace.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
