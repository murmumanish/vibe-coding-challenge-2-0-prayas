import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getAllSports } from "@/services/sport.service";
import { getAllMatches } from "@/services/match.service";
import { MatchesManager } from "@/components/MatchesManager";

export default async function CoachMatchesPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const [rawSports, rawMatches] = await Promise.all([
    getAllSports(true),
    getAllMatches(),
  ]);

  const sports = JSON.parse(JSON.stringify(rawSports));
  const matches = JSON.parse(JSON.stringify(rawMatches));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Link href="/coach" className="hover:text-indigo-600 transition">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Matches</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Academy Matches
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule matches and record verified player performance scores.
          </p>
        </div>
      </div>

      <MatchesManager initialMatches={matches} sports={sports} />
    </div>
  );
}
