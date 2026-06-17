import { useState } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';
import { ASSET_CATEGORIES, ASSET_STATUSES } from '../constants';
import { errorMessage } from '../utils/errorMessage';

export default function Reports() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      const res = await client.get(`/api/reports/export/csv?${params}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Export asset list to CSV with filters</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">From (created)</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To (created)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
          >
            <option value="">All</option>
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-sm"
          >
            <option value="">All</option>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="w-full rounded-lg bg-sky-500 py-2.5 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
        >
          {downloading ? 'Preparing…' : 'Download CSV'}
        </button>
        <p className="text-xs text-slate-600">
          Employees only export assets they have been associated with (assignment history).
        </p>
      </div>
    </div>
  );
}
