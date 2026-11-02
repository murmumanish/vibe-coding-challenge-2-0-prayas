"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: "coach" | "player" | "scout";
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const roleColors = {
    coach: "bg-blue-100 text-blue-800 border-blue-200",
    scout: "bg-emerald-100 text-emerald-800 border-emerald-200",
    player: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const navLinks = user?.role === "coach" ? [
    { label: "Dashboard", href: "/coach" },
    { label: "Sports", href: "/coach/sports" },
    { label: "Players", href: "/coach/players" },
    { label: "Sessions", href: "/coach/sessions" },
    { label: "Matches", href: "/coach/matches" },
  ] : user?.role === "scout" ? [
    { label: "Ready Players", href: "/scout" },
  ] : user?.role === "player" ? [
    { label: "My Stats", href: "/player" },
  ] : [];

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link href={user ? `/${user.role}` : "/"} className="flex items-center gap-2.5 group">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md text-base group-hover:scale-105 transition-transform">
              🏟️
            </span>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                Sports Academy
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 leading-none">
                Desk
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/coach" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs font-medium text-slate-600">
                {user.name}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${
                  roleColors[user.role]
                }`}
              >
                {user.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
