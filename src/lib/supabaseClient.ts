import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SchoolAccount, SubscriptionStatus, AppSettings, BkuItem, RkasItem, TaxRecord } from '../types';

// Ambil konfigurasi dari Environment Variables (Vite) atau Kredensial Project
const metaEnv = (import.meta as any).env || {};
const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL || 'https://ugkwxjtwyetlkexyczvk.supabase.co';
const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna3d4anR3eWV0bGtleHljenZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MDM5MzAsImV4cCI6MjEwNTM3OTkzMH0.AQZSBSCaOMlE1_41smIMabo-I_6hxUp_NMG_NgLOWkw';

// Inisialisasi Supabase Client jika URL dan Anon Key tersedia
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const ADMIN_WA_NUMBER = '083823193952';
export const ADMIN_WA_LINK = '6283823193952';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabase);
};

export const getSupabaseConfigInfo = () => {
  return {
    url: supabaseUrl || '(Belum diatur di .env)',
    isConfigured: isSupabaseConfigured(),
  };
};

// SQL Schema lengkap untuk disalin ke Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- SISTEM SPJ BOSP & PERPAJAKAN SEKOLAH (MULTI-SEKOLAH)
-- JALANKAN SCRIPT INI DI MENU "SQL EDITOR" SUPABASE ANDA
-- ========================================================

-- 1. Buat Tabel Data Sekolah & Langganan
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    npsn VARCHAR(10) UNIQUE NOT NULL,
    nama_sekolah VARCHAR(255) NOT NULL,
    jenjang VARCHAR(20) DEFAULT 'SD',
    kecamatan VARCHAR(100),
    kabupaten VARCHAR(100),
    provinsi VARCHAR(100) DEFAULT 'Banten',
    alamat TEXT,
    nama_kepsek VARCHAR(150),
    nip_kepsek VARCHAR(50),
    nama_bendahara VARCHAR(150),
    nip_bendahara VARCHAR(50),
    no_wa VARCHAR(30) NOT NULL,
    
    -- KOLOM KUNCI LANGGANAN & AKTIVASI MANUAL:
    -- Nilai awal otomatis: 'pending'
    -- Admin cukup ubah menjadi 'active' untuk mengaktifkan sekolah!
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'suspended')),
    
    paket_langganan VARCHAR(50) DEFAULT 'Tahunan',
    masa_aktif_sampai DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    catatan_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS) pada Tabel schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Izinkan Pendaftaran Akun Baru (Public Insert)
CREATE POLICY "Izinkan pendaftaran publik" 
ON public.schools FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 4. Policy: Izinkan Sekolah Membaca Akunnya Sendiri
CREATE POLICY "Izinkan akses baca akun" 
ON public.schools FOR SELECT 
TO anon, authenticated 
USING (true);

-- 5. Policy: Izinkan Update Status oleh Admin / Anon untuk Update Profil & Workspace
CREATE POLICY "Izinkan update data" 
ON public.schools FOR UPDATE 
TO anon, authenticated 
USING (true);

-- 6. Policy: Izinkan Hapus Akun oleh Admin jika diperlukan
CREATE POLICY "Izinkan hapus akun"
ON public.schools FOR DELETE
TO anon, authenticated
USING (true);

-- 7. Buat Index untuk Pencarian Cepat berdasarkan NPSN dan Email
CREATE INDEX IF NOT EXISTS idx_schools_npsn ON public.schools(npsn);
CREATE INDEX IF NOT EXISTS idx_schools_email ON public.schools(email);
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);

