import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SportManager } from "@/components/SportManager";
import Link from "next/link";

export default async function CoachSportsPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/coach" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span>Sports</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Sports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Add sports or archive existing ones. Archiving blocks new sessions and matches.
          </p>
        </div>
      </div>

      <SportManager />
    </div>
  );
}
