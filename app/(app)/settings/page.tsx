"use client";

import { useEffect, useState } from "react";
import { Shield, Users, Loader2, Save } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const ROLES = ["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"];
const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};
const ROLE_COLORS: Record<string, string> = {
  FLEET_MANAGER: "text-amber-400",
  DISPATCHER: "text-blue-400",
  SAFETY_OFFICER: "text-green-400",
  FINANCIAL_ANALYST: "text-purple-400",
};

const PERMISSIONS: Record<string, string[]> = {
  FLEET_MANAGER: ["Manage Vehicles", "Manage Maintenance", "View Analytics", "Manage Settings", "Manage Drivers"],
  DISPATCHER: ["Manage Trips", "Manage Drivers", "Manage Vehicles"],
  SAFETY_OFFICER: ["Manage Drivers", "View Analytics"],
  FINANCIAL_ANALYST: ["View Finance", "Manage Finance", "View Analytics"],
};

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [roleChanges, setRoleChanges] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const json = await res.json();
    if (json.success) setUsers(json.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleUpdate = async (userId: string) => {
    const newRole = roleChanges[userId];
    if (!newRole) return;
    setUpdating(userId);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const json = await res.json();
    setUpdating(null);
    if (json.success) {
      setSuccess(`Updated ${json.data.name}'s role to ${ROLE_LABELS[json.data.role]}`);
      setTimeout(() => setSuccess(null), 3000);
      setRoleChanges(prev => { const p = {...prev}; delete p[userId]; return p; });
      load();
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings & RBAC</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user roles and permissions</p>
        </div>
      </div>

      {success && <div className="alert-success mb-6">✓ {success}</div>}

      {/* Role Permission Matrix */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Shield size={14} className="text-amber-400" />
          Role Permissions Matrix
        </h2>
        <p className="text-xs text-gray-500 mb-5">What each role can do in TransitOps</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map(role => (
            <div key={role} className="bg-white/3 rounded-10 p-4 border border-white/5">
              <p className={`text-sm font-bold mb-3 ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</p>
              <div className="space-y-2">
                {PERMISSIONS[role].map(perm => (
                  <div key={perm} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Management */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Users size={14} className="text-amber-400" />
          <h2 className="text-sm font-bold text-white">User Management</h2>
          <span className="text-xs text-gray-500 ml-1">({users.length} users)</span>
        </div>

        {loading ? (
          <div className="p-10 text-center"><Loader2 size={20} className="animate-spin inline text-gray-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Change Role</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const pendingRole = roleChanges[user.id];
                  return (
                    <tr key={user.id}>
                      <td className="font-medium">{user.name}</td>
                      <td className="text-gray-400 text-xs">{user.email}</td>
                      <td>
                        <span className={`text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-input text-xs py-1.5"
                          value={pendingRole ?? user.role}
                          onChange={e => setRoleChanges(prev => ({...prev, [user.id]: e.target.value}))}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        {pendingRole && pendingRole !== user.role ? (
                          <button
                            onClick={() => handleRoleUpdate(user.id)}
                            disabled={updating === user.id}
                            className="px-3 py-1.5 rounded-6 text-xs font-medium bg-amber-500 text-black hover:bg-amber-600 transition-colors flex items-center gap-1.5"
                          >
                            {updating === user.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                            Save
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="glass-card p-6 mt-6">
        <h2 className="text-sm font-bold text-white mb-4">System Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { label: "Platform", value: "TransitOps v1.0" },
            { label: "Framework", value: "Next.js 14" },
            { label: "Database", value: "PostgreSQL + Prisma" },
            { label: "Auth", value: "NextAuth.js JWT" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-600 mb-1">{label}</p>
              <p className="font-medium text-gray-300">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
