import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EBF6F9] dark:bg-[#0f141c] flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 flex-1 w-full pb-24 md:pb-8">
        {children}
      </main>
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        Sports Academy Desk &bull; Dumka Academy Management System
      </footer>
    </div>
  );
}
