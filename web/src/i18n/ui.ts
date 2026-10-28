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
  | 'footer.rights'
  | 'placeholder.soon'
  | 'home.title'
  | 'site.description'
  | 'job.apply'
  | 'job.subject'
  | 'job.responsibilities'
  | 'job.qualifications'
  | 'job.benefits'
  | 'job.all'
  | 'form.title'
  | 'form.name'
  | 'form.email'
  | 'form.phone'
  | 'form.topic'
  | 'form.topic.choose'
  | 'form.message'
  | 'form.submit'
  | 'form.sending'
  | 'form.success'
  | 'form.error.required'
  | 'form.error.verify'
  | 'form.error.rate'
  | 'form.error.unavailable'
  | 'form.error.failed';

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
    'footer.rights': 'Hak cipta dilindungi.',
    'placeholder.soon': 'Konten halaman ini sedang disiapkan.',
    'job.apply': 'Lamar lewat Email',
    'job.subject': 'Lamaran',
    'job.responsibilities': 'Tanggung Jawab',
    'job.qualifications': 'Kualifikasi',
    'job.benefits': 'Benefit',
    'job.all': 'Semua lowongan',
    'form.title': 'Kirim pesan langsung',
    'form.name': 'Nama',
    'form.email': 'Alamat email',
    'form.phone': 'Telepon (opsional)',
    'form.topic': 'Topik',
    'form.topic.choose': 'Pilih topik',
    'form.message': 'Pesan',
    'form.submit': 'Kirim pesan',
    'form.sending': 'Mengirim…',
    'form.success': 'Terima kasih. Pesan Anda sudah kami terima dan tim PROMIND akan menghubungi Anda.',
    'form.error.required': 'Mohon lengkapi kolom yang ditandai: nama, email yang valid, topik, dan pesan minimal 10 karakter.',
    'form.error.verify': 'Verifikasi keamanan belum selesai. Coba lagi sebentar lagi.',
    'form.error.rate': 'Terlalu banyak pesan dari jaringan Anda. Coba lagi nanti, atau kirim email langsung ke',
    'form.error.unavailable': 'Pesan belum bisa terkirim saat ini. Silakan kirim email langsung ke',
    'form.error.failed': 'Pesan tidak dapat dikirim. Periksa isian Anda, atau kirim email langsung ke',
    'home.title': 'Manajemen properti terintegrasi',
    'site.description': 'PROMIND menyediakan layanan manajemen properti terintegrasi, dari persiapan operasional dan asesmen gedung hingga engineering, HSE, dan layanan tenant.',
  },
  en: {
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.portfolio': 'Portfolio',
    'nav.research': 'Insights',
    'nav.about': 'About',
    'nav.careers': 'Careers',
    'nav.contact': 'Contact',
    'nav.menu': 'Open menu',
    'nav.skip': 'Skip to main content',
    'lang.switch': 'Beralih ke Bahasa Indonesia',
    'lang.choose': 'Choose a language',
    'footer.rights': 'All rights reserved.',
    'placeholder.soon': 'This page is being prepared.',
    'job.apply': 'Apply by Email',
    'job.subject': 'Application',
    'job.responsibilities': 'Responsibilities',
    'job.qualifications': 'Qualifications',
    'job.benefits': 'Benefits',
    'job.all': 'All open roles',
    'form.title': 'Send us a message',
    'form.name': 'Name',
    'form.email': 'Email address',
    'form.phone': 'Phone (optional)',
    'form.topic': 'Topic',
    'form.topic.choose': 'Choose a topic',
    'form.message': 'Message',
    'form.submit': 'Send message',
    'form.sending': 'Sending…',
    'form.success': 'Thank you. We received your message and the PROMIND team will get back to you.',
    'form.error.required': 'Please complete the highlighted fields: name, a valid email, topic, and a message of at least 10 characters.',
    'form.error.verify': 'The security check has not finished. Please try again in a moment.',
    'form.error.rate': 'Too many messages from your network. Please try again later, or email us directly at',
    'form.error.unavailable': 'We could not send your message right now. Please email us directly at',
    'form.error.failed': 'Your message could not be sent. Check your details, or email us directly at',
    'home.title': 'Integrated property management',
    'site.description': 'PROMIND provides integrated property management, from pre-opening operations and building assessments to engineering, HSE, and tenant services.',
  },
};

export function t(lang: Locale, key: UiKey): string {
  return UI[lang][key];
}
