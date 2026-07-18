import React, { useState } from 'react';
import { Users, ShieldCheck, UserMinus, UserCheck, AlertCircle, Trash2, Search } from 'lucide-react';
import { User } from '../types.js';

interface AdminCustomersViewProps {
  users: User[];
  currentUser: User;
  token: string;
  onRefresh: () => void;
}

export default function AdminCustomersView({
  users,
  currentUser,
  token,
  onRefresh,
}: AdminCustomersViewProps) {
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleToggleSuspendUser = async (targetUser: User) => {
    setError(null);
    const updatedStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: updatedStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update account authorization parameters.');
      }
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Client Directory & Access</h2>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Configure workspace roles & authorizations</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="p-4">Client Identity</th>
                <th className="p-4">Contact Email</th>
                <th className="p-4">Mobile Specs</th>
                <th className="p-4">Workspace Role</th>
                <th className="p-4">Access Status</th>
                <th className="p-4 text-right font-mono">Authorization settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/55">
                  <td className="p-4">
                    <span className="font-bold text-slate-850 dark:text-white block">{u.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono">ID: {u.id}</span>
                  </td>
                  <td className="p-4 font-mono font-medium">{u.email}</td>
                  <td className="p-4 font-mono">{u.phone || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                        : u.role === 'driver' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.id !== currentUser.id ? (
                      <button
                        onClick={() => handleToggleSuspendUser(u)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 ml-auto ${
                          u.status === 'active'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.status === 'active' ? (
                          <>
                            <UserMinus size={11} /> Suspend Workspace
                          </>
                        ) : (
                          <>
                            <UserCheck size={11} /> Authorize Active
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase font-mono px-3">Active Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
