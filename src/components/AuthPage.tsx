import React, { useState } from 'react';
import {
  School,
  Lock,
  User,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { SchoolAccount } from '../types';
import {
  loginSchool,
  registerSchool,
  checkSchoolActivationStatus,
  ADMIN_WA_NUMBER,
  ADMIN_WA_LINK,
} from '../lib/supabaseClient';

interface AuthPageProps {
  onLoginSuccess: (account: SchoolAccount) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // State Form Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // State Form Registrasi
  const [regData, setRegData] = useState({
    npsn: '',
    namaSekolah: '',
    jenjang: 'SD' as 'SD' | 'SMP' | 'SMA' | 'SMK',
    kecamatan: '',
    kabupaten: '',
    provinsi: 'Banten',
    alamat: '',
    namaKepsek: '',
    nipKepsek: '',
    namaBendahara: '',
    nipBendahara: '',
    noWa: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Modal State & Status Check
  const [pendingAccountModal, setPendingAccountModal] = useState<SchoolAccount | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // ==========================================
  // HANDLER LOGIN
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      showToast('Mohon masukkan NPSN / Email dan Password.', 'error');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginSchool(loginIdentifier, loginPassword);
      if (res.success && res.account) {
        showToast(`Selamat datang kembali, ${res.account.namaSekolah}!`, 'success');
        onLoginSuccess(res.account);
      } else {
        if (res.status === 'pending' && res.account) {
          setPendingAccountModal(res.account);
          showToast(
            `Akun belum aktif! Anda belum dapat login sebelum diaktifkan oleh Admin di database Supabase. Hubungi WhatsApp ${ADMIN_WA_NUMBER}.`,
            'error'
          );
        } else if (res.status === 'expired') {
          showToast(res.message, 'error');
        } else {
          showToast(res.message || 'Login gagal. Periksa kembali data Anda.', 'error');
        }
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menghubungi server auth.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ==========================================
  // HANDLER REGISTRASI SEKOLAH BARU
  // ==========================================
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regData.npsn || regData.npsn.length < 8) {
      showToast('NPSN harus berupa 8 digit angka valid.', 'error');
      return;
    }
    if (!regData.namaSekolah.trim()) {
      showToast('Mohon masukkan nama satuan pendidikan / sekolah.', 'error');
      return;
    }
    if (!regData.email.includes('@')) {
      showToast('Mohon masukkan alamat email resmi sekolah yang valid.', 'error');
      return;
    }
    if (!regData.password || regData.password.length < 6) {
      showToast('Password minimal harus 6 karakter.', 'error');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      showToast('Konfirmasi password tidak cocok dengan password.', 'error');
      return;
    }
    if (!regData.noWa.trim()) {
      showToast('Mohon sertakan nomor WhatsApp untuk konfirmasi aktivasi akun.', 'error');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await registerSchool({
        npsn: regData.npsn,
        namaSekolah: regData.namaSekolah,
        jenjang: regData.jenjang,
        kecamatan: regData.kecamatan,
        kabupaten: regData.kabupaten,
        provinsi: regData.provinsi,
        alamat: regData.alamat,
        namaKepsek: regData.namaKepsek,
        nipKepsek: regData.nipKepsek,
        namaBendahara: regData.namaBendahara,
        nipBendahara: regData.nipBendahara,
        noWa: regData.noWa,
        email: regData.email,
        password: regData.password,
      });

      if (res.success && res.account) {
        showToast(
          `Pendaftaran berhasil! Akun berstatus Pending. Silakan konfirmasi ke WhatsApp Admin (${ADMIN_WA_NUMBER}) untuk aktivasi.`,
          'info'
        );
        setPendingAccountModal(res.account);
        setActiveTab('login');
        setLoginIdentifier(res.account.npsn);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast('Gagal mendaftar akun sekolah.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handler Pengecekan Status Langsung ke Database Supabase
  const handleCheckSupabaseActivation = async (account: SchoolAccount) => {
    setIsCheckingStatus(true);
    try {
      const res = await checkSchoolActivationStatus(account.npsn);
      if (res.status === 'active' && res.account) {
        showToast('Alhamdulillah! Akun Anda telah diaktifkan oleh Admin di Supabase. Silakan login sekarang.', 'success');
        setPendingAccountModal(null);
        setActiveTab('login');
        setLoginIdentifier(res.account.npsn);
      } else if (res.status === 'not_found') {
        showToast(
          res.message || 'Data akun atau tabel sekolah tidak ditemukan di database Supabase (telah dihapus).',
          'error'
        );
        setPendingAccountModal(null);
      } else {
        showToast(
          `Status akun di Supabase masih: ${res.status.toUpperCase()}. Belum diaktifkan oleh Admin. Silakan hubungi WhatsApp ${ADMIN_WA_NUMBER}.`,
          'error'
        );
      }
    } catch (err) {
      showToast('Gagal memeriksa status ke database Supabase.', 'error');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#072449] flex flex-col justify-between relative overflow-x-hidden text-slate-100 font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#093262] via-[#072449] to-[#041731] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-96 bg-[#0b4382]/30 blur-3xl rounded-full pointer-events-none" />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div
          className={`w-full transition-all duration-200 bg-[#093262]/95 border border-[#0d417d] rounded-3xl shadow-2xl shadow-black/60 overflow-hidden backdrop-blur-xl ${
            activeTab === 'login' ? 'max-w-md' : 'max-w-3xl'
          }`}
        >
          {/* Header Card dengan Tab Navigators */}
          <div className="bg-[#072449]/70 p-6 sm:p-8 pb-4 border-b border-[#0d417d] text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-400/10">
              {activeTab === 'login' ? <Lock className="w-6 h-6" /> : <School className="w-6 h-6" />}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeTab === 'login' ? 'Masuk ke Akun Sekolah' : 'Pendaftaran Sekolah Baru'}
            </h2>
            <p className="text-xs text-blue-200/80 mt-1">
              {activeTab === 'login'
                ? 'Silakan masukkan NPSN dan kata sandi satuan pendidikan Anda.'
                : 'Lengkapi identitas resmi sekolah untuk membuat akun baru.'}
            </p>

            {/* Tab Navigators */}
            <div className="flex items-center p-1 bg-[#051c3a] border border-[#0d417d] rounded-2xl mt-5">
              <button
                type="button"
                id="tab-btn-login"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-[#0b4382] text-white shadow-lg border-b-2 border-amber-400'
                    : 'text-blue-200/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Sekolah</span>
              </button>

              <button
                type="button"
                id="tab-btn-register"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-[#0b4382] text-white shadow-lg border-b-2 border-amber-400'
                    : 'text-blue-200/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Daftar Sekolah</span>
              </button>
            </div>
          </div>

          {/* Form Content Body */}
          <div className="p-6 sm:p-8">
            {/* ========================================= */}
            {/* TAB 1: FORM LOGIN (FULL & BERSIH) */}
            {/* ========================================= */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Input NPSN / Email / Nama Sekolah */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-blue-200">
                    NPSN (8 Digit) / Email / Nama Sekolah <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="login-input-identifier"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Contoh: 20602599, SDN 1 CIBUNGUR, atau email..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-200">
                      Kata Sandi <span className="text-amber-400">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-blue-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-input-password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-white p-1 cursor-pointer"
                      title={showLoginPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoggingIn}
                  className="w-full py-3 mt-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#072449] font-black text-xs rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Akun Sekolah</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-3 border-t border-[#0d417d]">
                  <p className="text-xs text-blue-200/70">
                    Sekolah belum terdaftar?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Daftar akun di sini
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ========================================= */}
            {/* TAB 2: FORM REGISTRASI SEKOLAH BARU */}
            {/* ========================================= */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                {/* Banner Peringatan Pembayaran & Aktivasi WhatsApp */}
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-amber-300 text-xs uppercase tracking-wide">
                      Penting: Ketentuan Aktivasi Akun Sekolah
                    </p>
                    <p className="text-xs text-amber-100/95 leading-relaxed">
                      Setelah mendaftar, Anda <strong>wajib melakukan konfirmasi ke No. WhatsApp Admin ({ADMIN_WA_NUMBER})</strong> untuk membayar langganan dan aktivasi akun.
                    </p>
                    <p className="text-[11px] text-amber-200/90 font-medium">
                      ⚠️ Sebelum diaktifkan oleh Admin di database Supabase, sekolah terdaftar <strong>tidak bisa login</strong> ke sistem.
                    </p>
                  </div>
                </div>

                {/* Bagian 1: Identitas Satuan Pendidikan */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    1. Identitas Satuan Pendidikan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">
                        NPSN (8 Digit) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={regData.npsn}
                        onChange={(e) => setRegData({ ...regData, npsn: e.target.value.replace(/\D/g, '') })}
                        placeholder="Contoh: 20602599"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-blue-200">
                        Nama Lengkap Satuan Pendidikan <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regData.namaSekolah}
                        onChange={(e) => setRegData({ ...regData, namaSekolah: e.target.value })}
                        placeholder="Contoh: SDN 1 CIBUNGUR"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400 uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">Jenjang Pendidikan</label>
                      <select
                        value={regData.jenjang}
                        onChange={(e) => setRegData({ ...regData, jenjang: e.target.value as any })}
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="SD">Sekolah Dasar (SD)</option>
                        <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
                        <option value="SMA">Sekolah Menengah Atas (SMA)</option>
                        <option value="SMK">Sekolah Menengah Kejuruan (SMK)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">Kecamatan</label>
                      <input
                        type="text"
                        value={regData.kecamatan}
                        onChange={(e) => setRegData({ ...regData, kecamatan: e.target.value })}
                        placeholder="Contoh: Cigemblong"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">Kabupaten / Kota</label>
                      <input
                        type="text"
                        value={regData.kabupaten}
                        onChange={(e) => setRegData({ ...regData, kabupaten: e.target.value })}
                        placeholder="Contoh: Kab. Lebak"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Pejabat Satuan Pendidikan */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    2. Pejabat Satuan Pendidikan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">
                        Nama Kepala Sekolah
                      </label>
                      <input
                        type="text"
                        value={regData.namaKepsek}
                        onChange={(e) => setRegData({ ...regData, namaKepsek: e.target.value })}
                        placeholder="Contoh: KARNA, S.Pd"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">
                        Nama Bendahara BOSP
                      </label>
                      <input
                        type="text"
                        value={regData.namaBendahara}
                        onChange={(e) => setRegData({ ...regData, namaBendahara: e.target.value })}
                        placeholder="Contoh: SUHENDRI, S.Pd"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian 3: Akun Login & Kontak */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    3. Kredensial Akun Login & Kontak
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">
                        Email Resmi Sekolah <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        placeholder="Contoh: sdn1cibungur@gmail.com"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">
                        No. WhatsApp Pengelola <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regData.noWa}
                        onChange={(e) => setRegData({ ...regData, noWa: e.target.value })}
                        placeholder={`Contoh: ${ADMIN_WA_NUMBER}`}
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">
                        Password Baru <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-200">
                        Konfirmasi Password <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regData.confirmPassword}
                        onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                        placeholder="Ulangi password di atas"
                        className="w-full px-3 py-2 bg-[#051c3a] border border-[#0d417d] rounded-xl text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Register Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#0d417d]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs text-blue-200/70 hover:text-white"
                  >
                    Sudah punya akun? Masuk di sini
                  </button>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full sm:w-auto px-8 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#072449] font-black text-xs rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isRegistering ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mendaftarkan Sekolah...</span>
                      </>
                    ) : (
                      <>
                        <span>Daftarkan Sekolah Saya</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="relative z-10 py-5 px-4 text-center text-xs text-blue-200/70 border-t border-[#0d417d]/40">
        <p>© 2026 Sistem Administrasi SPJBOSP - AxendStudio</p>
      </footer>

      {/* ========================================================= */}
      {/* MODAL: STATUS AKUN MENUNGGU AKTIVASI (PENDING) */}
      {/* ========================================================= */}
      {pendingAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Status: Menunggu Pembayaran & Aktivasi Admin
              </span>
              <h3 className="text-lg font-black text-white mt-2">
                {pendingAccountModal.namaSekolah}
              </h3>
              <p className="text-xs text-slate-300">
                NPSN: <span className="font-mono text-amber-300 font-bold">{pendingAccountModal.npsn}</span> • Email: {pendingAccountModal.email}
              </p>
            </div>

            <div className="bg-slate-950/80 p-4.5 rounded-2xl border border-slate-800 text-xs space-y-3 text-slate-200 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-rose-400 font-black text-sm">⛔</span>
                <p className="font-semibold text-rose-200">
                  Sebelum diaktifkan oleh Admin di database Supabase, sekolah terdaftar <strong>tidak bisa login</strong> ke sistem.
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div className="space-y-1.5 text-slate-300">
                <p>
                  Untuk mengaktifkan akun dan mendapatkan hak akses penuh, silakan lakukan pembayaran langganan lalu kirim konfirmasi ke WhatsApp Admin:
                </p>
                <div className="mt-2 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">WhatsApp Resmi Admin:</span>
                      <strong className="text-sm font-mono text-white font-extrabold">{ADMIN_WA_NUMBER}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-2.5 pt-1">
              {/* Tombol Hubungi WhatsApp Admin */}
              <a
                href={`https://wa.me/${ADMIN_WA_LINK}?text=Halo%20Admin%20SPJ%20BOSP,%20saya%20telah%20mendaftar%20akun%20untuk%20sekolah:%0A-%20Nama%20Sekolah:%20${encodeURIComponent(
                  pendingAccountModal.namaSekolah
                )}%0A-%20NPSN:%20${pendingAccountModal.npsn}%0A-%20Email:%20${encodeURIComponent(
                  pendingAccountModal.email
                )}%0A-%20No.%20WhatsApp:%20${encodeURIComponent(
                  pendingAccountModal.noWa
                )}%0A%0AMohon%20informasi%20pembayaran%20langganan%20dan%20aktivasi%20akun%20saya%20di%20database%20Supabase.%20Terima%20kasih.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Konfirmasi Pembayaran ke WhatsApp ({ADMIN_WA_NUMBER})</span>
              </a>

              {/* Tombol Cek Status Aktivasi di Supabase */}
              <button
                type="button"
                onClick={() => handleCheckSupabaseActivation(pendingAccountModal)}
                disabled={isCheckingStatus}
                className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/40 active:bg-blue-600/50 text-blue-300 border border-blue-500/30 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>{isCheckingStatus ? 'Memeriksa Database Supabase...' : 'Cek Status Aktivasi di Database Supabase'}</span>
              </button>

              {/* Tombol Tutup */}
              <button
                type="button"
                onClick={() => setPendingAccountModal(null)}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup Sementara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
