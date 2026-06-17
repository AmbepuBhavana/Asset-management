import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';
import { errorMessage } from '../utils/errorMessage';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
  });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await client.get('/api/users');
    setUsers(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) toast.error(errorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      toast.error('Name, email, and password (min 6) required.');
      return;
    }
    setCreating(true);
    try {
      await client.post('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department.trim(),
      });
      toast.success('User created');
      setForm({ name: '', email: '', password: '', role: 'employee', department: '' });
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await client.delete(`/api/users/${id}`);
      toast.success('User removed');
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 text-sm mt-1">Create accounts (admin only)</p>
      </div>

      <form
        onSubmit={onCreate}
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <input
          placeholder="Department"
          value={form.department}
          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          className="md:col-span-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-3 text-slate-200">{u.name}</td>
                <td className="px-4 py-3 text-slate-400">{u.email}</td>
                <td className="px-4 py-3 capitalize text-slate-300">{u.role}</td>
                <td className="px-4 py-3 text-slate-500">{u.department}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(u._id)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
