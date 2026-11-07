// src/app/page.tsx
import Link from "next/link";
import {
  Trophy,
  User,
  ClipboardCheck,
  Eye,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { academy } from "@/lib/academy";
import { BrandLogoIcon } from "@/components/Icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { dbConnect } from "@/lib/db";
import Sport from "@/models/Sport";

export const revalidate = 3600;

interface PublicSport {
  name: string;
  slug: string;
}

async function getPublicSports(): Promise<PublicSport[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/sports/public`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch {
    // Fall through to database fallback
  }

  try {
    await dbConnect();
    const sports = await Sport.find({ isActive: true })
      .select("name slug -_id")
      .sort({ name: 1 })
      .lean();

    return sports.map((s) => ({
      name: s.name,
      slug: s.slug,
    }));
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const sports = await getPublicSports();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <nav
          className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
          aria-label="Main Navigation"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg sm:text-xl text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus:outline-none"
          >
            <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
              <BrandLogoIcon className="w-5 h-5" />
            </span>
            <span>{academy.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-card bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus:outline-none"
            >
              {academy.sections.navLogin}
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10 md:space-y-16">
        {/* 2. Hero */}
        <section
          id="hero"
          className="py-6 sm:py-10 text-center flex flex-col items-center"
        >
          <div className="mb-4 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-card border border-card-border shadow-sm text-primary">
            <BrandLogoIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
            {academy.name}
          </h1>
          <p className="mt-4 text-base sm:text-xl text-foreground/80 max-w-2xl">
            {academy.tagline}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 font-semibold rounded-card bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus:outline-none"
            >
              {academy.sections.heroLoginCta}
            </Link>
            <a
              href="#sports"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 font-semibold rounded-card border border-card-border bg-card hover:bg-card-hover text-foreground transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus:outline-none"
            >
              {academy.sections.heroSportsCta}
            </a>
          </div>
        </section>

        {/* 3. Sports */}
        <section id="sports" className="scroll-mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
            {academy.sections.sportsHeading}
          </h2>

          {sports.length === 0 ? (
            <div className="bg-card border border-card-border rounded-card p-8 text-center text-foreground/70">
              <p>{academy.sections.sportsEmptyState}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sports.map((sport) => (
                <div
                  key={sport.slug}
                  className="bg-card border border-card-border rounded-card hover:bg-card-hover p-4 flex items-center gap-3 transition-colors duration-150"
                >
                  <Trophy
                    className="w-5 h-5 text-primary flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-sm sm:text-base text-foreground truncate">
                    {sport.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. How it works / Who it is for */}
        <section id="how-it-works" className="scroll-mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
            {academy.sections.howItWorksHeading}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {academy.sections.howItWorksCards.map((card) => {
              const IconComponent =
                card.id === "players"
                  ? User
                  : card.id === "coaches"
                  ? ClipboardCheck
                  : Eye;

              return (
                <div
                  key={card.id}
                  className="bg-card border border-card-border rounded-card hover:bg-card-hover p-6 flex flex-col gap-4 transition-colors duration-150"
                >
                  <div className="w-10 h-10 rounded-card bg-primary-container text-primary-on-container flex items-center justify-center">
                    <IconComponent className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. About and contact */}
        <section id="about" className="scroll-mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-6">
            {academy.sections.aboutHeading}
          </h2>

          <div className="bg-card border border-card-border rounded-card hover:bg-card-hover p-6 sm:p-8 space-y-6 transition-colors duration-150">
            <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
              {academy.about}
            </p>

            <div className="border-t border-card-border pt-6">
              <h3 className="text-base font-semibold text-foreground mb-4">
                {academy.sections.contactHeading}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="block font-medium text-foreground">
                      {academy.sections.addressLabel}
                    </span>
                    <span className="text-foreground/80">
                      {academy.contact.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="block font-medium text-foreground">
                      {academy.sections.phoneLabel}
                    </span>
                    <a
                      href={academy.contact.phoneHref}
                      className="text-foreground/80 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus:outline-none"
                    >
                      {academy.contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="block font-medium text-foreground">
                      {academy.sections.emailLabel}
                    </span>
                    <a
                      href={academy.contact.emailHref}
                      className="text-foreground/80 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus:outline-none"
                    >
                      {academy.contact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="block font-medium text-foreground">
                      {academy.sections.hoursLabel}
                    </span>
                    <span className="text-foreground/80">
                      {academy.contact.workingHours}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-card-border py-8 text-center text-sm text-foreground/70">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <p>
            © {new Date().getFullYear()} {academy.name}.{" "}
            {academy.footer.copyrightSuffix}
          </p>
        </div>
      </footer>
    </div>
  );
}
