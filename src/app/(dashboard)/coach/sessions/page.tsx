import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllSports } from "@/services/sport.service";
import { getAllSessions } from "@/services/session.service";
import { SessionsManager } from "@/components/SessionsManager";

export default async function CoachSessionsPage() {
  const session = await getSession();
  if (!session || session.role !== "coach") {
    redirect("/login");
  }

  const [rawSports, rawSessions] = await Promise.all([
    getAllSports(true), // active sports only
    getAllSessions(),
  ]);

  const sports = JSON.parse(JSON.stringify(rawSports));
  const sessions = JSON.parse(JSON.stringify(rawSessions));

  return <SessionsManager initialSessions={sessions} sports={sports} />;
}
