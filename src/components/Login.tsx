import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, Wallet, Landmark } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { username: string }) => void;
  isLocalStorageMode?: boolean;
}

export default function Login({ onLoginSuccess, isLocalStorageMode }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    if (isLocalStorageMode) {
      setTimeout(() => {
        if (username === 'adminry' && password === 'adminry') {
          onLoginSuccess({ username: 'adminry' });
        } else {
          setError('Username atau password salah.');
        }
        setLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Username atau password salah.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Koneksi internet bermasalah. Pastikan server aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"></div>
      
      {/* Dynamic graphic shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8 relative z-10"
      >
        <div className="flex flex-col items-center justify-center text-center pb-8">
          <div className="bg-emerald-500 text-white p-3.5 rounded-xl shadow-lg shadow-emerald-500/25 mb-4">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">WalletKami</h1>
          <p className="text-slate-500 mt-1.5 text-sm max-w-[280px]">
            Akun Bersama • Real-Time sheets database sync
          </p>
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wider uppercase rounded-full border border-emerald-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            {isLocalStorageMode ? "Mode Mandiri (Netlify / Static Ready)" : "Mode Server Aktif"}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 text-rose-600 text-xs py-3 px-4 rounded-xl border border-rose-100 font-medium flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                id="username-input"
                type="text"
                placeholder="Masukkan username (contoh: adminry)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10.5 pr-4 py-3 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10.5 pr-11 py-3 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all placeholder:text-slate-400 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all mt-3 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Masuk ke Tracker...
              </>
            ) : (
              'Masuk Akun'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-xs text-slate-400 font-medium">
          <div>Gunakan Akun Bawaan:</div>
          <div className="flex bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 gap-4">
            <span>Username: <strong className="text-slate-700">adminry</strong></span>
            <span className="text-slate-200">|</span>
            <span>Password: <strong className="text-slate-700">adminry</strong></span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
