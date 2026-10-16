import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const copy = {
  id: {
    nav: ['Layanan', 'Pendekatan', 'Sektor', 'Tentang'],
    contact: 'Hubungi kami', skip: 'Lewati ke konten',
    hero: ['Konsultan manajemen properti', 'Properti yang dikelola dengan baik,', 'bekerja lebih baik.', 'PROMIND mendampingi pemilik dan pengelola aset dalam merencanakan, menjalankan, dan meningkatkan kinerja properti. Keputusan yang jelas untuk operasional yang lebih terarah.', 'Diskusikan kebutuhan Anda', 'Lihat layanan', 'Visual ilustratif, bukan portofolio proyek PROMIND'],
    intro: ['Perspektif kami', 'Nilai sebuah aset dibentuk oleh keputusan sehari-hari.', 'Mulai dari pengalaman penghuni hingga kondisi teknis bangunan, setiap detail memengaruhi performa properti. Kami melihat aset secara menyeluruh agar strategi di atas kertas dapat dijalankan di lapangan.'],
    services: ['Yang kami kerjakan', 'Layanan untuk seluruh siklus aset.', 'Cakupan kerja dapat disesuaikan dengan tujuan, jenis aset, dan tahap pengelolaannya.'],
    serviceItems: [
      ['Manajemen properti & fasilitas', 'Perencanaan operasional, pemeliharaan bangunan, pengelolaan vendor, dan standar layanan bagi pengguna ruang.'],
      ['Strategi aset & konsultasi', 'Peninjauan kinerja aset, prioritas perbaikan, anggaran operasional, dan rencana pengelolaan jangka menengah.'],
      ['Manajemen proyek', 'Pendampingan renovasi, fit-out, dan peningkatan fasilitas melalui koordinasi biaya, mutu, serta jadwal.'],
      ['Keberlanjutan bangunan', 'Identifikasi peluang efisiensi sumber daya dan langkah operasional yang lebih bertanggung jawab.'],
    ],
    approach: ['Cara kerja', 'Pahami aset. Tetapkan prioritas. Jalankan dengan disiplin.', 'Kami memulai dari konteks bisnis dan kondisi properti, lalu menyusun langkah yang realistis untuk tim pemilik dan operasional.'],
    steps: [
      ['Dengarkan tujuan', 'Memahami kebutuhan pemilik, pengguna ruang, dan tantangan utama aset.'],
      ['Petakan kondisi', 'Meninjau data, proses kerja, dan kondisi lapangan sebagai dasar rekomendasi.'],
      ['Rancang langkah', 'Menetapkan prioritas, tanggung jawab, dan ukuran keberhasilan yang relevan.'],
      ['Pantau pelaksanaan', 'Meninjau hasil secara berkala dan menyesuaikan tindakan saat kondisi berubah.'],
    ],
    sectors: ['Properti yang kami layani', 'Setiap jenis properti punya ritme operasionalnya sendiri.', 'Kami menyesuaikan pendekatan dengan fungsi aset, kebutuhan pemilik, dan pengalaman orang yang menggunakannya.'],
    sectorItems: [
      ['Office building', 'Operasional gedung, fasilitas bersama, dan layanan tenant.'],
      ['Apartemen', 'Area bersama, sistem bangunan, dan kenyamanan penghuni.'],
      ['Mall', 'Fasilitas publik, koordinasi tenant, dan kesiapan operasional harian.'],
      ['Real estate', 'Pengelolaan kawasan dan perencanaan pemeliharaan aset.'],
    ],
    about: ['Tentang PROMIND', 'Pandangan strategis yang dekat dengan realitas operasional.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) berfokus pada hubungan antara strategi aset, operasional bangunan, dan pengalaman pengguna.', 'Kami percaya pengelolaan yang baik dimulai dari pemahaman yang tepat, komunikasi yang terbuka, dan konsistensi dalam pelaksanaan.'],
    closing: ['Mari berbicara', 'Mulai dari kebutuhan aset Anda.', 'Ceritakan jenis properti, tantangan yang dihadapi, dan hasil yang ingin dicapai. Kami akan membantu menentukan ruang lingkup diskusi awal.', 'Kirim email', 'Diskusi kebutuhan manajemen properti'],
    footer: { address: 'Alamat kantor', contact: 'Hubungi kami', standards: 'Sertifikasi ISO', back: 'Kembali ke atas', rights: 'Hak cipta dilindungi.' }
  },
  en: {
    nav: ['Services', 'Approach', 'Sectors', 'About'],
    contact: 'Contact us', skip: 'Skip to content',
    hero: ['Property management consultancy', 'Well-managed property', 'works better.', 'PROMIND supports asset owners and managers in planning, operating, and improving property performance. Clear decisions for more focused operations.', 'Discuss your requirements', 'View services', 'Illustrative image, not a PROMIND project'],
    intro: ['Our perspective', 'Asset value is shaped by everyday decisions.', 'From occupant experience to the condition of building systems, every detail affects property performance. We look at the asset as a whole so that strategy can work on the ground.'],
    services: ['What we do', 'Services across the asset lifecycle.', 'The scope of work can be tailored to your objectives, asset type, and stage of management.'],
    serviceItems: [
      ['Property & facilities management', 'Operational planning, building maintenance, vendor management, and service standards for occupants.'],
      ['Asset strategy & advisory', 'Performance review, improvement priorities, operating budgets, and medium-term management plans.'],
      ['Project management', 'Support for renovation, fit-out, and facility upgrades through cost, quality, and schedule coordination.'],
      ['Building sustainability', 'Identifying resource-efficiency opportunities and more responsible operational practices.'],
    ],
    approach: ['Our approach', 'Understand the asset. Set priorities. Execute with care.', 'We start with business context and property conditions, then develop practical steps for owners and operational teams.'],
    steps: [
      ['Understand the goal', 'Learn the needs of owners, occupants, and the asset’s main challenges.'],
      ['Assess the conditions', 'Review data, workflows, and on-site conditions before recommending action.'],
      ['Define the plan', 'Set priorities, responsibilities, and measures that matter.'],
      ['Review progress', 'Evaluate results regularly and adjust as conditions change.'],
    ],
    sectors: ['Properties we serve', 'Every property has its own operating rhythm.', 'Our approach reflects each asset’s purpose, the owner’s needs, and the experience of the people who use it.'],
    sectorItems: [
      ['Office buildings', 'Building operations, shared facilities, and tenant services.'],
      ['Apartments', 'Common areas, building systems, and resident experience.'],
      ['Shopping malls', 'Public facilities, tenant coordination, and daily operational readiness.'],
      ['Real estate', 'Estate management and asset maintenance planning.'],
    ],
    about: ['About PROMIND', 'Strategic thinking grounded in day-to-day operations.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) focuses on the connection between asset strategy, building operations, and occupant experience.', 'We believe effective management begins with sound understanding, open communication, and consistent execution.'],
    closing: ['Start a conversation', 'Tell us about your asset.', 'Share your property type, the challenges you face, and the outcomes you want. We can help shape an initial discussion.', 'Send an email', 'Property management enquiry'],
    footer: { address: 'Office address', contact: 'Contact us', standards: 'ISO certifications', back: 'Back to top', rights: 'All rights reserved.' }
  }
};

