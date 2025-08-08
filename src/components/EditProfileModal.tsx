import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';
import { jwtDecode } from 'jwt-decode';

export default function EditProfileModal({ open, onClose }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const role = localStorage.getItem('role');
  let id = localStorage.getItem('user_id');
  // If not present, decode from JWT
  if (!id) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = jwtDecode(token) as any;
        id = payload.user_id || payload.sub || '';
        if (id) localStorage.setItem('user_id', id);
      } catch {}
    }
  }

  useEffect(() => {
    if (open) {
      setForm({
        username: localStorage.getItem('username') || '',
        email: localStorage.getItem('email') || '',
        password: '',
        role: localStorage.getItem('role') || 'user',
      });
    }
  }, [open]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const res = await axios.patch(`${API_BASE_URL}/users/${id}`, payload);
      if (payload.username) localStorage.setItem('username', payload.username);
      if (payload.role) localStorage.setItem('role', payload.role);
      if (payload.email) localStorage.setItem('email', payload.email);
      setToast({ type: 'success', message: 'Profile updated!' });
      setTimeout(() => { setToast(null); onClose(); window.location.reload(); }, 1200);
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.detail || 'Update failed' });
    }
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in" style={{ minHeight: '100vh' }}>
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white/90 via-blue-50/90 to-cyan-50/90 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-blue-100 flex flex-col gap-6 animate-fade-in relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-blue-400 hover:text-blue-700 text-2xl">×</button>
        <h3 className="text-xl font-extrabold text-blue-900 mb-2 text-center">Edit Profile</h3>
        <input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
        <input name="password" value={form.password} onChange={handleChange} placeholder="New Password (leave blank to keep)" type="password" className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" />
        {role === 'admin' && (
          <select name="role" value={form.role} onChange={handleChange} className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base" disabled={loading}>Save</button>
        {toast && (
          <div className={`px-4 py-2 rounded-xl shadow-xl font-bold text-white text-base ${toast.type === 'success' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-pink-400'} animate-fade-in`}>{toast.message}</div>
        )}
      </form>
    </div>
  );
} 