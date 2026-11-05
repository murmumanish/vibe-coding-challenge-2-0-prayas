"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MenuIcon,
  CloseIcon,
  StadiumIcon,
  DashboardIcon,
  SportsIcon,
  PeopleIcon,
  ClipboardIcon,
  MatchIcon,
  StarIcon,
  ScoutIcon,
  AthleteIcon,
  LogoutIcon,
} from "@/components/Icons";
import { ThemeToggle } from "@/components/ThemeToggle";

interface User {
  id: string;
  name: string;
  email: string;
  role: "coach" | "player" | "scout";
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COACH_NAV: NavItem[] = [
  { label: "Dashboard", href: "/coach", icon: DashboardIcon },
  { label: "Sports", href: "/coach/sports", icon: SportsIcon },
  { label: "Players", href: "/coach/players", icon: PeopleIcon },
  { label: "Sessions", href: "/coach/sessions", icon: ClipboardIcon },
  { label: "Matches", href: "/coach/matches", icon: MatchIcon },
  { label: "Trial Ready", href: "/coach/ready", icon: StarIcon },
];

const SCOUT_NAV: NavItem[] = [
  { label: "Ready Players", href: "/scout", icon: ScoutIcon },
];

const PLAYER_NAV: NavItem[] = [
  { label: "My Stats", href: "/player", icon: AthleteIcon },
];

const ROLE_BADGE: Record<string, string> = {
  coach: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800",
  scout: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800",
  player: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800",
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Close drawer whenever route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Handle Escape key to close drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navLinks =
    user?.role === "coach"
      ? COACH_NAV
      : user?.role === "scout"
      ? SCOUT_NAV
      : user?.role === "player"
      ? PLAYER_NAV
      : [];

  function isActive(href: string) {
    if (href === "/coach") return pathname === "/coach";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Material Top App Bar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#18202c]/95 backdrop-blur-md material-shadow-1 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 h-16">
          {/* Left Side: Hamburger Icon (Mobile only) + Brand */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button on LEFT side (Mobile only, hidden on Desktop) */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation drawer"
              title="Open menu"
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Academy Brand Logo & Title */}
            <Link
              href={user ? `/${user.role}` : "/"}
              className="flex items-center gap-2.5 group"
            >
              <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#ADD8E6] text-slate-900 border border-blue-200 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                <StadiumIcon className="w-5 h-5 text-slate-900" />
              </span>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base md:text-lg block leading-none">
                  Sports Academy
                </span>
                {/*<span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 dark:text-slate-300 mt-0.5 block leading-none">
                  Dumka Portal
                </span>*/}
              </div>
            </Link>
          </div>

          {/* Center (Desktop only Navigation Chips) */}
          <nav className="hidden md:flex items-center gap-1 mx-2 lg:mx-4">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const IconComp = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-[#ADD8E6] text-slate-900 dark:bg-[#ADD8E6]/20 dark:text-[#ADD8E6] border border-[#96cce0] dark:border-[#ADD8E6]/30 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Night Mode Toggle + User Profile + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Night Mode Toggle */}
            <ThemeToggle />

            {/* User Profile Chip (Desktop) */}
            {user && (
              <div className="hidden md:flex items-center gap-2 pl-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                  {user.name}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    ROLE_BADGE[user.role]
                  }`}
                >
                  {user.role}
                </span>
              </div>
            )}

            {/* Sign Out Button (Desktop) */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 active:bg-red-700 active:text-white transition-colors shadow-xs"
            >
              <LogoutIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Material Navigation Drawer (Left-Side Sliding Drawer) ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Surface from LEFT side */}
          <aside className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-white dark:bg-[#18202c] border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-300 ease-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Menu
              </span>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation drawer"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card inside Drawer */}
            {user && (
              <div className="m-4 p-3.5 rounded-2xl bg-[#EBF6F9] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ADD8E6] text-slate-900 font-black text-sm shrink-0 border border-blue-200">
                  {user.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                  <span
                    className={`mt-1 inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      ROLE_BADGE[user.role]
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Links inside Drawer */}
            <div className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Navigation
              </p>
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const IconComp = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                      active
                        ? "bg-[#ADD8E6] text-slate-900 shadow-sm border border-blue-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-[#EBF6F9] dark:hover:bg-slate-800"
                    }`}
                  >
                    <IconComp className={`w-5 h-5 ${active ? "text-slate-900" : "text-slate-500 dark:text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer: Theme Toggle & Sign out */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {/* Theme Toggle row */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Night Mode
                </span>
                <ThemeToggle />
              </div>

              {/* Sign out */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
                  loggingOut
                    ? "bg-red-600 text-white border border-red-600 shadow-md"
                    : "text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white active:bg-red-600 active:text-white dark:active:bg-red-600 dark:active:text-white border border-red-200 dark:border-red-900/50 active:border-red-600"
                }`}
              >
                <LogoutIcon className="w-4 h-4" />
                <span>{loggingOut ? "Signing Out..." : "Sign Out of Desk"}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (Thumb reachable, No Emojis, Dark-Mode Ready) ── */}
      {user?.role === "coach" && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#18202c]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe transition-colors">
          <div className="flex items-stretch h-14">
            {COACH_NAV.filter((link) => link.href !== "/coach/ready").map((link) => {
              const active = isActive(link.href);
              const IconComp = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex-1 relative flex flex-col items-center justify-center gap-1 transition-colors ${
                    active
                      ? "text-slate-900 dark:text-[#ADD8E6]"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <IconComp className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                  <span
                    className={`text-[10px] font-bold tracking-tight leading-none ${
                      active ? "text-slate-900 dark:text-[#ADD8E6]" : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {link.label === "Dashboard" ? "Home" : link.label}
                  </span>
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#ADD8E6] rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
