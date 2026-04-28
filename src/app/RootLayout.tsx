import { Link, Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Steins
          </Link>
          <nav className="text-sm text-neutral-400">
            <Link to="/" className="hover:text-neutral-100">
              카탈로그
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
