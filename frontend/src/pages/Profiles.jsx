import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_INFO = {
  superadmin: {
    label: 'Super Admin',
    badge: 'bg-purple-100 text-purple-900 border border-purple-300',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  admin: {
    label: 'Office Admin',
    badge: 'bg-[#5c292c]/10 text-[#5c292c] border border-[#5c292c]/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  ulthurai: {
    label: 'Ulthurai',
    badge: 'bg-amber-100 text-amber-900 border border-amber-300',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }
};

export default function Profiles() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'admin'
  });
  const [modalError, setModalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Access control
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      alert('Access restricted. Only Super Admin can manage staff profiles & roles.');
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load staff profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setModalForm({
      name: '',
      username: '',
      password: '',
      role: 'admin'
    });
    setModalError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setModalForm({
      name: u.name,
      username: u.username,
      password: '', // blank keeps current password
      role: u.role
    });
    setModalError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!modalForm.name.trim()) {
      setModalError('Full Name is required');
      return;
    }

    if (!editingUser) {
      if (!modalForm.username.trim()) {
        setModalError('Username is required');
        return;
      }
      if (!modalForm.password.trim() || modalForm.password.length < 4) {
        setModalError('Password must be at least 4 characters');
        return;
      }
    } else {
      if (modalForm.password && modalForm.password.length < 4) {
        setModalError('Password must be at least 4 characters');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        const payload = {
          name: modalForm.name.trim(),
          role: modalForm.role
        };
        if (modalForm.password.trim()) {
          payload.password = modalForm.password.trim();
        }
        await api.updateUser(editingUser.id, payload);
      } else {
        await api.createUser({
          name: modalForm.name.trim(),
          username: modalForm.username.trim().toLowerCase(),
          password: modalForm.password.trim(),
          role: modalForm.role
        });
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own active Super Admin account.');
      return;
    }

    const confirmed = window.confirm(
      `Delete profile "${u.name}" (${u.username})?`
    );
    if (!confirmed) return;

    try {
      await api.deleteUser(u.id);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user: ' + (err.message || 'Error'));
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const countByRole = (role) => users.filter((u) => u.role === role).length;

  return (
    <div className="min-h-screen bg-[#faf8f7] p-6 md:p-10 font-barlow relative z-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                to="/dashboard"
                className="text-[#5c292c] hover:underline font-semibold text-xs flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-[#ebdccb] shadow-sm transition-all"
              >
                ← Back to Dashboard
              </Link>
              <span className="text-xs bg-[#5c292c]/10 text-[#5c292c] font-bold px-2.5 py-0.5 rounded-full">
                Super Admin
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#5c292c] tracking-tight">
              Staff Profiles & Roles
            </h1>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 bg-[#5c292c] hover:bg-[#482022] text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-md hover:shadow-lg transition-all self-start sm:self-auto shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add Staff Profile
          </button>
        </div>

        {/* Role Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-4 rounded-[18px] border border-[#ebdccb] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7f1e5] flex items-center justify-center text-[#5c292c] font-bold shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Total Staff</p>
              <p className="text-xl font-bold text-[#5c292c]">{users.length}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[18px] border border-purple-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold shrink-0">
              {ROLE_INFO.superadmin.icon}
            </div>
            <div>
              <p className="text-[11px] text-purple-700 font-medium">Super Admin</p>
              <p className="text-xl font-bold text-purple-900">{countByRole('superadmin')}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[18px] border border-[#e6d0bf] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#faf3ee] flex items-center justify-center text-[#5c292c] font-bold shrink-0">
              {ROLE_INFO.admin.icon}
            </div>
            <div>
              <p className="text-[11px] text-[#7d5658] font-medium">Office Admin</p>
              <p className="text-xl font-bold text-[#5c292c]">{countByRole('admin')}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[18px] border border-amber-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold shrink-0">
              {ROLE_INFO.ulthurai.icon}
            </div>
            <div>
              <p className="text-[11px] text-amber-700 font-medium">Ulthurai</p>
              <p className="text-xl font-bold text-amber-900">{countByRole('ulthurai')}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-[20px] border border-[#ebdccb] p-3 sm:p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search staff or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[38px] pl-9 pr-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c9186]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'superadmin', label: 'Super Admin' },
              { id: 'admin', label: 'Office Admin' },
              { id: 'ulthurai', label: 'Ulthurai' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  roleFilter === tab.id
                    ? 'bg-[#5c292c] text-white shadow-sm'
                    : 'bg-[#faf8f7] text-gray-600 hover:bg-[#ede5dc]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Profiles Table */}
        {loading ? (
          <div className="bg-white rounded-[20px] border border-[#ebdccb] p-10 text-center text-gray-500 font-medium">
            Loading staff profiles...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-[20px] text-center">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#ebdccb] p-10 text-center text-gray-500 font-medium">
            No staff profiles found.
          </div>
        ) : (
          <div>
            {/* Mobile View: Vertical Stacked Cards (Zero horizontal scroll) */}
            <div className="md:hidden flex flex-col gap-3">
              {filteredUsers.map((u) => {
                const roleMeta = ROLE_INFO[u.role] || {
                  label: u.role,
                  badge: 'bg-gray-100 text-gray-800'
                };
                const isSelf = u.id === currentUser?.id;

                return (
                  <div key={u.id} className="bg-white rounded-[20px] border border-[#ebdccb] p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.2 rounded-full border border-green-200 shrink-0">
                                You
                              </span>
                            )}
                          </p>
                          <span className="inline-block bg-[#f7f1e5] px-2 py-0.5 rounded text-[11px] font-mono text-[#5c292c] font-bold mt-0.5">
                            @{u.username}
                          </span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${roleMeta.badge}`}>
                        {roleMeta.icon}
                        {roleMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f0e6dc] text-xs">
                      <span className="text-gray-500 text-[11px]">
                        Joined {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Default'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-3 py-1 text-xs font-semibold text-[#5c292c] hover:bg-[#5c292c]/10 rounded-full border border-[#ebdccb] transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isSelf}
                          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                            isSelf
                              ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50 border-red-200'
                          }`}
                          title={isSelf ? 'Cannot delete your active account' : 'Delete user'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Data Table */}
            <div className="hidden md:block bg-white rounded-[22px] border border-[#ebdccb] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f7f1e5] border-b border-[#ebdccb] text-[#5c292c] text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-6">Staff Member</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e6dc]">
                  {filteredUsers.map((u) => {
                    const roleMeta = ROLE_INFO[u.role] || {
                      label: u.role,
                      badge: 'bg-gray-100 text-gray-800'
                    };
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#faf6f0] transition-colors">
                        {/* Name */}
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#5c292c] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.2 rounded-full border border-green-200">
                                    You
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3.5 px-4 font-mono text-xs text-[#5c292c] font-bold">
                          <span className="bg-[#f7f1e5] px-2.5 py-1 rounded-md border border-[#ebdccb]">
                            {u.username}
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${roleMeta.badge}`}>
                            {roleMeta.icon}
                            {roleMeta.label}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Default'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="px-3 py-1 text-xs font-semibold text-[#5c292c] hover:bg-[#5c292c]/10 rounded-full border border-[#ebdccb] transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={isSelf}
                              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                                isSelf
                                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                  : 'text-red-600 hover:bg-red-50 border-red-200'
                              }`}
                              title={isSelf ? 'Cannot delete your active account' : 'Delete user'}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-y-auto animate-fade-in">
          <div className="relative shadow-2xl flex flex-col p-6 bg-[#f7f1e5] border border-[#ebdccb] rounded-[26px] max-w-[480px] w-full my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
              <h3 className="text-lg font-bold text-[#5c292c] font-barlow tracking-tight">
                {editingUser ? `Edit Staff Profile` : 'Add Staff Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8c8075] hover:text-[#5c292c] hover:bg-black/5 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-3.5 mt-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Somasundaram"
                  value={modalForm.name}
                  onChange={(e) => setModalForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
                />
              </div>

              {/* Username (Login ID) */}
              <div>
                <label className="block text-[#5c292c] font-bold text-xs mb-1 px-1">
                  Username (Login ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. pooja_staff"
                  value={modalForm.username}
                  onChange={(e) => setModalForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  disabled={!!editingUser}
                  required
                  className={`h-[38px] px-4 rounded-full border border-[#e2d8cb] font-barlow text-[13.5px] w-full shadow-sm ${
                    editingUser
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c]'
                  }`}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between px-1 mb-1">
                  <label className="block text-[#5c292c] font-bold text-xs">
                    {editingUser ? 'Reset Password (optional)' : 'Password'} <span className="text-red-500">{!editingUser ? '*' : ''}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#5c292c] font-semibold hover:underline"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={editingUser ? 'Leave blank to keep existing' : 'Enter password'}
                  value={modalForm.password}
                  onChange={(e) => setModalForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editingUser}
                  className="h-[38px] px-4 rounded-full border border-[#e2d8cb] bg-white font-barlow text-[13.5px] text-gray-800 placeholder-[#9c9186] focus:outline-none focus:border-[#5c292c] focus:ring-1 focus:ring-[#5c292c] w-full shadow-sm"
                />
              </div>

              {/* Role Selection: Crisp 3-Button Selector */}
              <div>
                <label className="block text-[#5c292c] font-bold text-xs mb-1.5 px-1">
                  Role <span className="text-red-500">*</span>
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'superadmin', label: 'Super Admin' },
                    { id: 'admin', label: 'Office Admin' },
                    { id: 'ulthurai', label: 'Ulthurai' }
                  ].map((r) => {
                    const isSelected = modalForm.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setModalForm((f) => ({ ...f, role: r.id }))}
                        className={`h-[38px] rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#5c292c] text-white border-[#5c292c] shadow-sm'
                            : 'bg-white text-gray-700 border-[#ebdccb] hover:bg-[#faf6f0]'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Notice */}
              {modalError && (
                <div className="bg-red-50 text-red-700 text-xs py-2 px-3.5 rounded-full border border-red-200 text-center font-medium">
                  {modalError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ebdccb] mt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full border border-[#5c292c] text-[#5c292c] font-semibold text-xs bg-white hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-full bg-[#5c292c] hover:bg-[#482022] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (editingUser ? 'Save Changes' : 'Create Profile')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
