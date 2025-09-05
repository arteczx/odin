# Odin Firmware Intelligence

Platform web terintegrasi untuk mengotomatisasi proses reconnaissance dan analisis permukaan serangan (attack surface) pada firmware perangkat keras.

## Struktur Proyek

```
odin/
├── frontend/          # Web UI (React/Vue.js)
├── server/           # Backend API dan analisis engine
└── README.md
```

## Fitur Utama

- **Upload & Analisis Firmware**: Mendukung format .bin, .img, .hex
- **Ekstraksi Otomatis**: Menggunakan binwalk untuk ekstraksi filesystem
- **Analisis Statis**: Pencarian informasi sensitif, CVE, dan kerentanan
- **OSINT Integration**: Pengumpulan intelligence dari sumber terbuka
- **Dashboard Interaktif**: Visualisasi hasil analisis real-time
- **Job Queue System**: Pemrosesan asinkron untuk multiple firmware

## Workflow

1. Upload firmware melalui web interface
2. Server melakukan ekstraksi dan analisis otomatis
3. Hasil disajikan dalam dashboard interaktif
4. Export laporan untuk dokumentasi

## Development Status

🚧 **In Development** - Server backend sedang dalam tahap pembangunan