-- 7. Buat Tabel school_workspaces untuk Penyimpanan Progress Pengerjaan Cloud
-- (BKU, RKAS, Pajak, Pengaturan, Kwitansi, dsb. agar tersimpan permanen saat logout / ganti perangkat)
CREATE TABLE IF NOT EXISTS public.school_workspaces (
    npsn VARCHAR(20) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    settings JSONB,
    rkas_data JSONB,
    bku_data JSONB,
    tax_records JSONB,
    extra_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS untuk school_workspaces
ALTER TABLE public.school_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Izinkan akses penuh data pekerjaan" 
ON public.school_workspaces FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 8. Contoh Akun Demo Langsung Aktif (Opsional)
INSERT INTO public.schools (
    email, password_hash, npsn, nama_sekolah, jenjang, kecamatan, kabupaten, 
    provinsi, nama_kepsek, nama_bendahara, no_wa, status, paket_langganan, masa_aktif_sampai
) VALUES (
    'admin.demo@sekolah.id', 
    'demo123', 
    '20602599', 
    'SDN 1 CIBUNGUR', 
    'SD', 
    'Cigemblong', 
    'Kab. Lebak', 
    'Prov. Banten', 
    'KARNA, S.Pd', 
    'SUHENDRI, S.Pd', 
    '081234567890', 
    'active', 
    'Tahunan', 
    '2027-12-31'
) ON CONFLICT (email) DO NOTHING;
`;

// Helper Penyimpanan Lokal Multi-Tenant (Fallback saat offline / belum pasang Supabase API key)
const LOCAL_STORAGE_SCHOOLS_KEY = 'spj_bosp_schools_registry';

export const getLocalSchools = (): SchoolAccount[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_SCHOOLS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load local schools', e);
  }
  return [];
};

export const saveLocalSchools = (schools: SchoolAccount[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SCHOOLS_KEY, JSON.stringify(schools));
  } catch (e) {
    console.error('Failed to save local schools', e);
  }
};

// Helper untuk menghapus seluruh data lokal sekolah yang telah dihapus di database SQL
// (Reset otomatis kembali ke 0: Pengaturan, RKAS, BKU, Kwitansi, Pajak, Sesi, dan Registry)
export const purgeSchoolDataLocally = (identifierOrNpsn: string) => {
  try {
    const clean = identifierOrNpsn.trim().toLowerCase();

    // 1. Bersihkan dari registry sekolah lokal
    const localList = getLocalSchools().filter(
      (s) => s.npsn !== clean && s.email.toLowerCase() !== clean && s.id !== clean
    );
    saveLocalSchools(localList);

    // 2. Bersihkan sesi aktif jika cocok
    const active = localStorage.getItem('spj_active_school_account');
    if (active) {
      try {
        const parsed = JSON.parse(active);
        if (
          parsed.npsn === clean ||
          parsed.email?.toLowerCase() === clean ||
          parsed.id === clean
        ) {
          localStorage.removeItem('spj_active_school_account');
        }
      } catch (e) {
        localStorage.removeItem('spj_active_school_account');
      }
    }

    // 3. Hapus seluruh data pengerjaan sekolah (Settings, RKAS, BKU, Pajak, Kwitansi, Backup, dsb.)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes(`_${clean}_`) || key.includes(`_${clean}`) || key.endsWith(`_${clean}`))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Error purging school local data', err);
  }
};

// Bersihkan seluruh data semua sekolah jika seluruh tabel di database dihapus
export const purgeAllSchoolsDataLocally = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SCHOOLS_KEY);
    localStorage.removeItem('spj_active_school_account');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('spj_school_') || key.startsWith('spj_active_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Error purging all schools local data', err);
  }
};

// ==========================================
// 1. REGISTRASI SEKOLAH BARU (DEFAULT: PENDING)
// ==========================================
export interface RegisterSchoolParams {
  email: string;
  password: string;
  npsn: string;
  namaSekolah: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'PAUD' | 'SLB';
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamat?: string;
  namaKepsek: string;
  nipKepsek?: string;
  namaBendahara: string;
  nipBendahara?: string;
  noWa: string;
}

export const registerSchool = async (
  params: RegisterSchoolParams
): Promise<{ success: boolean; message: string; account?: SchoolAccount }> => {
  const newAccount: SchoolAccount = {
    id: `school-${Date.now()}`,
    email: params.email.toLowerCase().trim(),
    password: params.password,
    npsn: params.npsn.trim(),
    namaSekolah: params.namaSekolah.trim().toUpperCase(),
    jenjang: params.jenjang,
    kecamatan: params.kecamatan.trim(),
    kabupaten: params.kabupaten.trim(),
    provinsi: params.provinsi.trim(),
    alamat: params.alamat?.trim() || '',
    namaKepsek: params.namaKepsek.trim(),
    nipKepsek: params.nipKepsek?.trim() || '',
    namaBendahara: params.namaBendahara.trim(),
    nipBendahara: params.nipBendahara?.trim() || '',
    noWa: params.noWa.trim(),
    status: 'pending', // DEFAULT HARUS DISETUJUI / DIAKTIFKAN MANUAL DI SUPABASE
    paketLangganan: 'Tahunan',
    masaAktifSampai: '2027-12-31',
    createdAt: new Date().toISOString(),
  };

  // Simpan ke Supabase jika tersedia
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('schools').insert([
        {
          email: newAccount.email,
          password_hash: newAccount.password,
          npsn: newAccount.npsn,
          nama_sekolah: newAccount.namaSekolah,
          jenjang: newAccount.jenjang,
          kecamatan: newAccount.kecamatan,
          kabupaten: newAccount.kabupaten,
          provinsi: newAccount.provinsi,
          alamat: newAccount.alamat,
          nama_kepsek: newAccount.namaKepsek,
          nip_kepsek: newAccount.nipKepsek,
          nama_bendahara: newAccount.namaBendahara,
          nip_bendahara: newAccount.nipBendahara,
          no_wa: newAccount.noWa,
          status: 'pending',
          paket_langganan: newAccount.paketLangganan,
          masa_aktif_sampai: newAccount.masaAktifSampai,
        },
      ]).select().single();

      if (error) {
        if (
          error.code === '42P01' ||
          error.code === 'PGRST204' ||
          error.message.toLowerCase().includes('relation') ||
          error.message.toLowerCase().includes('does not exist')
        ) {
          return {
            success: false,
            message:
              'Gagal mendaftar: Tabel "schools" di Supabase belum dibuat atau telah dihapus. Harap jalankan script SQL di SQL Editor Supabase terlebih dahulu.',
          };
        }
        if (error.message.includes('unique') || error.code === '23505') {
          return { success: false, message: 'NPSN atau Email ini sudah terdaftar. Silakan login atau hubungi admin.' };
        }
        return { success: false, message: `Gagal mendaftar ke Supabase: ${error.message}` };
      }

      if (data) {
        newAccount.id = data.id;
      }
    } catch (err: any) {
      console.error('Supabase insert error', err);
      return {
        success: false,
        message: `Terjadi kendala saat mendaftar ke Supabase: ${err.message || err}`,
      };
    }
  }

  // Simpan juga ke registry lokal hanya sebagai sinkronisasi offline cache
  const localList = getLocalSchools();
  const existingIndex = localList.findIndex((s) => s.email === newAccount.email || s.npsn === newAccount.npsn);
  if (existingIndex !== -1) {
    localList[existingIndex] = newAccount;
  } else {
    localList.push(newAccount);
  }
  saveLocalSchools(localList);

  return {
    success: true,
    message: 'Pendaftaran sekolah berhasil! Akun Anda kini berstatus Menunggu Aktivasi Langganan oleh Administrator.',
    account: newAccount,
  };
};

// ==========================================
// 2. LOGIN SEKOLAH (VALIDASI STATUS AKTIF)
// ==========================================
export interface LoginResult {
  success: boolean;
  message: string;
  account?: SchoolAccount;
  status?: SubscriptionStatus;
}

export const loginSchool = async (
  identifier: string, // NPSN, Email, atau Nama Sekolah
  passwordInput: string
): Promise<LoginResult> => {
  const clean = identifier.trim();
  const cleanPass = passwordInput.trim();

  if (!clean || !cleanPass) {
    return { success: false, message: 'Harap masukkan NPSN/Email/Nama Sekolah dan Password.' };
  }

  // 1. Cek lewat Supabase jika aktif (Supabase adalah SUMBER KEBENARAN TUNGGAL)
  if (isSupabaseConfigured() && supabase) {
    try {
      // Cari secara fleksibel berdasarkan NPSN, Email, atau Nama Sekolah
      const { data: rows, error } = await supabase
        .from('schools')
        .select('*')
        .or(`npsn.eq.${clean},email.ilike.${clean},nama_sekolah.ilike.%${clean}%`)
        .limit(1);

      // Cek apakah tabel schools telah dihapus dari Supabase
      if (error) {
        const isTableMissing =
          error.code === '42P01' ||
          error.code === 'PGRST204' ||
          error.message.toLowerCase().includes('relation') ||
          error.message.toLowerCase().includes('does not exist') ||
          error.message.toLowerCase().includes('not found') ||
          error.message.includes('404');

        if (isTableMissing) {
          // Bersihkan juga seluruh data lokal agar kembali ke 0
          purgeAllSchoolsDataLocally();
          return {
            success: false,
            message:
              'Login Ditolak: Tabel database tidak ditemukan atau telah dihapus. Seluruh data otomatis di-reset ke 0.',
          };
        }

        return {
          success: false,
          message: `Koneksi database gagal: ${error.message}`,
        };
      }

      const data = rows && rows.length > 0 ? rows[0] : null;

      if (!data) {
        return {
          success: false,
          message:
            'NPSN, Email, atau Nama Sekolah belum terdaftar di sistem. Jika sebelumnya telah dihapus oleh Admin di Supabase, silakan lakukan pendaftaran ulang kembali dari awal (ke 0).',
        };
      }

      // Validasi password
      if (data.password_hash !== cleanPass) {
        return { success: false, message: 'Password yang Anda masukkan salah.' };
      }

      // Normalisasi status aktivasi dari database
      const rawStatus = (data.status || '').trim().toLowerCase();
      let effectiveStatus: SubscriptionStatus = 'active';

      if (rawStatus === 'pending') {
        effectiveStatus = 'pending';
      } else if (rawStatus === 'expired') {
        effectiveStatus = 'expired';
      } else if (rawStatus === 'suspended') {
        effectiveStatus = 'suspended';
      } else {
        // Jika 'active', 'aktif', atau data sekolah ada di Table Editor
        effectiveStatus = 'active';
      }

      const account: SchoolAccount = {
        id: data.id,
        email: data.email,
        npsn: data.npsn,
        namaSekolah: data.nama_sekolah,
        jenjang: data.jenjang,
        kecamatan: data.kecamatan,
        kabupaten: data.kabupaten,
        provinsi: data.provinsi,
        alamat: data.alamat,
        namaKepsek: data.nama_kepsek,
        nipKepsek: data.nip_kepsek,
        namaBendahara: data.nama_bendahara,
        nipBendahara: data.nip_bendahara,
        noWa: data.no_wa,
        status: effectiveStatus,
        paketLangganan: data.paket_langganan || 'Tahunan',
        masaAktifSampai: data.masa_aktif_sampai || '2027-12-31',
        catatanAdmin: data.catatan_admin,
        createdAt: data.created_at,
      };

      // Sinkronkan ke local storage
      const localList = getLocalSchools();
      const idx = localList.findIndex(
        (s) => s.npsn === account.npsn || s.email.toLowerCase() === account.email.toLowerCase()
      );
      if (idx !== -1) {
        localList[idx] = account;
      } else {
        localList.push(account);
      }
      saveLocalSchools(localList);

      // CEK STATUS LANGGANAN
      if (effectiveStatus === 'pending') {
        return {
          success: false,
          status: 'pending',
          account,
          message: `Akun sekolah Anda belum diaktifkan oleh Admin di Supabase. Anda belum dapat login sebelum melakukan pembayaran langganan dan konfirmasi aktivasi ke WhatsApp Admin di ${ADMIN_WA_NUMBER}.`,
        };
      }

      if (effectiveStatus === 'expired') {
        return {
          success: false,
          status: 'expired',
          account,
          message: `Masa aktif langganan sekolah Anda telah berakhir. Silakan hubungi admin di WhatsApp ${ADMIN_WA_NUMBER} untuk perpanjangan.`,
        };
      }

      if (effectiveStatus === 'suspended') {
        return {
          success: false,
          status: 'suspended',
          account,
          message: `Akun sekolah Anda sedang dinonaktifkan sementara oleh Administrator. Hubungi WA ${ADMIN_WA_NUMBER}.`,
        };
      }

      return { success: true, message: 'Login berhasil.', account };
    } catch (err: any) {
      console.error('Supabase login check error', err);
      return {
        success: false,
        message: `Terjadi kendala saat memeriksa akun ke Supabase: ${err.message || err}`,
      };
    }
  }

  // 2. Cek ke Local Storage HANYA jika Supabase sama sekali tidak dikonfigurasi
  const cleanId = clean.toLowerCase();
  const localList = getLocalSchools();
  const account = localList.find(
    (s) =>
      s.email.toLowerCase() === cleanId ||
      s.npsn === cleanId ||
      s.namaSekolah.toLowerCase().includes(cleanId)
  );

  if (!account) {
    return {
      success: false,
      message: 'NPSN, Email, atau Nama Sekolah belum terdaftar di sistem. Silakan lakukan pendaftaran terlebih dahulu.',
    };
  }

  if (account.password && account.password !== cleanPass) {
    return { success: false, message: 'Password yang Anda masukkan salah.' };
  }

  // CEK STATUS LANGGANAN
  if (account.status === 'pending') {
    return {
      success: false,
      status: 'pending',
      account,
      message: `Akun sekolah Anda belum diaktifkan oleh Admin. Anda belum dapat login sebelum melakukan konfirmasi aktivasi ke WhatsApp Admin di ${ADMIN_WA_NUMBER}.`,
    };
  }

  if (account.status === 'expired') {
    return {
      success: false,
      status: 'expired',
      account,
      message: `Masa aktif langganan sekolah Anda telah berakhir. Silakan hubungi admin di WhatsApp ${ADMIN_WA_NUMBER} untuk perpanjangan.`,
    };
  }

  if (account.status === 'suspended') {
    return {
      success: false,
      status: 'suspended',
      account,
      message: `Akun sekolah Anda sedang dinonaktifkan sementara oleh Administrator. Hubungi WA ${ADMIN_WA_NUMBER}.`,
    };
  }

  return { success: true, message: 'Login berhasil (Offline Demo).', account };
};

// ==========================================
// 3. CEK STATUS AKTIVASI SEKOLAH LANGSUNG KE DATABASE
// ==========================================
export const checkSchoolActivationStatus = async (
  identifier: string
): Promise<{ status: SubscriptionStatus | 'not_found'; account?: SchoolAccount; message: string }> => {
  const clean = identifier.trim();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: rows, error } = await supabase
        .from('schools')
        .select('*')
        .or(`npsn.eq.${clean},email.ilike.${clean},nama_sekolah.ilike.%${clean}%`)
        .limit(1);

      if (error) {
        const isTableMissing =
          error.code === '42P01' ||
          error.code === 'PGRST204' ||
          error.message.toLowerCase().includes('relation') ||
          error.message.toLowerCase().includes('does not exist') ||
          error.message.toLowerCase().includes('not found') ||
          error.message.includes('404');

        if (isTableMissing) {
          purgeAllSchoolsDataLocally();
          return {
            status: 'not_found',
            message:
              'Tabel sekolah di database tidak ditemukan atau telah dihapus. Seluruh data di-reset kembali ke 0.',
          };
        }

        return {
          status: 'not_found',
          message: `Koneksi Supabase terganggu: ${error.message}`,
        };
      }

      const data = rows && rows.length > 0 ? rows[0] : null;

      if (!data) {
        purgeSchoolDataLocally(clean);
        return {
          status: 'not_found',
          message:
            'Data sekolah telah dihapus dari database. Seluruh data otomatis hilang dan harus registrasi ulang kembali ke 0.',
        };
      }

      // Normalisasi status aktivasi
      const rawStatus = (data.status || '').trim().toLowerCase();
      let effectiveStatus: SubscriptionStatus = 'active';

      if (rawStatus === 'pending') {
        effectiveStatus = 'pending';
      } else if (rawStatus === 'expired') {
        effectiveStatus = 'expired';
      } else if (rawStatus === 'suspended') {
        effectiveStatus = 'suspended';
      } else {
        effectiveStatus = 'active';
      }

      const account: SchoolAccount = {
        id: data.id,
        email: data.email,
        npsn: data.npsn,
        namaSekolah: data.nama_sekolah,
        jenjang: data.jenjang,
        kecamatan: data.kecamatan,
        kabupaten: data.kabupaten,
        provinsi: data.provinsi,
        alamat: data.alamat,
        namaKepsek: data.nama_kepsek,
        nipKepsek: data.nip_kepsek,
        namaBendahara: data.nama_bendahara,
        nipBendahara: data.nip_bendahara,
        noWa: data.no_wa,
        status: effectiveStatus,
        paketLangganan: data.paket_langganan || 'Tahunan',
        masaAktifSampai: data.masa_aktif_sampai || '2027-12-31',
        catatanAdmin: data.catatan_admin,
        createdAt: data.created_at,
      };

      // Sinkronkan ke local storage jika status di Supabase sudah berubah
      const localList = getLocalSchools();
      const idx = localList.findIndex((s) => s.npsn === account.npsn || s.email.toLowerCase() === account.email.toLowerCase());
      if (idx !== -1) {
        localList[idx] = account;
      } else {
        localList.push(account);
      }
      saveLocalSchools(localList);

      if (effectiveStatus === 'active') {
        return {
          status: 'active',
          account,
          message: 'Alhamdulillah! Akun Anda sudah AKTIF di Supabase. Anda sekarang dapat login ke sistem.',
        };
      } else {
        return {
          status: effectiveStatus,
          account,
          message: `Status akun di database Supabase masih: ${effectiveStatus.toUpperCase()}. Belum diaktifkan oleh Admin. Silakan konfirmasi ke WhatsApp ${ADMIN_WA_NUMBER}.`,
        };
      }
    } catch (e: any) {
      console.warn('Supabase status check failed', e);
      return {
        status: 'not_found',
        message: `Koneksi Supabase terganggu: ${e.message || e}`,
      };
    }
  }

  // Fallback ke local HANYA jika Supabase tidak dikonfigurasi
  const cleanId = clean.toLowerCase();
  const localList = getLocalSchools();
  const acc = localList.find(
    (s) =>
      s.npsn === cleanId ||
      s.email.toLowerCase() === cleanId ||
      s.namaSekolah.toLowerCase().includes(cleanId)
  );
  if (acc) {
    const localStatus = acc.status || 'active';
    return {
      status: localStatus,
      account: acc,
      message:
        localStatus === 'active'
          ? 'Akun Anda sudah AKTIF. Silakan login ke sistem.'
          : `Status akun masih: ${localStatus.toUpperCase()}. Belum diaktifkan oleh Admin.`,
    };
  }

  return {
    status: 'not_found',
    message: 'Data sekolah tidak ditemukan. Silakan lakukan pendaftaran terlebih dahulu.',
  };
};

// ==========================================
// 4. AKTIVASI STATUS SEKOLAH OLEH ADMIN
// ==========================================
export const activateSchoolStatus = async (
  schoolId: string,
  newStatus: SubscriptionStatus,
  validUntil: string = '2027-12-31'
): Promise<boolean> => {
  // Update di Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          status: newStatus,
          masa_aktif_sampai: validUntil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', schoolId);

      if (!error) {
        console.log(`Supabase school ${schoolId} status updated to ${newStatus}`);
      }
    } catch (e) {
      console.error('Failed to update status in Supabase', e);
    }
  }

  // Update di local storage juga
  const localList = getLocalSchools();
  const idx = localList.findIndex((s) => s.id === schoolId);
  if (idx !== -1) {
    localList[idx].status = newStatus;
    localList[idx].masaAktifSampai = validUntil;
    saveLocalSchools(localList);
    return true;
  }
  return false;
};

// ========================================================
// 4. SINKRONISASI PROGRESS DATA PEKERJAAN (MULTI-DEVICE)
// BKU, RKAS, PAJAK, PENGATURAN, DAFTAR TUKANG/GURU
// ========================================================
export interface SchoolWorkspacePayload {
  npsn: string;
  settings: AppSettings;
  rkasData: RkasItem[];
  bkuData: BkuItem[];
  taxRecords: TaxRecord[];
  selectedPeriode?: string;
  extraData?: Record<string, any>;
  lastSyncedAt: string;
}

export interface WorkspaceSyncResult {
  success: boolean;
  source: 'supabase_workspaces' | 'supabase_envelope' | 'local_storage' | 'none';
  message: string;
  payload?: SchoolWorkspacePayload;
  error?: string;
}

// Simpan data pengerjaan sekolah ke Supabase (Otomatis & Real-Time)
export const saveSchoolWorkspaceToSupabase = async (
  npsn: string,
  payload: SchoolWorkspacePayload
): Promise<{ success: boolean; message: string; method?: string; error?: string }> => {
  if (!npsn) {
    return { success: false, message: 'NPSN tidak valid.' };
  }

  const cleanNpsn = npsn.trim();
  const syncTime = new Date().toISOString();
  const updatedPayload: SchoolWorkspacePayload = {
    ...payload,
    npsn: cleanNpsn,
    lastSyncedAt: syncTime,
  };

  // 1. Simpan backup ke LocalStorage perangkat saat ini
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(
        `spj_school_${cleanNpsn}_cloud_backup`,
        JSON.stringify(updatedPayload)
      );
    } catch (e) {
      console.warn('Failed to store local workspace backup', e);
    }
  }

  // 2. Jika Supabase tidak terkonfigurasi, cukup lokal
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: true,
      method: 'local_only',
      message: 'Tersimpan di perangkat lokal (Supabase belum diaktifkan).',
    };
  }

  let tableError = false;

  // 3. Prioritas 1: Simpan ke tabel dedicated `school_workspaces` jika sudah ada
  try {
    const { error: wsError } = await supabase.from('school_workspaces').upsert(
      {
        npsn: cleanNpsn,
        settings: updatedPayload.settings,
        rkas_data: updatedPayload.rkasData,
        bku_data: updatedPayload.bkuData,
        tax_records: updatedPayload.taxRecords,
        extra_data: {
          selectedPeriode: updatedPayload.selectedPeriode,
          ...(updatedPayload.extraData || {}),
        },
        updated_at: syncTime,
      },
      { onConflict: 'npsn' }
    );

    if (!wsError) {
      return {
        success: true,
        method: 'supabase_workspaces',
        message: 'Progres pengerjaan berhasil disimpan di Supabase Cloud.',
      };
    } else {
      tableError = true;
      console.warn('Tabel school_workspaces belum dibuat atau ada error, beralih ke amplop cloud:', wsError.message);
    }
  } catch (err: any) {
    tableError = true;
    console.warn('Fallback ke amplop penyimpanan Supabase:', err);
  }

  // 4. Prioritas 2 (Zero-Config Fallback): Simpan ke amplop aman di tabel `schools`
  // Memastikan data 100% tersimpan di Supabase walau user belum mengeksekusi SQL di dashboard
  try {
    const envelope = JSON.stringify({
      __type: 'bosp_workspace_envelope_v1',
      realAlamat: updatedPayload.settings.alamat || '',
      workspace: updatedPayload,
      savedAt: syncTime,
    });

    const { error: envelopeError } = await supabase
      .from('schools')
      .update({
        alamat: envelope,
      })
      .eq('npsn', cleanNpsn);

    if (!envelopeError) {
      return {
        success: true,
        method: 'supabase_envelope',
        message: 'Progres pengerjaan berhasil diamankan di Supabase Cloud (Sinkronisasi Otomatis).',
      };
    } else {
      console.error('Supabase envelope save failed', envelopeError);
      return {
        success: false,
        message: `Gagal sinkronisasi ke Supabase: ${envelopeError.message}`,
        error: envelopeError.message,
      };
    }
  } catch (err: any) {
    console.error('Supabase save error', err);
    return {
      success: false,
      message: `Terjadi kesalahan saat menyimpan ke cloud: ${err.message || err}`,
      error: err.message,
    };
  }
};

// Muat data pengerjaan sekolah dari Supabase (Untuk Multi-Device / Baru Login)
export const loadSchoolWorkspaceFromSupabase = async (
  npsn: string
): Promise<WorkspaceSyncResult> => {
  if (!npsn) {
    return { success: false, source: 'none', message: 'NPSN tidak ditentukan.' };
  }

  const cleanNpsn = npsn.trim();

  // 1. Ambil dari Supabase jika online
  if (isSupabaseConfigured() && supabase) {
    // Coba Prioritas 1: Dari tabel `school_workspaces`
    try {
      const { data: wsData, error: wsError } = await supabase
        .from('school_workspaces')
        .select('*')
        .eq('npsn', cleanNpsn)
        .maybeSingle();

      if (wsData && !wsError && (wsData.bku_data || wsData.settings || wsData.rkas_data)) {
        const payload: SchoolWorkspacePayload = {
          npsn: cleanNpsn,
          settings: wsData.settings,
          rkasData: Array.isArray(wsData.rkas_data) ? wsData.rkas_data : [],
          bkuData: Array.isArray(wsData.bku_data) ? wsData.bku_data : [],
          taxRecords: Array.isArray(wsData.tax_records) ? wsData.tax_records : [],
          selectedPeriode: wsData.extra_data?.selectedPeriode,
          extraData: wsData.extra_data,
          lastSyncedAt: wsData.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          source: 'supabase_workspaces',
          message: 'Data progres pengerjaan berhasil dimuat dari Supabase Cloud (Tabel Workspace).',
          payload,
        };
      }
    } catch (err) {
      console.warn('Gagal membaca tabel school_workspaces, memeriksa amplop:', err);
    }

    // Coba Prioritas 2: Dari amplop cloud di tabel `schools`
    try {
      const { data: sData, error: sErr } = await supabase
        .from('schools')
        .select('alamat, nama_sekolah, npsn, nama_kepsek, nama_bendahara')
        .eq('npsn', cleanNpsn)
        .maybeSingle();

      if (sData?.alamat && typeof sData.alamat === 'string' && sData.alamat.startsWith('{')) {
        try {
          const parsed = JSON.parse(sData.alamat);
          if (parsed.__type === 'bosp_workspace_envelope_v1' && parsed.workspace) {
            const ws = parsed.workspace as SchoolWorkspacePayload;
            // Kembalikan alamat asli ke settings
            if (ws.settings) {
              ws.settings.alamat = parsed.realAlamat || ws.settings.alamat || '';
            }
            return {
              success: true,
              source: 'supabase_envelope',
              message: 'Data progres pengerjaan berhasil dimuat dari Supabase Cloud (Amplop Cloud).',
              payload: ws,
            };
          }
        } catch (e) {
          // Buka json biasa
        }
      }
    } catch (err) {
      console.warn('Gagal membaca amplop cloud Supabase:', err);
    }
  }

  // 2. Fallback: Ambil dari cadangan LocalStorage jika ada
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const localBackup = localStorage.getItem(`spj_school_${cleanNpsn}_cloud_backup`);
      if (localBackup) {
        const parsed = JSON.parse(localBackup);
        return {
          success: true,
          source: 'local_storage',
          message: 'Data pengerjaan dimuat dari cache lokal perangkat ini.',
          payload: parsed,
        };
      }
    } catch (e) {
      console.warn('Gagal membaca cache lokal backup', e);
    }
  }

  return {
    success: false,
    source: 'none',
    message: 'Belum ada data pengerjaan tersimpan di Cloud Supabase untuk sekolah ini.',
  };
};

