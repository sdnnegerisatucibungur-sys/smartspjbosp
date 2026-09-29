import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Edit3,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { ActivityScopeType, AppSettings, KopConfig } from '../../types';
import {
  LOGO_PEMKAB_LEBAK,
  LOGO_TUT_WURI,
  LOGO_KKG_PRESET,
  LOGO_MKKS_PRESET,
  processUploadedLogo,
} from '../../utils/logoPresets';

interface OfficialKopSuratProps {
  settings: AppSettings;
  scope?: ActivityScopeType;
  onUpdateSettings?: (updated: AppSettings) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  className?: string;
}

export const OfficialKopSurat: React.FC<OfficialKopSuratProps> = ({
  settings,
  scope,
  onUpdateSettings,
  showToast,
  className = '',
}) => {
  const isKkg = scope === 'kkg';
  const isMkks = scope === 'mkks';
  const isSpecialScope = isKkg || isMkks;

  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default values for KKG Kop
  const defaultKkgKop: KopConfig = {
    instansiInduk: 'PEMERINTAH KABUPATEN ' + (settings.kabupaten?.replace(/^(kab\.?|kabupaten)\s*/i, '').toUpperCase() || 'LEBAK'),
    dinas: 'DINAS PENDIDIKAN',
    namaOrganisasi: 'KELOMPOK KERJA GURU (KKG) GUGUS 03 CIBUNGUR',
    subOrganisasi: 'KECAMATAN ' + (settings.kecamatan?.toUpperCase() || 'CIGEMBLONG'),
    alamatSekretariat: `Sekretariat: ${settings.namaSekolah || 'SDN 1 Cibungur'}, ${settings.alamat || 'Kp. Pasarkupa RT 02/03'}`,
    kontakSekretariat: `Desa ${settings.desaKelurahan || 'Cibungur'}, Kec. ${settings.kecamatan || 'Cigemblong'} ${settings.kodePos || '42395'} | Email: kkg.cigemblong@gmail.com`,
    logo: LOGO_KKG_PRESET,
  };

  // Default values for MKKS Kop
  const defaultMkksKop: KopConfig = {
    instansiInduk: 'PEMERINTAH KABUPATEN ' + (settings.kabupaten?.replace(/^(kab\.?|kabupaten)\s*/i, '').toUpperCase() || 'LEBAK'),
    dinas: 'DINAS PENDIDIKAN',
    namaOrganisasi: 'MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)',
    subOrganisasi: 'SUB RAYON / KECAMATAN ' + (settings.kecamatan?.toUpperCase() || 'CIGEMBLONG'),
    alamatSekretariat: `Sekretariat: Kantor K3S / MKKS Kec. ${settings.kecamatan || 'Cigemblong'}`,
    kontakSekretariat: `Kabupaten ${settings.kabupaten || 'Lebak'}, Provinsi ${settings.provinsi || 'Banten'} | Kode Pos ${settings.kodePos || '42395'}`,
    logo: LOGO_MKKS_PRESET,
  };

  // Current active Kop values
  const activeKopConfig: KopConfig = isKkg
    ? { ...defaultKkgKop, ...settings.kopKkg }
    : isMkks
    ? { ...defaultMkksKop, ...settings.kopMkks }
    : {};

  // Local form state for the editor modal
  const [formConfig, setFormConfig] = useState<KopConfig>(activeKopConfig);

  const handleOpenModal = () => {
    setFormConfig(isKkg ? { ...defaultKkgKop, ...settings.kopKkg } : { ...defaultMkksKop, ...settings.kopMkks });
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const processedUrl = await processUploadedLogo(file);
      setFormConfig((prev) => ({ ...prev, logo: processedUrl }));
      showToast?.('Logo baru berhasil diproses!', 'success');
    } catch (err: any) {
      showToast?.(err?.message || 'Gagal memproses gambar logo.', 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveKop = () => {
    if (!onUpdateSettings) return;

    if (isKkg) {
      const updated: AppSettings = {
        ...settings,
        kopKkg: formConfig,
      };
      onUpdateSettings(updated);
      showToast?.('Kop Surat & Logo KKG berhasil diperbarui!', 'success');
    } else if (isMkks) {
      const updated: AppSettings = {
        ...settings,
        kopMkks: formConfig,
      };
      onUpdateSettings(updated);
      showToast?.('Kop Surat & Logo MKKS berhasil diperbarui!', 'success');
    }
    setModalOpen(false);
  };

  const handleResetKop = () => {
    if (isKkg) {
      setFormConfig(defaultKkgKop);
    } else {
      setFormConfig(defaultMkksKop);
    }
    showToast?.('Format kop direset ke standar bawaan.', 'info');
  };

  // Standard School Kop (Following Pengaturan like Tanda Terima)
  const kab = (settings.kabupaten || 'LEBAK').toUpperCase();
  const sek = (settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase();
  const kec = (settings.kecamatan || 'CIGEMBLONG').toUpperCase();
  const desa = settings.desaKelurahan || 'Cibungur';
  const alamat = settings.alamat || 'Kp. Pasar Kupa';
  const npsn = settings.npsn || '20602599';
  const email = settings.emailSekolah || 'sdnnegerisatucibungur@gmail.com';
  const kodePos = settings.kodePos || '42395';
  const logoSekolah = settings.logoSekolah || LOGO_PEMKAB_LEBAK;

  return (
    <div className={`relative pb-2 mb-3 font-sans ${className}`}>
      {/* Scope Indicator & Quick Edit Button (Only in interactive browser view) */}
      <div className="no-print flex items-center justify-between mb-2 pb-1 border-b border-dashed border-slate-200">
        <div className="flex items-center space-x-2">
          {isKkg ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Kop Khusus KKG (Kelompok Kerja Guru)</span>
            </span>
          ) : isMkks ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
              <ShieldCheck className="w-3 h-3 text-blue-700" />
              <span>Kop Khusus MKKS / K3S (Kepala Sekolah)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              <Building className="w-3 h-3 text-slate-600" />
              <span>Kop Satuan Pendidikan (Mengikuti Pengaturan Sekolah)</span>
            </span>
          )}
        </div>

        {isSpecialScope && onUpdateSettings && (
          <button
            type="button"
            onClick={handleOpenModal}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
            title={`Ubah kop dan ganti logo khusus ${isKkg ? 'KKG' : 'MKKS'}`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Ubah Kop & Logo {isKkg ? 'KKG' : 'MKKS'}</span>
          </button>
        )}
      </div>

      {/* HEADER SURAT UTAMA */}
      <div className="flex items-start">
        {/* LOGO KIRI */}
        <div className="w-20 pt-1 shrink-0 flex justify-center">
          {isSpecialScope ? (
            <div className="relative group">
              <img
                src={activeKopConfig.logo || (isKkg ? LOGO_KKG_PRESET : LOGO_MKKS_PRESET)}
                alt={isKkg ? 'Logo KKG' : 'Logo MKKS'}
                className="w-16 h-20 object-contain drop-shadow-xs"
              />
              {onUpdateSettings && (
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="no-print absolute inset-0 bg-black/40 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-bold cursor-pointer"
                  title="Klik untuk ubah logo"
                >
                  <Upload className="w-3.5 h-3.5 mb-0.5" />
                  <span>Ganti</span>
                </button>
              )}
            </div>
          ) : (
            <img
              src={logoSekolah}
              alt="Logo Satuan Pendidikan"
              className="w-16 h-20 object-contain drop-shadow-xs"
            />
          )}
        </div>

        {/* TEKS KOP KEDINASAN (TENGAH) */}
        <div className="grow text-center pr-20 space-y-0.5">
          {isSpecialScope ? (
            <>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wider leading-tight">
                {activeKopConfig.instansiInduk || 'PEMERINTAH KABUPATEN LEBAK'}
              </h4>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide leading-tight">
                {activeKopConfig.dinas || 'DINAS PENDIDIKAN'}
              </h3>
              <h2 className="font-black text-base sm:text-lg text-slate-950 uppercase tracking-wide leading-tight">
                {activeKopConfig.namaOrganisasi || (isKkg ? 'KELOMPOK KERJA GURU (KKG) GUGUS 02' : 'MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)')}
              </h2>
              {activeKopConfig.subOrganisasi && (
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide leading-tight">
                  {activeKopConfig.subOrganisasi}
                </h4>
              )}
              <p className="text-[10px] sm:text-[10.5px] text-slate-700 leading-tight mt-1">
                {activeKopConfig.alamatSekretariat}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight">
                {activeKopConfig.kontakSekretariat}
              </p>
            </>
          ) : (
            /* Standar Pengaturan Sekolah (Persis Kop Tanda Terima) */
            <>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide leading-tight">
                PEMERINTAH KABUPATEN {kab}
              </h4>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wide leading-tight">
                DINAS PENDIDIKAN
              </h3>
              <h2 className="font-black text-base sm:text-lg text-slate-950 uppercase tracking-wide leading-tight">
                UPTD SATUAN PENDIDIKAN {sek}
              </h2>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 uppercase tracking-wide leading-tight">
                KECAMATAN {kec}
              </h4>
              <p className="text-[10px] sm:text-[10.5px] text-slate-700 leading-tight mt-1">
                Alamat: {alamat}, Desa {desa}, Kecamatan {kec}, Kabupaten {kab}, Provinsi {settings.provinsi || 'Banten'}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight">
                NPSN: {npsn}, Email: {email}, Kode Pos {kodePos}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Garis Ganda Kop Surat Resmi Kedinasan */}
      <div className="mt-2.5">
        <div className="border-t-[2.5px] border-slate-950"></div>
        <div className="border-t-[1px] border-slate-950 mt-[1.5px]"></div>
      </div>

      {/* MODAL UBAH KOP & LOGO KKG / MKKS */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs no-print">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl text-white ${isKkg ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Pengaturan Kop & Logo Khusus {isKkg ? 'KKG' : 'MKKS'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan identitas kop dan ganti logo resmi organisasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Bagian Ganti Logo */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-800">
                  Logo {isKkg ? 'KKG' : 'MKKS'} (Bisa Diubah / Diunggah)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-20 border border-slate-300 rounded-lg bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                    {formConfig.logo ? (
                      <img
                        src={formConfig.logo}
                        alt="Preview Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'Memproses...' : 'Unggah Logo Baru (PNG/JPG/SVG)'}</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormConfig((prev) => ({
                            ...prev,
                            logo: isKkg ? LOGO_KKG_PRESET : LOGO_MKKS_PRESET,
                          }))
                        }
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-1 px-2 border border-slate-300 rounded-lg text-[11px] cursor-pointer"
                      >
                        Preset {isKkg ? 'KKG' : 'MKKS'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormConfig((prev) => ({ ...prev, logo: LOGO_TUT_WURI }))}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-1 px-2 border border-slate-300 rounded-lg text-[11px] cursor-pointer"
                      >
                        Tut Wuri
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormConfig((prev) => ({ ...prev, logo: LOGO_PEMKAB_LEBAK }))}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-1 px-2 border border-slate-300 rounded-lg text-[11px] cursor-pointer"
                      >
                        Pemkab
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Teks Kop */}
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Baris 1: Instansi Induk
                  </label>
                  <input
                    type="text"
                    value={formConfig.instansiInduk || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, instansiInduk: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="PEMERINTAH KABUPATEN LEBAK"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Baris 2: Dinas / Lembaga
                  </label>
                  <input
                    type="text"
                    value={formConfig.dinas || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, dinas: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="DINAS PENDIDIKAN"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Baris 3: Nama Organisasi (Teks Tebal Utama)
                  </label>
                  <input
                    type="text"
                    value={formConfig.namaOrganisasi || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, namaOrganisasi: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                    placeholder={isKkg ? 'KELOMPOK KERJA GURU (KKG) GUGUS 02' : 'MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)'}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Baris 4: Sub Organisasi / Wilayah / Kecamatan
                  </label>
                  <input
                    type="text"
                    value={formConfig.subOrganisasi || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, subOrganisasi: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    placeholder="KECAMATAN CIGEMBLONG"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alamat Sekretariat
                  </label>
                  <input
                    type="text"
                    value={formConfig.alamatSekretariat || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, alamatSekretariat: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    placeholder="Sekretariat: SDN 1 Cibungur, Kp. Pasarkupa RT 02/03"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kontak Sekretariat / Email / Kode Pos
                  </label>
                  <input
                    type="text"
                    value={formConfig.kontakSekretariat || ''}
                    onChange={(e) => setFormConfig({ ...formConfig, kontakSekretariat: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    placeholder="Desa Cibungur, Kec. Cigemblong 42395 | Email: kkg.cigemblong@gmail.com"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={handleResetKop}
                className="text-slate-600 hover:text-slate-800 font-semibold text-xs flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bawaan</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveKop}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
