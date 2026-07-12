'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Shield,
  Phone,
  CreditCard,
  Calendar,
  ChevronDown,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiry: string;
  contact: string;
  safetyScore: number;
  status: DriverStatus;
  isExpired?: boolean;
  expiringSoon?: boolean;
}

interface DriverFormData {
  name: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiry: string;
  contact: string;
  safetyScore: number | string;
  status: DriverStatus;
}

const defaultForm: DriverFormData = {
  name: '',
  licenseNo: '',
  licenseCategory: 'B',
  licenseExpiry: '',
  contact: '',
  safetyScore: '',
  status: 'AVAILABLE',
};

const STATUS_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'On Trip', value: 'ON_TRIP' },
  { label: 'Off Duty', value: 'OFF_DUTY' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'BE', 'CE', 'DE'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safetyScoreColor(score: number): string {
  if (score > 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function safetyScoreBg(score: number): string {
  if (score > 80) return 'bg-emerald-400/10 border-emerald-400/30';
  if (score >= 60) return 'bg-amber-400/10 border-amber-400/30';
  return 'bg-red-400/10 border-red-400/30';
}

function safetyScoreBarColor(score: number): string {
  if (score > 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-red-400';
}

function safetyScoreIcon(score: number) {
  if (score > 80) return <CheckCircle className="w-3.5 h-3.5" />;
  if (score >= 60) return <AlertCircle className="w-3.5 h-3.5" />;
  return <AlertTriangle className="w-3.5 h-3.5" />;
}

function statusBadgeClass(status: DriverStatus): string {
  const map: Record<DriverStatus, string> = {
    AVAILABLE: 'badge badge-available',
    ON_TRIP: 'badge badge-on-trip',
    OFF_DUTY: 'badge badge-off-duty',
    SUSPENDED: 'badge badge-suspended',
  };
  return map[status] ?? 'badge';
}

function statusLabel(status: DriverStatus): string {
  const map: Record<DriverStatus, string> = {
    AVAILABLE: 'Available',
    ON_TRIP: 'On Trip',
    OFF_DUTY: 'Off Duty',
    SUSPENDED: 'Suspended',
  };
  return map[status] ?? status;
}

// ─── Safety Score Pill ────────────────────────────────────────────────────────

function SafetyScorePill({ score }: { score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${safetyScoreColor(score)} ${safetyScoreBg(score)}`}
    >
      {safetyScoreIcon(score)}
      {score}
    </span>
  );
}

// ─── License Badges ───────────────────────────────────────────────────────────

function LicenseBadges({
  isExpired,
  expiringSoon,
}: {
  isExpired?: boolean;
  expiringSoon?: boolean;
}) {
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider">
        <AlertTriangle className="w-3 h-3" />
        Expired
      </span>
    );
  }
  if (expiringSoon) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
        <AlertCircle className="w-3 h-3" />
        Expiring Soon
      </span>
    );
  }
  return null;
}

// ─── Driver Modal ─────────────────────────────────────────────────────────────

interface DriverModalProps {
  mode: 'add' | 'edit';
  initial: DriverFormData;
  onClose: () => void;
  onSubmit: (data: DriverFormData) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

function DriverModal({
  mode,
  initial,
  onClose,
  onSubmit,
  submitting,
  error,
}: DriverModalProps) {
  const [form, setForm] = useState<DriverFormData>(initial);

  const set = (field: keyof DriverFormData, value: string | number) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
              {mode === 'add' ? (
                <Plus className="w-5 h-5 text-amber-400" />
              ) : (
                <Edit2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-white">
              {mode === 'add' ? 'Add New Driver' : 'Edit Driver'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error mb-4 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="form-label">Full Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                className="form-input pl-9"
                placeholder="e.g. Rajesh Kumar"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>
          </div>

          {/* License No + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">License Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  className="form-input pl-9"
                  placeholder="MH-1234567890"
                  value={form.licenseNo}
                  onChange={(e) => set('licenseNo', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">License Category</label>
              <div className="relative">
                <select
                  className="form-input appearance-none pr-8"
                  value={form.licenseCategory}
                  onChange={(e) => set('licenseCategory', e.target.value)}
                  required
                >
                  {LICENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Expiry + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">License Expiry</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="date"
                  className="form-input pl-9"
                  value={form.licenseExpiry}
                  onChange={(e) => set('licenseExpiry', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Contact</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  className="form-input pl-9"
                  placeholder="+91 98765 43210"
                  value={form.contact}
                  onChange={(e) => set('contact', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Safety Score + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Safety Score (0–100)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="form-input pl-9"
                  placeholder="85"
                  value={form.safetyScore}
                  onChange={(e) => set('safetyScore', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="form-label">Status</label>
              <div className="relative">
                <select
                  className="form-input appearance-none pr-8"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as DriverStatus)}
                  required
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ON_TRIP">On Trip</option>
                  <option value="OFF_DUTY">Off Duty</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving&hellip;
                </>
              ) : mode === 'add' ? (
                <>
                  <Plus className="w-4 h-4" />
                  Add Driver
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  driver: Driver;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  submitting: boolean;
}

function DeleteConfirm({
  driver,
  onClose,
  onConfirm,
  submitting,
}: DeleteConfirmProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-full bg-red-500/15 border border-red-500/30">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Delete Driver
            </h2>
            <p className="text-zinc-400 text-sm">
              Are you sure you want to remove{' '}
              <span className="text-white font-medium">{driver.name}</span>?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn-danger flex-1 flex items-center justify-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting&hellip;
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="kpi-card">
      <div className={`p-2.5 rounded-lg ${accent} mb-3 w-fit`}>{icon}</div>
      <p className="text-zinc-400 text-xs font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showAdd, setShowAdd] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/drivers');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : (data.drivers ?? []));
    } catch (err: unknown) {
      setFetchError(
        err instanceof Error ? err.message : 'Failed to load drivers'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Derived
  const filtered = drivers.filter((d) => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.licenseNo.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: drivers.length,
    available: drivers.filter((d) => d.status === 'AVAILABLE').length,
    onTrip: drivers.filter((d) => d.status === 'ON_TRIP').length,
    suspended: drivers.filter((d) => d.status === 'SUSPENDED').length,
    avgSafety:
      drivers.length > 0
        ? Math.round(
            drivers.reduce((acc, d) => acc + d.safetyScore, 0) / drivers.length
          )
        : 0,
    expiring: drivers.filter((d) => d.expiringSoon || d.isExpired).length,
  };

  // Add
  const handleAdd = async (form: DriverFormData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, safetyScore: Number(form.safetyScore) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
      }
      setShowAdd(false);
      await fetchDrivers();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to add driver'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Edit
  const handleEdit = async (form: DriverFormData) => {
    if (!editDriver) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/drivers/${editDriver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, safetyScore: Number(form.safetyScore) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `Error ${res.status}`);
      }
      setEditDriver(null);
      await fetchDrivers();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to update driver'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteDriver) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/drivers/${deleteDriver.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setDeleteDriver(null);
      await fetchDrivers();
    } catch {
      // keep modal open
    } finally {
      setSubmitting(false);
    }
  };

  // Edit prefill
  const editForm: DriverFormData | null = editDriver
    ? {
        name: editDriver.name,
        licenseNo: editDriver.licenseNo,
        licenseCategory: editDriver.licenseCategory,
        licenseExpiry: editDriver.licenseExpiry?.split('T')[0] ?? '',
        contact: editDriver.contact,
        safetyScore: editDriver.safetyScore,
        status: editDriver.status,
      }
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Driver Management
              </h1>
            </div>
            <p className="text-zinc-400 text-sm ml-[52px]">
              Manage your fleet drivers, licenses &amp; compliance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDrivers}
              className="btn-secondary flex items-center gap-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => {
                setShowAdd(true);
                setFormError(null);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Driver
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            icon={<Users className="w-5 h-5 text-amber-400" />}
            label="Total Drivers"
            value={stats.total}
            accent="bg-amber-400/10"
          />
          <KPICard
            icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
            label="Available"
            value={stats.available}
            accent="bg-emerald-400/10"
          />
          <KPICard
            icon={<RefreshCw className="w-5 h-5 text-blue-400" />}
            label="On Trip"
            value={stats.onTrip}
            accent="bg-blue-400/10"
          />
          <KPICard
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            label="Suspended"
            value={stats.suspended}
            accent="bg-red-400/10"
          />
          <KPICard
            icon={<Shield className="w-5 h-5 text-amber-400" />}
            label="Avg Safety"
            value={`${stats.avgSafety}%`}
            accent="bg-amber-400/10"
          />
          <KPICard
            icon={<Calendar className="w-5 h-5 text-orange-400" />}
            label="License Alerts"
            value={stats.expiring}
            sub="expired / soon"
            accent="bg-orange-400/10"
          />
        </div>

        {/* ── Filters + Search ── */}
        <div className="glass-card flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                  statusFilter === f.value
                    ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-lg shadow-amber-400/20'
                    : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:border-amber-400/40 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              className="form-input pl-9 w-full"
              placeholder="Search by name or license&hellip;"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-300">
              {filtered.length} driver{filtered.length !== 1 ? 's' : ''}
              {statusFilter !== 'ALL' && (
                <span className="text-zinc-500">
                  {' '}
                  &middot; filtered by {statusFilter.replace('_', ' ')}
                </span>
              )}
            </p>
            {search && (
              <p className="text-xs text-zinc-500">
                Searching &ldquo;
                <span className="text-amber-400">{search}</span>
                &rdquo;
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-zinc-400 text-sm">Loading drivers&hellip;</p>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertTriangle className="w-10 h-10 text-red-400" />
              <p className="text-red-400 font-medium">{fetchError}</p>
              <button onClick={fetchDrivers} className="btn-secondary text-sm">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users className="w-10 h-10 text-zinc-600" />
              <p className="text-zinc-400 font-medium">No drivers found</p>
              <p className="text-zinc-600 text-sm">
                {search
                  ? 'Try adjusting your search'
                  : 'Add your first driver to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>License No</th>
                    <th>Category</th>
                    <th>License Expiry</th>
                    <th>Contact</th>
                    <th>Safety Score</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((driver) => (
                    <tr key={driver.id} className="group">
                      {/* Driver */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-400 text-xs font-bold">
                              {driver.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-white whitespace-nowrap">
                            {driver.name}
                          </span>
                        </div>
                      </td>

                      {/* License No */}
                      <td>
                        <span className="font-mono text-sm text-zinc-300">
                          {driver.licenseNo}
                        </span>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs font-semibold">
                          {driver.licenseCategory}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-zinc-300">
                            {driver.licenseExpiry
                              ? new Date(driver.licenseExpiry).toLocaleDateString(
                                  'en-IN',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  }
                                )
                              : '—'}
                          </span>
                          <LicenseBadges
                            isExpired={driver.isExpired}
                            expiringSoon={driver.expiringSoon}
                          />
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className="flex items-center gap-1.5 text-zinc-300 text-sm">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          {driver.contact}
                        </div>
                      </td>

                      {/* Safety Score */}
                      <td>
                        <div className="flex items-center gap-2">
                          <SafetyScorePill score={driver.safetyScore} />
                          <div className="hidden sm:block w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${safetyScoreBarColor(driver.safetyScore)}`}
                              style={{ width: `${driver.safetyScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={statusBadgeClass(driver.status)}>
                          {statusLabel(driver.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditDriver(driver);
                              setFormError(null);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                            title="Edit driver"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDriver(driver)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Delete driver"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !fetchError && drivers.length > 0 && (
          <p className="text-xs text-zinc-600 text-center">
            Showing {filtered.length} of {drivers.length} drivers &middot; Last
            refreshed {new Date().toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* ── Modals ── */}

      {showAdd && (
        <DriverModal
          mode="add"
          initial={defaultForm}
          onClose={() => setShowAdd(false)}
          onSubmit={handleAdd}
          submitting={submitting}
          error={formError}
        />
      )}

      {editDriver && editForm && (
        <DriverModal
          mode="edit"
          initial={editForm}
          onClose={() => setEditDriver(null)}
          onSubmit={handleEdit}
          submitting={submitting}
          error={formError}
        />
      )}

      {deleteDriver && (
        <DeleteConfirm
          driver={deleteDriver}
          onClose={() => setDeleteDriver(null)}
          onConfirm={handleDelete}
          submitting={submitting}
        />
      )}
    </div>
  );
}
