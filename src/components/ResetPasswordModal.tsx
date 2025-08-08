import React, { useState } from 'react';
import { resetPassword } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordModal({ token, onClose }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  if (!token) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await resetPassword(token, password);
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        onClose();
        navigate('/');
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to reset password.');
    }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white/90 via-blue-50/90 to-cyan-50/90 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-blue-100 flex flex-col gap-6 animate-fade-in relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-blue-400 hover:text-blue-700 text-2xl">×</button>
        <h3 className="text-xl font-extrabold text-blue-900 mb-2 text-center">Reset Password</h3>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
        <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base" disabled={loading}>Reset Password</button>
        {message && <div className="px-4 py-2 rounded-xl shadow-xl font-bold text-green-700 bg-green-100 animate-fade-in">{message}</div>}
        {error && <div className="px-4 py-2 rounded-xl shadow-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-400 animate-fade-in">{error}</div>}
      </form>
    </div>
  );
} 