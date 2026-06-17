import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import { ASSET_CATEGORIES, ASSET_STATUSES } from '../constants';
import { errorMessage } from '../utils/errorMessage';

function toInputDate(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return x.toISOString().slice(0, 10);
}

export default function AssetForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: ASSET_CATEGORIES[0],
    serialNumber: '',
    purchaseDate: toInputDate(new Date()),
    purchaseCost: '',
    warrantyExpiry: toInputDate(new Date()),
    vendor: '',
    location: '',
    status: 'Active',
  });

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/api/assets/${id}`);
        if (!cancelled) {
          setForm({
            name: data.name,
            category: data.category,
            serialNumber: data.serialNumber,
            purchaseDate: toInputDate(data.purchaseDate),
            purchaseCost: String(data.purchaseCost),
            warrantyExpiry: toInputDate(data.warrantyExpiry),
            vendor: data.vendor || '',
            location: data.location || '',
            status: data.status,
          });
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
  }, [id, isEdit, navigate]);

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.serialNumber.trim() ||
      !form.purchaseDate ||
      !form.warrantyExpiry ||
      form.purchaseCost === ''
    ) {
      toast.error('Please fill required fields.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('category', form.category);
      fd.append('serialNumber', form.serialNumber.trim());
      fd.append('purchaseDate', new Date(form.purchaseDate).toISOString());
      fd.append('purchaseCost', String(form.purchaseCost));
      fd.append('warrantyExpiry', new Date(form.warrantyExpiry).toISOString());
      fd.append('vendor', form.vendor.trim());
      fd.append('location', form.location.trim());
      fd.append('status', form.status);
      if (image) fd.append('image', image);

      if (isEdit) {
        await client.put(`/api/assets/${id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Asset updated');
        navigate(`/assets/${id}`);
      } else {
        const { data } = await client.post('/api/assets', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Asset created');
        navigate(`/assets/${data._id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit asset' : 'New asset'}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Name</label>
          <input
            required
            value={form.name}
            onChange={onChange('name')}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <select
              value={form.category}
              onChange={onChange('category')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Serial number</label>
            <input
              required
              value={form.serialNumber}
              onChange={onChange('serialNumber')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Purchase date</label>
            <input
              type="date"
              required
              value={form.purchaseDate}
              onChange={onChange('purchaseDate')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Warranty expiry</label>
            <input
              type="date"
              required
              value={form.warrantyExpiry}
              onChange={onChange('warrantyExpiry')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Purchase cost</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.purchaseCost}
              onChange={onChange('purchaseCost')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Status</label>
            <select
              value={form.status}
              onChange={onChange('status')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            >
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Vendor</label>
          <input
            value={form.vendor}
            onChange={onChange('vendor')}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Location</label>
          <input
            value={form.location}
            onChange={onChange('location')}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200"
          />
          <p className="text-xs text-slate-600 mt-1">Requires Cloudinary env on server</p>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create asset'}
          </button>
          <Link
            to={isEdit ? `/assets/${id}` : '/assets'}
            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
