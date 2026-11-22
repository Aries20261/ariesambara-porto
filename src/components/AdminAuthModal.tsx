import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (session: { token: string; username: string; expiresAt: number }) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingStatus(true);
    setError(null);

    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data: { needsSetup?: boolean }) => {
        if (!cancelled) {
          setNeedsSetup(Boolean(data?.needsSetup));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Gagal memeriksa status autentikasi server.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStatus(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Username dan kata sandi wajib diisi.');
      return;
    }

    if (needsSetup) {
      if (password.length < 6) {
        setError('Kata sandi minimal harus 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi tidak cocok.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = needsSetup ? '/api/auth/setup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const payload = (await res.json()) as {
        token?: string;
        username?: string;
        expiresAt?: number;
        error?: string;
      };

      if (!res.ok || !payload.token || !payload.username) {
        setError(payload.error || 'Autentikasi gagal. Periksa kembali kredensial Anda.');
        return;
      }

      onAuthenticated({
        token: payload.token,
        username: payload.username,
        expiresAt: payload.expiresAt || Date.now() + 12 * 60 * 60 * 1000,
      });
    } catch {
      setError('Tidak dapat terhubung ke server autentikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#111418] border border-[rgba(212,175,55,0.35)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(212,175,55,0.2)] bg-[#0A0C0E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#181C22] border border-[rgba(212,175,55,0.35)] flex items-center justify-center text-[#D4AF37]">
              {needsSetup ? <KeyRound className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h2 id="admin-auth-title" className="font-display text-base font-bold text-[#F3E5AB]">
                {needsSetup ? 'Pengaturan Awal Admin' : 'Masuk Panel Admin'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {needsSetup
                  ? 'Buat akun admin pertama sebelum mengelola CMS'
                  : 'Verifikasi kredensial untuk mengakses Studio CMS'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog login admin"
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {loadingStatus ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Memeriksa status autentikasi...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {needsSetup && (
                <div className="p-3.5 rounded-lg bg-[#181C22] border border-[rgba(212,175,55,0.25)] text-xs text-neutral-300 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>
                    Variabel <code className="text-[#F3E5AB]">ADMIN_PASSWORD</code> belum disetel di server. Tetapkan kata sandi admin awal di sini, atau atur <code className="text-[#F3E5AB]">ADMIN_USERNAME</code> &amp; <code className="text-[#F3E5AB]">ADMIN_PASSWORD</code> pada Environment Variables Vercel / Secrets.
                  </span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="admin-username" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Username Admin
                </label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.25)] focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder:text-neutral-500"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-xs font-medium text-neutral-300 mb-1.5">
                  {needsSetup ? 'Kata Sandi Admin Baru' : 'Kata Sandi'}
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={needsSetup ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.25)] focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-[#F3E5AB] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {needsSetup && (
                <div>
                  <label htmlFor="admin-password-confirm" className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    id="admin-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0C0E] border border-[rgba(212,175,55,0.25)] focus:border-[#D4AF37] focus:outline-none text-sm text-white placeholder:text-neutral-500"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 rounded-lg border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-lg gold-action-btn text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? 'Memverifikasi...'
                    : needsSetup
                    ? 'Simpan & Masuk CMS'
                    : 'Masuk ke CMS'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
