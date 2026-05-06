import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/generate", label: "Generate Problem" },
  { to: "/solve", label: "Solve Problem" },
  { to: "/history", label: "Submission History" },
  { to: "/topics", label: "Topic Explorer" }
];

export function AppLayout() {
  return (
    <div className="min-h-screen px-4 py-5 md:px-8">
      <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="text-xl font-bold tracking-wide text-slate-100">
          DSA Lab AI
        </Link>
        <nav className="panel flex flex-wrap items-center gap-2 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? "bg-emerald-500/20 text-emerald-300" : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
