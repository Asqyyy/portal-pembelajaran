# Portal Pembelajaran

Platform belajar online terintegrasi untuk Madrasah Aliyah dan SMA.

## Fitur Utama
- **Dashboard & Kursus**: Temukan dan enroll ke berbagai mata pelajaran.
- **Kuis Lengkap**: Ujian dengan timer, deadline hitung mundur, auto-grader untuk pilihan ganda, dan manual essay grader.
- **Gradebook**: Rekap nilai lengkap dan transparan.
- **Forum Diskusi**: Ruang tanya jawab antar siswa dan guru.
- **Absensi QR**: Scan kehadiran secara instan menggunakan QR Code dinamis.

## Teknologi
- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Routing**: React State-based routing (akan dimigrasi ke React Router)
- **Komponen**: Animasi kustom, Glassmorphism design

## Cara Menjalankan (Lokal)
1. Install dependensi:
   ```bash
   npm install
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```

## Keamanan
- Role tidak dapat dimanipulasi melalui antarmuka pengguna; diverifikasi dari server/JWT.
- Jangan menyimpan kunci sensitif dalam `.env` di sistem kontrol versi.
