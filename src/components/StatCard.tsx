import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="relative bg-gradient-to-br from-blue-50/80 via-white/80 to-blue-100/80 border border-blue-200/60 rounded-2xl shadow-xl p-8 flex flex-col items-center overflow-hidden backdrop-blur-2xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in group">
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-200/30 to-blue-100/30 rounded-full blur-xl opacity-60 group-hover:scale-110 transition-transform" />
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-200/40 to-blue-100/30 mb-3">
        <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
      </div>
      <div className="text-2xl font-bold text-blue-900 mb-1 tracking-tight">{value}</div>
      <div className="text-sm text-blue-500 uppercase tracking-wide font-semibold">{label}</div>
    </div>
  );
} 