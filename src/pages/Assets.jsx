import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ASSET_CATEGORIES, ASSET_STATUSES } from '../constants';
import { errorMessage } from '../utils/errorMessage';

export default function Assets() {
  const { canManageAssets } = useAuth();
  const [data, setData] = useState({ data: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [applied, setApplied] = useState({
    search: '',
    category: '',
    status: '',
    location: '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10' });
        if (applied.search.trim()) params.set('search', applied.search.trim());
        if (applied.category) params.set('category', applied.category);
        if (applied.status) params.set('status', applied.status);
        if (applied.location.trim()) params.set('location', applied.location.trim());
        const { data: res } = await client.get(`/api/assets?${params}`);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) toast.error(errorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, applied]);

  const onFilterSubmit = (e) => {
    e.preventDefault();
    setApplied({
      search,
      category,
      status,
      location,
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets</h1>
          <p className="text-slate-400 text-sm mt-1">Search, filter, and manage inventory</p>
        </div>
        {canManageAssets && (
          <Link
            to="/assets/new"
            className="inline-flex justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            Add asset
          </Link>
        )}
      </div>

      <form
        onSubmit={onFilterSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3"
      >
        <input
          placeholder="Search name / serial / category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white lg:col-span-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="">All categories</option>
          {ASSET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="">All statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          placeholder="Location contains"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Apply filters
        </button>
      </form>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Serial</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                {data.data.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <Link to={`/assets/${a._id}`} className="text-sky-400 hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{a.category}</td>
                    <td className="px-4 py-3 text-slate-400">{a.serialNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          a.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : a.status === 'Retired'
                              ? 'bg-slate-600/40 text-slate-300'
                              : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{a.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.data.length && (
              <p className="p-8 text-center text-slate-500">No assets match your filters</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Page {data.page} of {data.pages} ({data.total} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40 hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={data.page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40 hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
