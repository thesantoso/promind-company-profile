import type { Locale } from './locales';

export type UiKey =
  | 'nav.home'
  | 'nav.services'
  | 'nav.portfolio'
  | 'nav.research'
  | 'nav.about'
  | 'nav.careers'
  | 'nav.contact'
  | 'nav.menu'
  | 'nav.skip'
  | 'lang.switch'
  | 'lang.choose'
  | 'placeholder.soon'
  | 'home.title'
  | 'site.description'
  | 'job.apply'
  | 'job.subject'
  | 'job.responsibilities'
  | 'job.qualifications'
  | 'job.benefits'
  | 'job.all'
  | 'form.sending'
  | 'form.success'
  | 'form.error.required'
  | 'form.error.verify'
  | 'form.error.rate'
  | 'form.error.unavailable'
  | 'form.error.failed'
  | 'nav.cta'
  | 'nav.close'
  | 'footer.office'
  | 'footer.navigation'
  | 'footer.standards'
  | 'footer.top'
  | 'clients.pause'
  | 'clients.list'
  | 'clients.play'
  | 'job.department'
  | 'job.type'
  | 'job.location'
  | 'job.experience'
  | 'job.posted'
  | 'job.inThisRole'
  | 'job.howToApply'
  | 'job.kicker.responsibilities'
  | 'job.kicker.qualifications'
  | 'job.kicker.benefits'
  | 'job.heading.responsibilities'
  | 'job.heading.qualifications'
  | 'job.heading.benefits'
  | 'job.applyEyebrow'
  | 'job.applyTitle'
  | 'job.applyBody'
  | 'job.applyEmail'
  | 'job.applySubject'
  | 'job.applyAttachments'
  | 'job.applyAttachmentsValue'
  | 'job.fullName'
  | 'job.share'
  | 'job.shareTitle'
  | 'job.copyLink'
  | 'job.linkCopied'
  | 'job.linkCopyFailed'
  | 'job.shareMore'
  | 'job.shareFailed'
  | 'job.copyEmail'
  | 'job.emailCopied'
  | 'job.emailCopyFailed'
  | 'job.shareTo'
  | 'job.mailBody'
  | 'job.details'
  | 'job.onThisPage';

