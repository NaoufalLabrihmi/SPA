import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [modal, setModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/users`)
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({ ...user, password: '' });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const saveEdit = async () => {
    try {
      await axios.patch(`${API_BASE_URL}/users/${editingId}`, editForm);
      setToast({ message: 'User updated!', type: 'success' });
      setEditingId(null);
      setEditForm({});
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.detail || 'Update failed', type: 'error' });
    }
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      setToast({ message: 'User deleted!', type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.detail || 'Delete failed', type: 'error' });
    }
  };
  const openAdd = () => {
    setNewUser({ username: '', email: '', password: '', role: 'user' });
    setModal(true);
  };
  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUser(u => ({ ...u, [e.target.name]: e.target.value }));
  };
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/users`, newUser);
      setToast({ message: 'User created!', type: 'success' });
      setModal(false);
      fetchUsers();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.detail || 'Create failed', type: 'error' });
    }
  };
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const username = localStorage.getItem('username');

  return (
    <div className="w-full my-4 px-2 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4 z-10 relative px-1">
        <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">User Management</span>
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base"
        >
          <FaPlus /> Add User
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-blue-100 shadow-2xl bg-white/80 backdrop-blur-xl">
        <table className="w-full text-base">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100/80 via-cyan-100/80 to-blue-50/80 text-blue-800 text-sm">
              <th className="px-3 py-2 text-left font-bold">#</th>
              <th className="px-3 py-2 text-left font-bold">Username</th>
              <th className="px-3 py-2 text-left font-bold">Email</th>
              <th className="px-3 py-2 text-left font-bold">Role</th>
              <th className="px-3 py-2 text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-blue-400 animate-pulse text-base">Loading...</td></tr>
            ) : users.filter((u: any) => u.username !== username).length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-blue-400 text-base">No users found.</td></tr>
            ) : users.filter((u: any) => u.username !== username).map((u: any, idx: number) => (
              <tr key={u.id} className="group even:bg-blue-50/60 odd:bg-white/80 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 rounded-2xl">
                <td className="px-3 py-2 text-blue-900 font-bold text-sm">{idx + 1}</td>
                {editingId === u.id ? (
                  <>
                    <td className="px-3 py-2"><input name="username" value={editForm.username} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="px-3 py-2"><input name="email" value={editForm.email} onChange={handleEditChange} className="border rounded px-2 py-1 w-full" /></td>
                    <td className="px-3 py-2">
                      <select name="role" value={editForm.role} onChange={handleEditChange} className="border rounded px-2 py-1 w-full">
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button onClick={saveEdit} className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow hover:scale-110 transition flex items-center justify-center"><FaCheck /></button>
                      <button onClick={cancelEdit} className="p-2 rounded-xl bg-gray-200 text-blue-700 shadow hover:bg-gray-300 transition flex items-center justify-center"><FaTimes /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">{u.username}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2 flex gap-2">
                      <button onClick={() => handleEdit(u)} className="p-2 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-700 shadow hover:scale-110 transition flex items-center justify-center"><FaEdit /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-xl bg-gradient-to-r from-red-100 to-pink-100 text-red-600 shadow hover:scale-110 transition flex items-center justify-center"><FaTrash /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Add User Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/40 backdrop-blur-xl animate-fade-in">
          <form onSubmit={handleAdd} className="bg-gradient-to-br from-white/90 via-blue-50/90 to-cyan-50/90 rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-blue-100 flex flex-col gap-6 animate-fade-in relative">
            <button type="button" onClick={() => setModal(false)} className="absolute top-4 right-4 text-blue-400 hover:text-blue-700 text-2xl"><FaTimes /></button>
            <h3 className="text-xl font-extrabold text-blue-900 mb-2 text-center">Add User</h3>
            <input name="username" value={newUser.username} onChange={handleNewChange} placeholder="Username" className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
            <input name="email" value={newUser.email} onChange={handleNewChange} placeholder="Email" className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
            <input name="password" value={newUser.password} onChange={handleNewChange} placeholder="Password" type="password" className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
            <select name="role" value={newUser.role} onChange={handleNewChange} className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base">Create</button>
          </form>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-white text-base ${toast.type === 'success' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-pink-400'} animate-fade-in`} style={{ boxShadow: '0 4px 24px 0 rgba(56,189,248,0.10)' }}>{toast.message}</div>
      )}
    </div>
  );
} 