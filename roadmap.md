# Roadmap SISTA AI

- [x] Migrasi awal: profil, peran, tabel surat, template, keamanan baris.
- [x] Template resmi Surat Tugas Sub Bagian Tata Usaha menggantikan template sampel.
- [x] Bangun halaman login dengan profil yang sudah ada.
- [x] Bangun daftar surat dengan filter status dan alur unggah, proses, tinjau, buat draf.
- [x] Akun pertama tersedia dan sesi akun yang diminta berhasil membuka daftar surat sebagai Admin.
- [x] Jalankan surat uji melalui akun pertama, unggah, proses, tinjau, unduh draf, periksa nomor dan tanggal: DOCX unduhan berisi Nomor: UJI-ST/001/TU/X/2026 dan Jakarta, 16 Oktober 2026; draf tetap tersedia setelah halaman dimuat ulang.
- [x] Periksa pengisian nomor dan tanggal pada kedua template resmi melalui pengujian dokumen.
- [x] Bangun arsip internal dengan filter dan unduhan Excel/CSV dari surat yang tersedia; surat uji tampil sebagai draf disetujui, kedua unduhan memuat nomor/tanggal yang benar, filter dan tautan draf terverifikasi melalui akun Endah.
- [x] Sederhanakan akses masuk: satu akun bersama, halaman login hanya meminta kata sandi bersama; beranda langsung menuju daftar surat bila sudah masuk.
- [x] Menu Bukti Pelatihan dibatalkan atas permintaan pengguna: navigasi, halaman, dan kode fitur dihapus; tabel database ditandai usang (tidak dihapus agar aplikasi tayang tidak terganggu).
- [x] Uji ulang lewat sesi akun bersama: unggah surat dan disposisi uji, proses AI, tinjau, buat dan unduh DOCX; nomor UJI-ST/002/TU/X/2026 dan Jakarta, 26 Oktober 2026 sesuai template resmi, tetap tersimpan setelah muat ulang.
- [ ] Verifikasi masuk dengan kata sandi bersama baru — menunggu kata sandi baru yang belum tersedia; sesi akun tidak memverifikasi sandi.
- [x] Riwayat Surat terverifikasi: 5 surat tersimpan (2 Proses, 3 Draf, 0 Resmi), pencarian nomor dan tanggal, filter bertahan setelah muat ulang, tautan membuka draf, akses terkunci ketika keluar, dan tampilan ponsel tanpa luapan halaman; 10 tes riwayat/arsip lulus.
- [ ] Tetapkan kata sandi bersama yang dapat dibagikan kepada pegawai, lalu uji login melalui formulir dengan sandi tersebut.
