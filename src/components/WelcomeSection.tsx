import React from 'react';

export default function WelcomeSection() {
  return (
    <section className="mb-10 animate-fade-in">
      <div className="bg-gradient-to-br from-blue-50/80 via-white/80 to-blue-100/80 border border-blue-200/60 rounded-2xl shadow-xl px-10 py-8 flex items-center gap-7 backdrop-blur-2xl">
        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-200/40 to-blue-100/30">
          <svg className="w-9 h-9 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-blue-900 mb-1 tracking-tight">Welcome back, Admin!</h2>
          <p className="text-blue-600 text-lg">Here's a quick overview of your dashboard. Start managing your society with style!</p>
        </div>
      </div>
    </section>
  );
} 