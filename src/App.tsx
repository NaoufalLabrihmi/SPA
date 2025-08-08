import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import StatCard from './components/StatCard';
import ChartSection from './components/ChartSection';
import Employees from './pages/Employees';
import EmployeeEdit from './components/EmployeeEdit';
import EmployeeErklaerungFormEdit from './components/EmployeeErklaerungFormEdit';
import ArbeitsvertragPage from './pages/Arbeitsvertrag';
import EinkommensbescheinigungPage from './pages/Einkommensbescheinigung';
import CompanyEdit from './pages/CompanyEdit';
import { login, getDashboardStats } from './lib/api';
import UsersTable from './components/UsersTable';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { FaUsers, FaUserShield, FaUserTie, FaUserClock, FaUserCheck, FaUserAlt } from 'react-icons/fa';
import { useState } from 'react';

const stats = [
  { label: 'Total Users', value: '1,234' },
  { label: 'Active Projects', value: '87' },
  { label: 'Revenue', value: '$45,000' },
  { label: 'Growth', value: '+12%' },
];

const areaChartData = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 180 },
  { month: 'Mar', value: 160 },
  { month: 'Apr', value: 220 },
  { month: 'May', value: 260 },
  { month: 'Jun', value: 300 },
  { month: 'Jul', value: 350 },
  { month: 'Aug', value: 400 },
  { month: 'Sep', value: 420 },
  { month: 'Oct', value: 480 },
  { month: 'Nov', value: 500 },
  { month: 'Dec', value: 600 },
];

const donutChartData = [
  { label: 'Active', value: 60, color: '#38bdf8' },
  { label: 'On Leave', value: 25, color: '#0ea5e9' },
  { label: 'Inactive', value: 10, color: '#818cf8' },
  { label: 'Contract', value: 5, color: '#a5b4fc' },
];

function LoginModal({ onLogin }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [resetToken, setResetToken] = React.useState<string | null>(null);
  const navigate = useNavigate();
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) setResetToken(token);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login({ username, password });
      localStorage.setItem('token', res.access_token);
      localStorage.setItem('role', res.role);
      localStorage.setItem('username', res.username);
      onLogin();
      navigate('/');
    } catch (err) {
      setError('Login fehlgeschlagen');
    }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/40 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs border border-blue-100 flex flex-col gap-4 animate-fade-in">
        <h3 className="text-xl font-extrabold text-blue-900 mb-2 text-center">Login</h3>
        <input type="text" placeholder="Username or Email" value={username} onChange={e => setUsername(e.target.value)} className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" required />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base" disabled={loading}>{loading ? '...' : 'Login'}</button>
        <button type="button" className="text-blue-500 underline mt-2" onClick={() => setForgotOpen(true)}>
          Forgot Password?
        </button>
      </form>
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
      {resetToken && <ResetPasswordModal token={resetToken} onClose={() => { setResetToken(null); window.history.replaceState({}, document.title, window.location.pathname); }} />}
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError('Failed to load statistics'))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="p-8 text-blue-400 text-xl">Loading statistics...</div>;
  if (error) return <div className="p-8 text-red-500 text-xl">{error}</div>;
  const statCards = [
    { label: 'Total Users', value: stats.total_users, icon: <FaUsers className="text-blue-500 w-6 h-6" /> },
    { label: 'Admins', value: stats.total_admins, icon: <FaUserShield className="text-cyan-500 w-6 h-6" /> },
    { label: 'Employees', value: stats.total_employees, icon: <FaUserTie className="text-blue-700 w-6 h-6" /> },
    { label: 'Minijobs', value: stats.total_minijobs, icon: <FaUserClock className="text-green-500 w-6 h-6" /> },
    { label: 'Fulltime', value: stats.total_fulltime, icon: <FaUserCheck className="text-indigo-500 w-6 h-6" /> },
    { label: 'Parttime', value: stats.total_parttime, icon: <FaUserAlt className="text-pink-500 w-6 h-6" /> },
  ];
  const contractBarData = [
    { label: 'Minijobs', value: stats.total_minijobs },
    { label: 'Fulltime', value: stats.total_fulltime },
    { label: 'Parttime', value: stats.total_parttime },
  ];
  const userBarData = [
    { label: 'Users', value: stats.total_users },
    { label: 'Admins', value: stats.total_admins },
    { label: 'Employees', value: stats.total_employees },
  ];
  return (
    <main className="flex-1 p-4 md:p-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mt-2 md:mt-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center justify-center bg-white rounded-xl shadow border border-blue-100 px-2 py-3 md:px-3 md:py-4 min-w-[90px]">
            <div>{stat.icon}</div>
            <div className="text-lg md:text-xl font-bold text-blue-900">{stat.value}</div>
            <div className="text-xs md:text-sm text-blue-400 font-semibold text-center">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 flex flex-col items-center min-h-[320px]">
          <div className="font-bold text-blue-900 mb-4 text-lg">Employee Contract Types</div>
          <ChartSection barData={contractBarData} />
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 flex flex-col items-center min-h-[320px]">
          <div className="font-bold text-blue-900 mb-4 text-lg">Users / Admins / Employees</div>
          <ChartSection barData={userBarData} />
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [authed, setAuthed] = React.useState(!!localStorage.getItem('token'));
  const role = localStorage.getItem('role');
  if (!authed) {
    return <LoginModal onLogin={() => window.location.reload()} />;
  }
  return (
    <div className="min-h-screen flex flex-col bg-blue-50 w-full">
      <Header />
      <div className="flex-1 flex flex-col w-full px-2 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees/*" element={<Employees />} />
          <Route path="/employees/:id/edit" element={<EmployeeEdit />} />
          <Route path="/employees/:id/erklaerung-form" element={<EmployeeErklaerungFormEdit />} />
          <Route path="/arbeitsvertrag" element={<ArbeitsvertragPage />} />
          <Route path="/einkommensbescheinigung" element={<EinkommensbescheinigungPage />} />
          <Route path="/company" element={<CompanyEdit />} />
          {role === 'admin' && <Route path="/users" element={<UsersTable />} />}
        </Routes>
      </div>
    </div>
  );
}
