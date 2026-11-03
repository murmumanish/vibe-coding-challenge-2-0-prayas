export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#EBF6F9] dark:bg-[#0f141c] flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
}
