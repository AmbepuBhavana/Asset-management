import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import { errorMessage } from '../utils/errorMessage';

export default function Assignments() {
  const location = useLocation();
  const prefillAssetId = location.state?.prefillAssetId;

  const [list, setList] = useState([]);
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    assetId: prefillAssetId || '',
    assignedTo: '',
    assignedDate: new Date().toISOString().slice(0, 10),
    expectedReturnDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [{ data: rows }, { data: u }, { data: assetPage }] = await Promise.all([
      client.get('/api/assignments'),
      client.get('/api/users'),
      client.get('/api/assets?limit=100'),
    ]);
    setList(rows);
    setUsers(u.filter((x) => x.role === 'employee' || x.role === 'manager'));
    setAssets(assetPage.data || assetPage);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
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

  useEffect(() => {
    if (prefillAssetId) setForm((f) => ({ ...f, assetId: prefillAssetId }));
  }, [prefillAssetId]);

  const onAssign = async (e) => {
    e.preventDefault();
    if (!form.assetId || !form.assignedTo) {
      toast.error('Select asset and employee.');
      return;
    }
    setSubmitting(true);
    try {
      await client.post('/api/assignments', {
        assetId: form.assetId,
        assignedTo: form.assignedTo,
        assignedDate: new Date(form.assignedDate).toISOString(),
        expectedReturnDate: form.expectedReturnDate
          ? new Date(form.expectedReturnDate).toISOString()
          : null,
      });
      toast.success('Assigned');
      setForm({
        assetId: '',
        assignedTo: '',
        assignedDate: new Date().toISOString().slice(0, 10),
        expectedReturnDate: '',
      });
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onReturn = async (assignmentId) => {
    try {
      await client.put(`/api/assignments/${assignmentId}/return`, {
        returnDate: new Date().toISOString(),
      });
      toast.success('Returned');
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Assignments</h1>
        <p className="text-slate-400 text-sm mt-1">Assign assets to employees and process returns</p>
      </div>

      <form
        onSubmit={onAssign}
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2 text-sm font-medium text-slate-300">New assignment</div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Asset</label>
          <select
            required
            value={form.assetId}
            onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
          >
            <option value="">Select asset</option>
            {assets.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} ({a.serialNumber})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Assign to</label>
          <select
            required
            value={form.assignedTo}
            onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Assigned date</label>
          <input
            type="date"
            required
            value={form.assignedDate}
            onChange={(e) => setForm((f) => ({ ...f, assignedDate: e.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Expected return (optional)</label>
          <input
            type="date"
            value={form.expectedReturnDate}
            onChange={(e) => setForm((f) => ({ ...f, expectedReturnDate: e.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Assign asset'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Assigned to</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((row) => (
              <tr key={row._id}>
                <td className="px-4 py-3 text-slate-200">{row.assetId?.name}</td>
                <td className="px-4 py-3 text-slate-300">{row.assignedTo?.name}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {row.assignedDate && new Date(row.assignedDate).toLocaleDateString()}
                  {row.expectedReturnDate && (
                    <span className="block text-slate-400">
                      Due {new Date(row.expectedReturnDate).toLocaleDateString()}
                    </span>
                  )}
                  {row.returnDate && (
                    <span className="block">Returned {new Date(row.returnDate).toLocaleDateString()}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.status === 'Assigned'
                        ? 'text-emerald-400 text-xs'
                        : 'text-slate-500 text-xs'
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {row.status === 'Assigned' && (
                    <button
                      type="button"
                      onClick={() => onReturn(row._id)}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      Mark returned
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="p-6 text-center text-slate-500">No assignments</p>}
      </div>
    </div>
  );
}
