import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { errorMessage } from '../utils/errorMessage';

const COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: d } = await client.get('/api/dashboard');
        if (!cancelled) {
          setData(d);
          const w = d.notificationSummary?.warrantyExpiringCount || 0;
          const o = d.notificationSummary?.overdueReturnCount || 0;
          if (w > 0)
            toast(`Warranties expiring within 30 days: ${w}`, { icon: '⚠️', id: 'alert-warranty' });
          if (o > 0) toast(`Overdue asset returns: ${o}`, { icon: '⏰', id: 'alert-returns' });
        }
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

  if (loading || !data) {
    return <div className="text-slate-400">Loading dashboard…</div>;
  }

  const statusData = (data.byStatus || []).map((s) => ({ name: s.name, value: s.value }));
  const categoryData = data.byCategory || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of your organization assets</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 uppercase">Total assets</p>
          <p className="text-3xl font-bold text-white mt-1">{data.totalAssets}</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-200/80 uppercase">Warranty alerts (30d)</p>
          <p className="text-3xl font-bold text-amber-300 mt-1">
            {data.notificationSummary?.warrantyExpiringCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="text-xs text-rose-200/80 uppercase">Overdue returns</p>
          <p className="text-3xl font-bold text-rose-300 mt-1">
            {data.notificationSummary?.overdueReturnCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 uppercase">Open maintenance</p>
          <p className="text-3xl font-bold text-white mt-1">{data.underMaintenance?.length ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 h-80">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Assets by status</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 h-80">
          <h2 className="text-sm font-semibold text-slate-300 mb-2">Assets by category</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={categoryData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Recently added</h2>
          <ul className="space-y-2">
            {(data.recentAssets || []).map((a) => (
              <li key={a._id} className="flex justify-between gap-2 text-sm">
                <Link to={`/assets/${a._id}`} className="text-sky-400 hover:underline truncate">
                  {a.name}
                </Link>
                <span className="text-slate-500 shrink-0">
                  {a.createdAt && new Date(a.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
            {!data.recentAssets?.length && <li className="text-slate-500">No assets yet</li>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Under maintenance</h2>
          <ul className="space-y-2">
            {(data.underMaintenance || []).map((m) => (
              <li key={m._id} className="text-sm flex justify-between gap-2">
                <Link
                  to={`/assets/${m.assetId?._id || m.assetId}`}
                  className="text-sky-400 hover:underline truncate"
                >
                  {m.assetId?.name || 'Asset'}
                </Link>
                <span className="text-amber-300 shrink-0">{m.status}</span>
              </li>
            ))}
            {!data.underMaintenance?.length && (
              <li className="text-slate-500">No open maintenance tickets</li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Expiring warranties (30 days)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800">
                <th className="pb-2 pr-4">Asset</th>
                <th className="pb-2 pr-4">Serial</th>
                <th className="pb-2">Warranty ends</th>
              </tr>
            </thead>
            <tbody>
              {(data.expiringWarranties || []).map((a) => (
                <tr key={a._id} className="border-b border-slate-800/80">
                  <td className="py-2 pr-4">
                    <Link to={`/assets/${a._id}`} className="text-sky-400 hover:underline">
                      {a.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-slate-400">{a.serialNumber}</td>
                  <td className="py-2 text-amber-200">
                    {a.warrantyExpiry && new Date(a.warrantyExpiry).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.expiringWarranties?.length && (
            <p className="text-slate-500 text-sm">None in the next 30 days</p>
          )}
        </div>
      </section>
    </div>
  );
}
