import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MAINTENANCE_STATUSES } from '../constants';
import { errorMessage } from '../utils/errorMessage';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canManageAssets } = useAuth();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintForm, setMaintForm] = useState({
    issueDescription: '',
    reportedBy: user?.name || '',
    technician: '',
    status: 'Pending',
    resolutionNotes: '',
    cost: 0,
  });
  const [savingMaint, setSavingMaint] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      setLoading(false);
      navigate('/assets', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [a, h] = await Promise.all([
          client.get(`/api/assets/${id}`),
          client.get(`/api/assets/${id}/history`),
        ]);
        if (!cancelled) {
          setAsset(a.data);
          setHistory(h.data);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(errorMessage(e));
          navigate('/assets');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    setMaintForm((f) => ({ ...f, reportedBy: user?.name || '' }));
  }, [user?.name]);

  const reloadHistory = async () => {
    const { data: h } = await client.get(`/api/assets/${id}/history`);
    setHistory(h);
    const { data: a } = await client.get(`/api/assets/${id}`);
    setAsset(a);
  };

  const onSubmitMaintenance = async (e) => {
    e.preventDefault();
    if (!maintForm.issueDescription.trim() || !maintForm.reportedBy.trim()) {
      toast.error('Issue and reporter are required.');
      return;
    }
    setSavingMaint(true);
    try {
      await client.post('/api/maintenance', {
        assetId: id,
        issueDescription: maintForm.issueDescription.trim(),
        reportedBy: maintForm.reportedBy.trim(),
        technician: maintForm.technician.trim(),
        status: maintForm.status,
        resolutionNotes: maintForm.resolutionNotes,
        cost: Number(maintForm.cost) || 0,
      });
      toast.success('Maintenance logged');
      setMaintForm({
        issueDescription: '',
        reportedBy: user?.name || '',
        technician: '',
        status: 'Pending',
        resolutionNotes: '',
        cost: 0,
      });
      await reloadHistory();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingMaint(false);
    }
  };

  const updateMaintStatus = async (mId, patch) => {
    try {
      await client.put(`/api/maintenance/${mId}`, patch);
      toast.success('Updated');
      await reloadHistory();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this asset and related records?')) return;
    try {
      await client.delete(`/api/assets/${id}`);
      toast.success('Asset deleted');
      navigate('/assets');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (id === 'new') return null;

  if (loading || !asset) {
    return <p className="text-slate-400">Loading…</p>;
  }

  const assignments = history?.assignments || [];
  const maintenances = history?.maintenances || [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
        <div className="shrink-0 w-full sm:w-48">
          {asset.imageUrl ? (
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="rounded-xl border border-slate-800 w-full object-cover aspect-square"
            />
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 aspect-square flex items-center justify-center text-slate-600 text-sm">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
            <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {asset.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            {asset.category} · SN {asset.serialNumber}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-4">
            <div>
              <dt className="text-slate-500">Purchase date</dt>
              <dd className="text-slate-200">
                {asset.purchaseDate && new Date(asset.purchaseDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Cost</dt>
              <dd className="text-slate-200">${Number(asset.purchaseCost).toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Warranty expiry</dt>
              <dd className="text-slate-200">
                {asset.warrantyExpiry && new Date(asset.warrantyExpiry).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Vendor</dt>
              <dd className="text-slate-200">{asset.vendor || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="text-slate-200">{asset.location || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Created by</dt>
              <dd className="text-slate-200">{asset.createdBy?.name || '—'}</dd>
            </div>
          </dl>
          {canManageAssets && (
            <div className="flex flex-wrap gap-2 pt-4">
              <Link
                to={`/assets/${id}/edit`}
                className="rounded-lg bg-sky-500/20 text-sky-300 px-3 py-2 text-sm font-medium hover:bg-sky-500/30"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg bg-rose-500/20 text-rose-300 px-3 py-2 text-sm font-medium hover:bg-rose-500/30"
              >
                Delete
              </button>
              <Link
                to="/assignments"
                state={{ prefillAssetId: id }}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Assign…
              </Link>
            </div>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Assignment history</h2>
        <ul className="space-y-3 text-sm">
          {assignments.map((as) => (
            <li key={as._id} className="border-l-2 border-sky-500/50 pl-3">
              <p className="text-slate-200">
                {as.status === 'Assigned' ? 'Assigned' : 'Returned'} to{' '}
                <span className="text-sky-400">{as.assignedTo?.name}</span>
              </p>
              <p className="text-slate-500 text-xs">
                From {as.assignedDate && new Date(as.assignedDate).toLocaleString()}
                {as.returnDate && ` → returned ${new Date(as.returnDate).toLocaleString()}`}
                {as.expectedReturnDate &&
                  ` · expected return ${new Date(as.expectedReturnDate).toLocaleDateString()}`}
              </p>
            </li>
          ))}
          {!assignments.length && <li className="text-slate-500">No assignments yet</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Maintenance history</h2>
        <ul className="space-y-4">
          {maintenances.map((m) => (
            <li key={m._id} className="text-sm border border-slate-800 rounded-lg p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-slate-200 font-medium">{m.issueDescription}</span>
                <span className="text-amber-300 text-xs">{m.status}</span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Reported by {m.reportedBy}
                {m.technician && ` · ${m.technician}`}
                {m.cost != null && ` · $${Number(m.cost).toFixed(2)}`}
              </p>
              {m.resolutionNotes && (
                <p className="text-slate-400 mt-2 text-xs">{m.resolutionNotes}</p>
              )}
              {canManageAssets && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {MAINTENANCE_STATUSES.filter((s) => s !== m.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateMaintStatus(m._id, { status: s })}
                      className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Set {s}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
          {!maintenances.length && <li className="text-slate-500">No maintenance records</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Log maintenance</h2>
        <form onSubmit={onSubmitMaintenance} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Issue description</label>
            <textarea
              required
              value={maintForm.issueDescription}
              onChange={(e) => setMaintForm((f) => ({ ...f, issueDescription: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Reported by</label>
            <input
              required
              value={maintForm.reportedBy}
              onChange={(e) => setMaintForm((f) => ({ ...f, reportedBy: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Technician</label>
            <input
              value={maintForm.technician}
              onChange={(e) => setMaintForm((f) => ({ ...f, technician: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status</label>
            <select
              value={maintForm.status}
              onChange={(e) => setMaintForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              {MAINTENANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Cost</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={maintForm.cost}
              onChange={(e) => setMaintForm((f) => ({ ...f, cost: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Resolution notes</label>
            <textarea
              value={maintForm.resolutionNotes}
              onChange={(e) => setMaintForm((f) => ({ ...f, resolutionNotes: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white min-h-[60px]"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={savingMaint}
              className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
            >
              {savingMaint ? 'Saving…' : 'Submit maintenance'}
            </button>
          </div>
        </form>
      </section>

      <Link to="/assets" className="text-slate-400 hover:text-white text-sm">
        ← Back to assets
      </Link>
    </div>
  );
}