export const UI: Record<Locale, Record<UiKey, string>> = {
  id: {
    'nav.home': 'Beranda',
    'nav.services': 'Layanan',
    'nav.portfolio': 'Portofolio',
    'nav.research': 'Wawasan',
    'nav.about': 'Tentang Kami',
    'nav.careers': 'Karir',
    'nav.contact': 'Kontak',
    'nav.menu': 'Buka menu',
    'nav.skip': 'Lewati ke konten utama',
    'lang.switch': 'Switch to English',
    'lang.choose': 'Pilih bahasa',
    'placeholder.soon': 'Konten halaman ini sedang disiapkan.',
    'job.apply': 'Kirim lamaran via email',
    'job.subject': 'Lamaran',
    'job.responsibilities': 'Tanggung jawab',
    'job.qualifications': 'Kualifikasi',
    'job.benefits': 'Benefit',
    'job.all': 'Kembali ke karir',
    'form.sending': 'Mengirim…',
    'form.success': 'Terima kasih. Pesan Anda sudah kami terima dan tim PROMIND akan menghubungi Anda.',
    'form.error.required': 'Mohon lengkapi kolom yang ditandai: nama, perusahaan, email yang valid, dan nomor telepon.',
    'form.error.verify': 'Verifikasi keamanan belum selesai. Coba lagi sebentar lagi.',
    'form.error.rate': 'Terlalu banyak pesan dari jaringan Anda. Coba lagi nanti, atau kirim email langsung ke',
    'form.error.unavailable': 'Pesan belum bisa terkirim saat ini. Silakan kirim email langsung ke',
    'form.error.failed': 'Pesan tidak dapat dikirim. Periksa isian Anda, atau kirim email langsung ke',
    'home.title': 'Manajemen properti terintegrasi',
    'site.description': 'PROMIND menyediakan layanan manajemen properti terintegrasi, dari persiapan operasional dan asesmen gedung hingga engineering, HSE, dan layanan tenant.',
    'nav.cta': 'Hubungi Kami',
    'nav.close': 'Tutup menu',
    'footer.office': 'Kantor',
    'footer.navigation': 'Navigasi',
    'footer.standards': 'Standar & Sistem',
    'footer.top': 'Kembali ke atas',
    'clients.pause': 'Jeda daftar klien',
    'clients.play': 'Jalankan daftar klien',
    'clients.list': 'Daftar klien PROMIND',
    'job.department': 'Departemen',
    'job.type': 'Tipe kerja',
    'job.location': 'Lokasi penempatan',
    'job.experience': 'Pengalaman',
    'job.posted': 'Tanggal Publikasi',
    'job.inThisRole': 'Dalam posisi ini',
    'job.howToApply': 'Cara melamar',
    'job.kicker.responsibilities': 'Lingkup pekerjaan',
    'job.kicker.qualifications': 'Kriteria kandidat',
    'job.kicker.benefits': 'Lingkungan kerja',
    'job.heading.responsibilities': 'Tanggung Jawab Utama & Eksekusi Operasional',
    'job.heading.qualifications': 'Kualifikasi & Persyaratan Kompetensi',
    'job.heading.benefits': 'Kompensasi & Dukungan Profesional',
    'job.applyEyebrow': 'Pengajuan Lamaran',
    'job.applyTitle': 'Kirimkan Lamaran Anda',
    'job.applyBody': 'Kirim CV terbaru dan dokumen pendukung ke alamat rekrutmen berikut. Cantumkan posisi yang dilamar pada subjek email.',
    'job.applyEmail': 'Email tujuan',
    'job.applySubject': 'Subjek email',
    'job.applyAttachments': 'Berkas lampiran',
    'job.applyAttachmentsValue': 'CV terbaru (PDF) dan sertifikat pendukung',
    'job.fullName': 'Nama Lengkap',
    'job.share': 'Bagikan lowongan:',
    'job.shareTitle': 'Lowongan {title} di PROMIND',
    'job.copyLink': 'Salin tautan lowongan',
    'job.linkCopied': '✓ Tautan lowongan berhasil disalin!',
    'job.linkCopyFailed': 'Tautan gagal disalin. Silakan coba lagi.',
    'job.shareMore': 'Bagikan lainnya',
    'job.shareFailed': 'Opsi berbagi tidak dapat dibuka.',
    'job.copyEmail': 'Salin email',
    'job.emailCopied': 'Tersalin',
    'job.emailCopyFailed': 'Email gagal disalin. Coba lagi.',
    'job.shareTo': 'Bagikan ke',
    'job.mailBody': 'Yth. Tim Human Resources PROMIND,\n\nSaya ingin mengajukan lamaran untuk posisi {title}.\nCV terbaru dan dokumen pendukung terlampir untuk pertimbangan.\n\nNama lengkap:\nNomor telepon:',
    'job.details': 'Detail posisi',
    'job.onThisPage': 'Isi halaman',
  },
  en: {
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.portfolio': 'Portfolio',
    'nav.research': 'Insights',
    'nav.about': 'About Us',
    'nav.careers': 'Careers',
    'nav.contact': 'Contact',
    'nav.menu': 'Open menu',
    'nav.skip': 'Skip to main content',
    'lang.switch': 'Beralih ke Bahasa Indonesia',
    'lang.choose': 'Choose a language',
    'placeholder.soon': 'This page is being prepared.',
    'job.apply': 'Apply via email',
    'job.subject': 'Application',
    'job.responsibilities': 'Responsibilities',
    'job.qualifications': 'Qualifications',
    'job.benefits': 'Benefits',
    'job.all': 'Back to careers',
    'form.sending': 'Sending…',
    'form.success': 'Thank you. We received your message and the PROMIND team will get back to you.',
    'form.error.required': 'Please complete the highlighted fields: name, company, a valid email, and phone number.',
    'form.error.verify': 'The security check has not finished. Please try again in a moment.',
    'form.error.rate': 'Too many messages from your network. Please try again later, or email us directly at',
    'form.error.unavailable': 'We could not send your message right now. Please email us directly at',
    'form.error.failed': 'Your message could not be sent. Check your details, or email us directly at',
    'home.title': 'Integrated property management',
    'site.description': 'PROMIND provides integrated property management, from pre-opening operations and building assessments to engineering, HSE, and tenant services.',
    'nav.cta': 'Contact Us',
    'nav.close': 'Close menu',
    'footer.office': 'Office',
    'footer.navigation': 'Navigation',
    'footer.standards': 'Standards & Systems',
    'footer.top': 'Back to top',
    'clients.pause': 'Pause marquee',
    'clients.play': 'Play marquee',
    'clients.list': 'PROMIND clients',
    'job.department': 'Department',
    'job.type': 'Employment type',
    'job.location': 'Location',
    'job.experience': 'Experience',
    'job.posted': 'Date Posted',
    'job.inThisRole': 'In this role',
    'job.howToApply': 'How to apply',
    'job.kicker.responsibilities': 'Role scope',
    'job.kicker.qualifications': 'Candidate criteria',
    'job.kicker.benefits': 'Working environment',
    'job.heading.responsibilities': 'Key Responsibilities & Operational Execution',
    'job.heading.qualifications': 'Qualifications & Competency Requirements',
    'job.heading.benefits': 'Compensation & Professional Support',
    'job.applyEyebrow': 'How to Apply',
    'job.applyTitle': 'Submit Your Application',
    'job.applyBody': 'Send your latest CV and supporting documents to the recruitment email below. Include the position in the subject line.',
    'job.applyEmail': 'Recruitment email',
    'job.applySubject': 'Email subject',
    'job.applyAttachments': 'Attachments',
    'job.applyAttachmentsValue': 'Latest CV (PDF) and relevant certificates',
    'job.fullName': 'Full Name',
    'job.share': 'Share position:',
    'job.shareTitle': '{title} at PROMIND',
    'job.copyLink': 'Copy job link',
    'job.linkCopied': '✓ Link copied!',
    'job.linkCopyFailed': 'Could not copy link.',
    'job.shareMore': 'More sharing options',
    'job.shareFailed': 'Sharing options unavailable.',
    'job.copyEmail': 'Copy email',
    'job.emailCopied': 'Copied',
    'job.emailCopyFailed': 'Could not copy the email. Please try again.',
    'job.shareTo': 'Share to',
    'job.mailBody': 'Dear PROMIND Human Resources Team,\n\nI would like to apply for the {title} position.\nMy latest CV and supporting documents are attached for your consideration.\n\nFull name:\nPhone number:',
    'job.details': 'Position details',
    'job.onThisPage': 'On this page',
  },
};

export function t(lang: Locale, key: UiKey): string {
  return UI[lang][key];
}