const ids = ['services', 'approach', 'sectors', 'about'];
const logo = '/images/promind-header-brand.png';

export default function App() {
  const [lang, setLang] = useState('id');
  const [menuOpen, setMenuOpen] = useState(false);
  const t = copy[lang];
  const email = 'corporate@promind.id';
  const mailLink = 'mailto:' + email + '?subject=' + encodeURIComponent(t.closing[4]);
  const links = ids.map((id, i) => <a key={id} href={'#' + id} onClick={() => setMenuOpen(false)}>{t.nav[i]}</a>);

  return <div className="site-shell">
    <a className="skip-link" href="#main">{t.skip}</a>
    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="#top" aria-label="PROMIND"><img src={logo} alt="PROMIND" /></a>
        <nav className="desktop-nav" aria-label="Main navigation">{links}</nav>
        <div className="header-actions">
          <button className="language-switch" type="button" aria-label={lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'} onClick={() => { setLang(lang === 'id' ? 'en' : 'id'); document.documentElement.lang = lang === 'id' ? 'en' : 'id'; }}>{lang === 'id' ? 'ID / EN' : 'EN / ID'}</button>
          <a className="header-contact" href="#contact">{t.contact} <ArrowUpRight size={16} /></a>
          <button className="menu-button" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </div>
      {menuOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{links}<a href="#contact" onClick={() => setMenuOpen(false)}>{t.contact}</a></nav>}
    </header>
    <main id="main">
      <section id="top" className="hero">
        <div className="wrap hero-content">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero[0]}</p>
            <h1>{t.hero[1]} <em>{t.hero[2]}</em></h1>
            <p className="hero-description">{t.hero[3]}</p>
            <div className="hero-actions"><a className="button button-primary" href="#contact">{t.hero[4]} <ArrowUpRight size={18} /></a><a className="text-link" href="#services">{t.hero[5]}</a></div>
          </div>
        </div>
        <div className="hero-image" role="img" aria-label={lang === 'id' ? 'Ilustrasi arsitektur gedung komersial' : 'Illustration of commercial building architecture'}></div>
        <p className="hero-image-note">{t.hero[6]}</p>
      </section>

      <section className="intro section-pad"><div className="wrap intro-grid"><p className="eyebrow">{t.intro[0]}</p><div><h2>{t.intro[1]}</h2><p>{t.intro[2]}</p></div></div></section>

      <section id="services" className="services section-pad"><div className="wrap">
        <div className="section-heading"><p className="eyebrow">{t.services[0]}</p><h2>{t.services[1]}</h2><p>{t.services[2]}</p></div>
        <div className="service-list">{t.serviceItems.map(([title, body], i) => <article className="service-row" key={title}><span className="service-index">{String(i + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </div></section>

      <section id="approach" className="approach section-pad"><div className="wrap approach-grid">
        <div className="approach-lead"><p className="eyebrow">{t.approach[0]}</p><h2>{t.approach[1]}</h2><p>{t.approach[2]}</p></div>
        <div className="approach-steps">{t.steps.map(([title, body], i) => <div className="approach-step" key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div>
      </div></section>

      <section id="sectors" className="sectors section-pad"><div className="wrap sectors-grid"><div><p className="eyebrow">{t.sectors[0]}</p><h2>{t.sectors[1]}</h2><p>{t.sectors[2]}</p></div><ul>{t.sectorItems.map(([title, description]) => <li key={title}><strong>{title}</strong><span>{description}</span></li>)}</ul></div></section>

      <section id="about" className="about section-pad"><div className="wrap about-grid"><div><p className="eyebrow">{t.about[0]}</p><h2>{t.about[1]}</h2></div><div className="about-copy"><p>{t.about[2]}</p><p>{t.about[3]}</p></div></div></section>

      <section id="contact" className="contact section-pad"><div className="wrap contact-grid"><div><p className="eyebrow">{t.closing[0]}</p><h2>{t.closing[1]}</h2></div><div className="contact-action"><p>{t.closing[2]}</p><a className="button button-light" href={mailLink}>{t.closing[3]} <ArrowUpRight size={18} /></a><span>{email}</span></div></div></section>
    </main>
    <footer className="site-footer">
      <div className="wrap footer-main">
        <div className="footer-brand">
          <div className="footer-logo"><img src={logo} alt="PROMIND" /></div>
          <strong>PT Properti Manajemen Inovasi Indonesia</strong>
          <p>Elevating Indonesia’s Real Estate</p>
        </div>
        <div className="footer-column">
          <h2>{t.footer.address}</h2>
          <address>Mangkuluhur City Office Tower One<br />Jl. Gatot Subroto Kav. 1–3<br />Karet Semanggi, Setiabudi<br />Jakarta Selatan 12930, Indonesia</address>
        </div>
        <div className="footer-column">
          <h2>{t.footer.contact}</h2>
          <a className="footer-email" href={'mailto:' + email}>{email}</a>
          <a href="#contact">{t.contact} <ArrowUpRight size={14} /></a>
        </div>
        <div className="footer-column footer-standards">
          <h2>{t.footer.standards}</h2>
          <ul>
            <li><strong>ISO 41001</strong><span>Facility management</span></li>
            <li><strong>ISO 55001</strong><span>Asset management</span></li>
            <li><strong>ISO 9001</strong><span>Quality management</span></li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} PT Properti Manajemen Inovasi Indonesia. {t.footer.rights}</span>
        <a href="#top">{t.footer.back}</a>
      </div>
    </footer>
  </div>;
}
