import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/workspace/Sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
