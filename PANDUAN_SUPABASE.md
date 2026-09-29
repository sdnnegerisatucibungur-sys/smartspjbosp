# PANDUAN LENGKAP SETUP SUPABASE & SISTEM LANGGANAN MULTI-SEKOLAH
## Sistem Pelaporan SPJ BOSP & Perpajakan Digital

Dokumen ini menjelaskan langkah-langkah mudah menghubungkan aplikasi SPJ BOSP ini ke database **Supabase** dan bagaimana cara mengelola akun serta **mengaktifkan langganan sekolah secara manual** seperti pada platform SaaS / web langganan profesional.

---

## 1. Buat Akun & Project Baru di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan login/daftar (bisa menggunakan akun GitHub atau Email).
2. Klik tombol **"New Project"**.
3. Masukkan:
   - **Name**: `SPJ-BOSP-MultiSekolah` (atau nama pilihan Anda)
   - **Database Password**: Masukkan password yang aman dan simpan baik-baik.
   - **Region**: Pilih yang terdekat (misal: `Singapore (ap-southeast-1)`).
4. Klik **"Create new project"** dan tunggu sekitar 1-2 menit hingga proses inisialisasi selesai.

---

## 2. Buat Tabel Database (Jalankan SQL Schema)
1. Di sidebar kiri dashboard Supabase, klik menu **SQL Editor** (ikon tanda `>_`).
2. Klik tombol **"New query"**.
3. Salin dan tempelkan (*copy-paste*) kode SQL di bawah ini:

```sql
-- ========================================================
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
    
    -- STATUS LANGGANAN:
    -- 'pending'   : Baru mendaftar, menunggu aktivasi manual oleh Admin
    -- 'active'    : Aktif dan bisa login
    -- 'expired'   : Masa aktif habis
    -- 'suspended' : Dinonaktifkan sementara
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'suspended')),
    
    paket_langganan VARCHAR(50) DEFAULT 'Tahunan',
    masa_aktif_sampai DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    catatan_admin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS) pada Tabel schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Akses (Policies) untuk schools
CREATE POLICY "Izinkan pendaftaran publik" 
ON public.schools FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Izinkan akses baca akun" 
ON public.schools FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Izinkan update data" 
ON public.schools FOR UPDATE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Izinkan hapus akun"
ON public.schools FOR DELETE
TO anon, authenticated
USING (true);

-- 4. Index Pencarian Cepat
CREATE INDEX IF NOT EXISTS idx_schools_npsn ON public.schools(npsn);
CREATE INDEX IF NOT EXISTS idx_schools_email ON public.schools(email);
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);

-- 5. Buat Tabel school_workspaces untuk Penyimpanan Progress Pengerjaan Cloud
-- (BKU, RKAS, Pajak, Pengaturan, Kwitansi, dsb. agar tersimpan permanen & realtime)
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

-- 6. RLS & Policy untuk school_workspaces
ALTER TABLE public.school_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Izinkan akses penuh data pekerjaan" 
ON public.school_workspaces FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 7. Contoh Akun Demo Langsung Aktif (Opsional)
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
```

4. Klik tombol **"Run"** (ikon panah hijau di kanan bawah SQL Editor).
5. Muncul pesan `Success. No rows returned` menandakan tabel siap digunakan.

---

## 3. Ambil API Keys Supabase & Masukkan ke Aplikasi
1. Di sidebar kiri Supabase, klik **Project Settings** (ikon roda gigi) -> pilih **API**.
2. Anda akan melihat 2 kunci penting:
   - **Project URL** (contoh: `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> cari bagian `anon` / `public` (contoh: string panjang `eyJhbGciOi...`)
3. Masukkan ke file `.env` di server atau project Anda:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJh...kunci_anon_anda...
   ```
4. Simpan file dan restart dev server. Aplikasi kini 100% terhubung secara *real-time* ke Supabase!

---

## 4. CARA AKTIVASI MANUAL LANGGANAN SEKOLAH (SEPERTI WEB LANGGANAN)

Inilah cara Anda sebagai pemilik web mengontrol lisensi sekolah:

1. **Sekolah Mendaftar**:
   - Pihak sekolah membuka halaman web dan memilih tab **"Pendaftaran Sekolah Baru"**.
   - Mereka mengisi NPSN, Nama Sekolah, Wilayah, KS, Bendahara, No WA, Email, dan Password.
   - Setelah klik **"Daftarkan Sekolah Saya"**, data otomatis tersimpan di Supabase dengan status: `'pending'`.
   - Sekolah belum bisa login dan akan melihat notifikasi: *"Akun Anda sedang dalam proses verifikasi & aktivasi langganan oleh Administrator"*.

2. **Admin Mengaktifkan Sekolah di Supabase**:
   - Anda membuka **Dashboard Supabase** -> klik menu **Table Editor** (ikon tabel di sidebar kiri).
   - Klik tabel **`schools`**.
   - Anda akan melihat baris pendaftar baru dengan kolom `status` berwarna kuning atau bertuliskan `'pending'`.
   - **Klik dua kali pada sel `status`**, lalu ubah dari `pending` menjadi `active`.
   - Pada kolom `masa_aktif_sampai`, Anda bisa tentukan tanggal expired (misal `2027-12-31` untuk 1 tahun langganan).
   - Tekan **Enter / Save**.

3. **Sekolah Langsung Bisa Login**:
   - Sekolah membuka form login, memasukkan NPSN / Email dan Password mereka.
   - Sistem membaca status `'active'` dari Supabase dan mereka langsung masuk ke dalam aplikasi SPJ BOSP dengan identitas resmi sekolah mereka!

---

## 5. Menonaktifkan atau Memperpanjang Langganan
- **Jika sekolah tidak memperpanjang langganan**:
  Cukup ubah kolom `status` di Supabase menjadi `'expired'` atau `'suspended'`. Ketika sekolah mencoba login, sistem otomatis menolak dan memunculkan pesan peringatan langganan berakhir.
- **Jika sekolah memperpanjang**:
  Ubah kembali `status` ke `'active'` dan perbarui tanggal di kolom `masa_aktif_sampai`.

---

## 6. Mode Cadangan (Fallback & Demo)
Jika Anda sedang menguji coba aplikasi saat Supabase belum dihubungkan, sistem memiliki **Local Storage Registry** otomatis sehingga pendaftaran, penolakan saat pending, dan aktivasi manual dapat langsung disimulasikan melalui tombol **"Panel Aktivasi Admin (Simulasi)"** di jendela status aktivasi.
