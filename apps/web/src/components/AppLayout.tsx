import { NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/generate", label: "Generate" },
  { to: "/solve", label: "Solve" },
  { to: "/history", label: "History" },
  { to: "/topics", label: "Topics" },
  { to: "/settings", label: "Settings" }
];

export function AppLayout() {
  const location = useLocation();
  const isWorkspace = location.pathname === "/solve";

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="topbar-brand">
          <h1>DSA Lab</h1>
        </NavLink>

        <nav className="topbar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
              style={{ position: "relative" }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className={isWorkspace ? "" : "page-container"}>
        <Outlet />
      </main>
    </div>
  );
}
