import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/errorMessage';

export default function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) navigate(from, { replace: true });
  }, [token, from, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error('Enter a valid email and password (min 6 characters).');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white text-center mb-1">Sign in</h1>
        <p className="text-slate-400 text-sm text-center mb-8">Organization Asset Management</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-500 py-2.5 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-xs text-slate-500 text-center">
          Seed users: admin@org.com / manager@org.com / jane@org.com — password{' '}
          <code className="text-slate-400">password123</code>
        </p>
      </div>
    </div>
  );
}
