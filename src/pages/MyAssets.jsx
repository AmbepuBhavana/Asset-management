import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import { errorMessage } from '../utils/errorMessage';

export default function MyAssets() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get('/api/assignments/employee/me');
        if (!cancelled) setRows(data);
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

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">My current assignments</h1>
      <p className="text-slate-400 text-sm">Assets currently checked out to you</p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r._id}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          >
            <div>
              <Link
                to={`/assets/${r.assetId?._id || r.assetId}`}
                className="text-sky-400 font-medium hover:underline"
              >
                {r.assetId?.name}
              </Link>
              <p className="text-xs text-slate-500 mt-1">
                Since {r.assignedDate && new Date(r.assignedDate).toLocaleDateString()}
                {r.expectedReturnDate &&
                  ` · expected return ${new Date(r.expectedReturnDate).toLocaleDateString()}`}
              </p>
            </div>
            <span className="text-xs text-emerald-400/90">Active</span>
          </li>
        ))}
      </ul>
      {!rows.length && <p className="text-slate-500">You have no active assignments.</p>}
    </div>
  );
}
