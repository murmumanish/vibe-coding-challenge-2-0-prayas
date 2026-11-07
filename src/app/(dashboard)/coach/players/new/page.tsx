import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function NewPlayerPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // If Admin/Owner accesses this legacy URL, redirect to Admin student registration
  if (session.role === "admin") {
    redirect("/admin/students/new");
  }

  // Coaches cannot register students; redirect to coach players view
  redirect("/coach/players");
}
