import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import AssetForm from './pages/AssetForm';
import Assignments from './pages/Assignments';
import MyAssets from './pages/MyAssets';
import Reports from './pages/Reports';
import Users from './pages/Users';

function ProtectedLayout() {
  const { loading, token, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Layout />;
}

function RequireRole({ roles }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="my-assets" element={<MyAssets />} />
        <Route path="reports" element={<Reports />} />
        <Route element={<RequireRole roles={['admin', 'manager']} />}>
          <Route path="assets/new" element={<AssetForm />} />
          <Route path="assets/:id/edit" element={<AssetForm />} />
          <Route path="assignments" element={<Assignments />} />
        </Route>
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="users" element={<Users />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
