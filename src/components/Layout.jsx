import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-sky-500/20 text-sky-300' : 'text-slate-300 hover:bg-slate-800'
  }`;

export default function Layout() {
  const { user, logout, canManageAssets, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="p-4 border-b border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500">Asset OS</p>
          <p className="font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
        </div>
        <nav className="p-2 flex flex-row flex-wrap md:flex-col gap-1">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/assets" className={linkClass}>
            Assets
          </NavLink>
          {canManageAssets && (
            <NavLink to="/assignments" className={linkClass}>
              Assignments
            </NavLink>
          )}
          <NavLink to="/my-assets" className={linkClass}>
            My assignments
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            Reports
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={linkClass}>
              Users
            </NavLink>
          )}
        </nav>
        <div className="p-2 mt-auto hidden md:block">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="md:hidden flex justify-end mb-4">
          <button
            type="button"
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white"
          >
            Log out
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
