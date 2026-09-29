/**
 * Preset Logos & Image Optimization Helpers for Sekolah & Pemda
 */

// 1. Authentic Styled Logo Kabupaten Lebak (Vector SVG Data URL)
export const LOGO_PEMKAB_LEBAK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="120" height="140">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#172554"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <!-- Outer Shield -->
  <path d="M 60,6 L 108,18 C 108,76 86,118 60,134 C 34,118 12,76 12,18 Z" fill="url(#shieldGrad)" stroke="#facc15" stroke-width="4"/>
  <!-- Inner Rim -->
  <path d="M 60,14 L 100,24 C 100,72 80,110 60,124 C 40,110 20,72 20,24 Z" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Star at Top -->
  <polygon points="60,26 63,35 73,35 65,41 68,50 60,44 52,50 55,41 47,35 57,35" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
  <!-- Mountain / Tower Silhouette -->
  <path d="M 45,74 L 60,52 L 75,74 Z" fill="#38bdf8"/>
  <path d="M 32,82 L 48,64 L 64,82 Z" fill="#0284c7" opacity="0.7"/>
  <path d="M 56,82 L 72,64 L 88,82 Z" fill="#0284c7" opacity="0.7"/>
  <!-- Water Waves / Base -->
  <path d="M 28,88 Q 44,83 60,88 T 92,88" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  <path d="M 32,94 Q 46,90 60,94 T 88,94" fill="none" stroke="#facc15" stroke-width="2"/>
  <!-- Padi & Kapas Leaves -->
  <circle cx="36" cy="46" r="3.5" fill="#facc15"/>
  <circle cx="32" cy="56" r="3.5" fill="#facc15"/>
  <circle cx="31" cy="68" r="3.5" fill="#facc15"/>
  <circle cx="84" cy="46" r="3.5" fill="#ffffff" stroke="#16a34a" stroke-width="1"/>
  <circle cx="88" cy="56" r="3.5" fill="#ffffff" stroke="#16a34a" stroke-width="1"/>
  <circle cx="89" cy="68" r="3.5" fill="#ffffff" stroke="#16a34a" stroke-width="1"/>
  <!-- Banner Ribbon with "LEBAK" -->
  <path d="M 24,106 L 96,106 L 90,118 L 60,115 L 30,118 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1.5"/>
  <text x="60" y="115" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="9" fill="#0f172a" text-anchor="middle" letter-spacing="1.5">LEBAK</text>
</svg>
`)}`;

// 2. Authentic Tut Wuri Handayani (Vector SVG Data URL)
export const LOGO_TUT_WURI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <radialGradient id="tutGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </radialGradient>
  </defs>
  <!-- Outer Pentagon (Segi Lima Kemdikbud) -->
  <polygon points="60,6 112,44 92,106 28,106 8,44" fill="url(#tutGrad)" stroke="#facc15" stroke-width="3"/>
  <!-- Inner Contour -->
  <polygon points="60,12 104,45 88,98 32,98 16,45" fill="none" stroke="#ffffff" stroke-width="1.5"/>
  <!-- Blencong / Api Obor (Flame of Learning) -->
  <path d="M 60,24 C 64,34 72,42 66,54 C 64,48 58,46 56,40 C 54,46 48,50 46,56 C 42,44 54,34 60,24 Z" fill="#ef4444" stroke="#facc15" stroke-width="1"/>
  <circle cx="60" cy="46" r="4" fill="#facc15"/>
  <!-- Sayap / Wings of Wisdom -->
  <path d="M 60,56 C 44,52 30,62 26,74 C 36,72 48,68 60,70 C 72,68 84,72 94,74 C 90,62 76,52 60,56 Z" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
  <!-- Book / Buku Terbuka di Bawah -->
  <path d="M 34,78 Q 60,84 60,92 Q 60,84 86,78 L 84,86 Q 60,92 60,96 Q 60,92 36,86 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>
  <!-- Inscription -->
  <text x="60" y="103" font-family="Arial, sans-serif" font-weight="bold" font-size="6" fill="#facc15" text-anchor="middle" letter-spacing="0.5">TUT WURI HANDAYANI</text>
</svg>
`)}`;

// 2b. Official Kemendikdasmen Emblem with Wordmark (Vector SVG Data URL)
export const LOGO_KEMENDIKDASMEN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <defs>
    <radialGradient id="tutCircle" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0b4382"/>
    </radialGradient>
  </defs>
  <!-- Circular Tut Wuri Handayani Emblem -->
  <circle cx="40" cy="40" r="32" fill="url(#tutCircle)" stroke="#facc15" stroke-width="2.5"/>
  <circle cx="40" cy="40" r="28" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="2,1.5"/>
  <path d="M 40,20 C 43,26 48,31 44,38 C 42,35 38,33 37,29 C 35,33 32,36 30,39 C 28,32 35,26 40,20 Z" fill="#ef4444" stroke="#facc15" stroke-width="0.8"/>
  <circle cx="40" cy="34" r="2.8" fill="#facc15"/>
  <path d="M 40,40 C 29,37 19,44 16,51 C 23,50 31,48 40,49 C 49,48 57,50 64,51 C 61,44 51,37 40,40 Z" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
  <path d="M 23,54 Q 40,58 40,63 Q 40,58 57,54 L 55,59 Q 40,63 40,66 Q 40,63 25,59 Z" fill="#ffffff" stroke="#0b4382" stroke-width="0.8"/>

  <!-- Wordmark Text -->
  <text x="82" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="-0.8">
    <tspan fill="#0b4382">Kemen</tspan><tspan fill="#f59e0b">dikdasmen</tspan>
  </text>
  <text x="83" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="9" fill="#64748b" letter-spacing="0.8">
    DIREKTORAT SEKOLAH DASAR
  </text>
</svg>
`)}`;

// 3. Preset Emblem KKG (Kelompok Kerja Guru) Vector SVG Data URL
export const LOGO_KKG_PRESET = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130" width="120" height="130">
  <defs>
    <linearGradient id="kkgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="kkgGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <!-- Outer Circular Shield with Notches -->
  <circle cx="60" cy="56" r="48" fill="url(#kkgGrad)" stroke="#facc15" stroke-width="3.5"/>
  <circle cx="60" cy="56" r="42" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="3,2"/>
  <!-- Central Torch & Radiant Flame -->
  <path d="M 60,18 C 64,26 70,32 65,42 C 63,38 58,36 56,31 C 55,36 50,39 48,44 C 45,34 55,26 60,18 Z" fill="#f97316" stroke="#facc15" stroke-width="0.8"/>
  <circle cx="60" cy="36" r="3.5" fill="#facc15"/>
  <!-- Open Book of Knowledge -->
  <path d="M 34,54 Q 60,60 60,67 Q 60,60 86,54 L 84,62 Q 60,67 60,71 Q 60,67 36,62 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>
  <line x1="60" y1="67" x2="60" y2="71" stroke="#0f172a" stroke-width="1.5"/>
  <!-- Laurel / Padi of Excellence -->
  <path d="M 24,56 C 24,40 32,28 42,24" fill="none" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
  <path d="M 96,56 C 96,40 88,28 78,24" fill="none" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
  <!-- Base Ribbon Banner -->
  <path d="M 16,92 L 104,92 L 98,107 L 60,103 L 22,107 Z" fill="url(#kkgGold)" stroke="#ca8a04" stroke-width="1.5"/>
  <text x="60" y="103" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="9" fill="#064e3b" text-anchor="middle" letter-spacing="2">KKG</text>
  <text x="60" y="85" font-family="Arial, sans-serif" font-weight="bold" font-size="6.5" fill="#fef08a" text-anchor="middle" letter-spacing="0.5">GURU KREATIF</text>
</svg>
`)}`;

// 4. Preset Emblem MKKS / K3S (Musyawarah Kerja Kepala Sekolah) Vector SVG Data URL
export const LOGO_MKKS_PRESET = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130" width="120" height="130">
  <defs>
    <linearGradient id="mkksGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="mkksGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <!-- Outer Shield of Leadership -->
  <path d="M 60,8 L 104,20 C 104,74 84,106 60,118 C 36,106 16,74 16,20 Z" fill="url(#mkksGrad)" stroke="#facc15" stroke-width="3.5"/>
  <path d="M 60,15 L 97,25 C 97,70 79,98 60,109 C 41,98 23,70 23,25 Z" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="3,2"/>
  <!-- Star at Top Crest -->
  <polygon points="60,25 63,33 72,33 65,38 67,46 60,41 53,46 55,38 48,33 57,33" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>
  <!-- Open Book & Pillar of Education -->
  <path d="M 38,58 Q 60,64 60,70 Q 60,64 82,58 L 80,65 Q 60,70 60,74 Q 60,70 40,65 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>
  <!-- Laurel Garland of Honor -->
  <circle cx="34" cy="46" r="3" fill="#facc15"/>
  <circle cx="31" cy="56" r="3" fill="#facc15"/>
  <circle cx="33" cy="67" r="3" fill="#facc15"/>
  <circle cx="86" cy="46" r="3" fill="#facc15"/>
  <circle cx="89" cy="56" r="3" fill="#facc15"/>
  <circle cx="87" cy="67" r="3" fill="#facc15"/>
  <!-- Base Banner with MKKS -->
  <path d="M 20,86 L 100,86 L 94,99 L 60,96 L 26,99 Z" fill="url(#mkksGold)" stroke="#ca8a04" stroke-width="1.5"/>
  <text x="60" y="96" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="9" fill="#0f172a" text-anchor="middle" letter-spacing="1.5">MKKS</text>
  <text x="60" y="81" font-family="Arial, sans-serif" font-weight="bold" font-size="6" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">KEPALA SEKOLAH</text>
</svg>
`)}`;

/**
 * Optimize uploaded file (downscales & converts to clean PNG base64)
 * Supports PNG, JPEG, SVG, WebP.
 * Keeps memory footprint very small (~20KB - 40KB) for seamless localStorage and jsPDF support.
 */
export function processUploadedLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang diunggah harus berupa gambar (PNG, JPG, WebP, atau SVG).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Format berkas tidak valid.'));
        return;
      }

      // If it's already an SVG, keep it or render to canvas
      const img = new Image();
      img.onerror = () => {
        // If image object fails to load directly (some SVGs), return raw dataUrl if < 200KB
        if (file.size < 250000) {
          resolve(dataUrl);
        } else {
          reject(new Error('Gambar tidak dapat diproses.'));
        }
      };

      img.onload = () => {
        const MAX_DIM = 280;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(w, 1);
        canvas.height = Math.max(h, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        try {
          const pngUrl = canvas.toDataURL('image/png', 0.92);
          resolve(pngUrl);
        } catch {
          resolve(dataUrl);
        }
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
