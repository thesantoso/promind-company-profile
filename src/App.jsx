import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const copy = {
  id: {
    nav: ['Layanan', 'Pendekatan', 'Di lapangan', 'Sektor', 'Tentang'],
    contact: 'Hubungi kami', skip: 'Lewati ke konten',
    hero: ['Konsultan manajemen properti', 'Aset terjaga.', 'Bisnis lebih siap melangkah.', 'PROMIND membantu pemilik dan pengelola properti menjaga kinerja aset melalui strategi yang jelas dan operasional yang rapi. Dari kondisi bangunan hingga pengalaman penggunanya, setiap keputusan punya alasan.', 'Bicarakan aset Anda', 'Jelajahi layanan', 'Visual ilustratif, bukan portofolio proyek PROMIND'],
    intro: ['Perspektif kami', 'Performa properti dibangun setiap hari.', 'Gedung yang nyaman dan andal lahir dari banyak keputusan kecil: kapan sistem diperiksa, apa yang perlu diperbaiki lebih dulu, dan bagaimana layanan dijalankan. Kami membantu melihat gambaran besarnya tanpa melewatkan hal-hal yang terjadi di lapangan.'],
    services: ['Layanan kami', 'Dari rencana hingga operasional harian.', 'Kami menyesuaikan lingkup pendampingan dengan jenis properti, kondisi aset, dan tujuan pemiliknya.'],
    serviceItems: [
      ['Manajemen properti & fasilitas', 'Menata operasional gedung, jadwal pemeliharaan, kinerja vendor, dan layanan agar properti siap digunakan setiap hari.'],
      ['Strategi aset & konsultasi', 'Membaca kondisi dan biaya operasional aset, lalu membantu menentukan prioritas perbaikan serta arah pengelolaannya.'],
      ['Manajemen proyek', 'Mendampingi renovasi, fit-out, dan peningkatan fasilitas dengan perhatian pada biaya, mutu, jadwal, dan dampaknya bagi operasional.'],
      ['Keberlanjutan bangunan', 'Meninjau penggunaan sumber daya dan mencari langkah efisiensi yang masuk akal untuk dijalankan di gedung.'],
    ],
    approach: ['Cara kerja', 'Berangkat dari kondisi nyata, lalu bergerak dengan rencana.', 'Setiap properti punya tantangan sendiri. Kami mulai dengan memahami tujuan pemilik dan kondisi di lapangan, kemudian menyusun langkah yang bisa dijalankan oleh tim operasional.'],
    steps: [
      ['Pahami kebutuhannya', 'Kami mendengar tujuan pemilik, kebutuhan pengguna, dan kendala yang paling terasa dalam operasional.'],
      ['Periksa kondisi aset', 'Data, proses kerja, dan temuan di lapangan kami lihat bersama agar masalahnya jelas.'],
      ['Susun prioritas', 'Langkah kerja, penanggung jawab, dan anggaran diselaraskan dengan kebutuhan aset.'],
      ['Tinjau hasilnya', 'Pelaksanaan ditinjau berkala agar rencana tetap relevan saat kondisi berubah.'],
    ],
    fieldwork: ['Di lapangan', 'Detail di lapangan menentukan langkah berikutnya.', 'Asesmen bangunan, pemeliharaan terjadwal, dan keselamatan kerja membantu menjaga properti tetap siap digunakan.', 'Foto editorial sebagai ilustrasi aktivitas, bukan dokumentasi tim atau proyek PROMIND.', 'Sumber foto'],
    fieldworkItems: [
      ['Asesmen gedung', 'Kondisi bangunan diperiksa untuk melihat apa yang perlu ditangani sekarang dan apa yang bisa direncanakan.', 'Petugas berhelm memeriksa kondisi jendela sambil mencatat temuan.'],
      ['Preventive maintenance', 'Pemeriksaan rutin pada sistem teknis membantu menemukan potensi gangguan lebih awal.', 'Teknisi memeriksa komponen pada panel listrik.'],
      ['HSE & keselamatan kerja', 'Risiko kerja perlu dikenali, dibicarakan, dan dikendalikan sebelum pekerjaan dimulai.', 'Dua pekerja beralat pelindung diri berkoordinasi di area kerja.'],
    ],
    sectors: ['Properti yang kami layani', 'Kebutuhan tiap properti berbeda. Cara mengelolanya juga.', 'Kami menyesuaikan fokus pengelolaan dengan fungsi aset dan orang-orang yang beraktivitas di dalamnya.'],
    sectorItems: [
      ['Office building', 'Kesiapan fasilitas, kelancaran operasional, dan layanan bagi tenant.'],
      ['Apartemen', 'Perawatan area bersama, keandalan sistem, dan kenyamanan penghuni.'],
      ['Mall', 'Kesiapan fasilitas publik, koordinasi tenant, dan aktivitas harian yang dinamis.'],
      ['Real estate', 'Pemeliharaan aset dan pengelolaan kawasan yang tertata.'],
    ],
    about: ['Tentang PROMIND', 'Melihat nilai aset sampai ke detail operasionalnya.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) bergerak di bidang konsultasi dan manajemen properti. Kami menghubungkan kebutuhan pemilik aset dengan pekerjaan sehari-hari yang menjaga bangunan tetap berfungsi.', 'Pendekatan kami sederhana: pahami kondisi sebenarnya, sepakati prioritas, lalu jalankan rencana bersama pihak yang bertanggung jawab.'],
    closing: ['Mari berbicara', 'Ada properti yang perlu ditangani lebih baik?', 'Ceritakan jenis aset, kondisi saat ini, dan hal yang ingin Anda perbaiki. Kami siap membahas langkah awal yang paling relevan.', 'Hubungi PROMIND', 'Diskusi kebutuhan manajemen properti'],
    footer: { address: 'Alamat kantor', contact: 'Hubungi kami', standards: 'Sertifikasi ISO', back: 'Kembali ke atas', rights: 'Hak cipta dilindungi.' }
  },
  en: {
    nav: ['Services', 'Approach', 'In the field', 'Sectors', 'About'],
    contact: 'Contact us', skip: 'Skip to content',
    hero: ['Property management consultancy', 'Protect the asset.', 'Keep the business moving.', 'PROMIND helps owners and property managers maintain asset performance through clear strategy and well-run operations. From building condition to occupant experience, every decision has a purpose.', 'Talk to us about your asset', 'Explore our services', 'Illustrative image, not a PROMIND project'],
    intro: ['Our perspective', 'Property performance is built every day.', 'A reliable, welcoming building depends on everyday decisions: when to inspect a system, what to fix first, and how to deliver consistent service. We help you see the whole picture while staying close to what happens on site.'],
    services: ['Our services', 'From planning to daily operations.', 'We tailor our support to the property type, asset condition, and owner’s objectives.'],
    serviceItems: [
      ['Property & facilities management', 'Organising building operations, maintenance schedules, vendor performance, and services that keep the property ready each day.'],
      ['Asset strategy & advisory', 'Reviewing asset condition and operating costs to help set improvement priorities and a practical direction for management.'],
      ['Project management', 'Supporting renovations, fit-outs, and facility upgrades with attention to cost, quality, schedule, and operational impact.'],
      ['Building sustainability', 'Reviewing resource use and identifying efficiency measures that make sense for the building.'],
    ],
    approach: ['Our approach', 'Start with the facts on site. Move forward with a plan.', 'Every property has its own challenges. We begin with the owner’s goals and conditions on site, then develop steps the operations team can put into practice.'],
    steps: [
      ['Understand the needs', 'We listen to the owner’s goals, occupant needs, and the issues felt most in daily operations.'],
      ['Inspect the asset', 'We look at data, workflows, and site observations together to make the issues clear.'],
      ['Set priorities', 'Actions, responsibilities, and budgets are aligned with what the asset needs.'],
      ['Review the results', 'Progress is reviewed regularly so the plan stays relevant as conditions change.'],
    ],
    fieldwork: ['In the field', 'The details on site shape the next move.', 'Building assessments, scheduled maintenance, and safe working practices help keep properties ready for use.', 'Editorial photographs illustrate the activities. They do not depict PROMIND staff or projects.', 'Photo sources'],
    fieldworkItems: [
      ['Building assessment', 'Inspecting the building helps distinguish what needs attention now from what can be planned.', 'A worker in a hard hat checks a window and records observations.'],
      ['Preventive maintenance', 'Routine checks on technical systems help identify potential disruptions early.', 'A technician checks components inside an electrical panel.'],
      ['HSE & workplace safety', 'Workplace risks need to be identified, discussed, and controlled before work begins.', 'Two workers wearing protective equipment coordinate on site.'],
    ],
    sectors: ['Properties we serve', 'Different properties call for different priorities.', 'We adapt the management focus to each asset’s purpose and the people who use it.'],
    sectorItems: [
      ['Office buildings', 'Facility readiness, smooth operations, and tenant services.'],
      ['Apartments', 'Common-area upkeep, reliable building systems, and resident comfort.'],
      ['Shopping malls', 'Public facilities, tenant coordination, and busy daily operations.'],
      ['Real estate', 'Planned asset maintenance and well-organised estate management.'],
    ],
    about: ['About PROMIND', 'Seeing asset value through the details of daily operations.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) works in property management and advisory. We connect the owner’s objectives with the daily work that keeps a building running.', 'Our approach is straightforward: understand the real conditions, agree on priorities, and work through the plan with the people responsible.'],
    closing: ['Let’s talk', 'Could your property be working better?', 'Tell us about the asset, its current condition, and what you want to improve. We are ready to discuss the most relevant first steps.', 'Contact PROMIND', 'Property management enquiry'],
    footer: { address: 'Office address', contact: 'Contact us', standards: 'ISO certifications', back: 'Back to top', rights: 'All rights reserved.' }
  }
};

const ids = ['services', 'approach', 'fieldwork', 'sectors', 'about'];
const logo = '/images/promind-header-brand.png';
const fieldworkPhotos = [
  { image: '/images/fieldwork-assessment.jpg', source: 'https://www.pexels.com/photo/a-man-wearing-a-hard-hat-while-looking-at-the-glass-window-8292802/', credit: 'RDNE Stock project' },
  { image: '/images/fieldwork-maintenance.jpg', source: 'https://www.pexels.com/photo/close-up-photo-of-a-man-checking-a-power-voltage-10871929/', credit: 'Annas Zakaria' },
  { image: '/images/fieldwork-hse.jpg', source: 'https://www.pexels.com/photo/construction-workers-wearing-hardhats-8961064/', credit: 'Mikael Blomkvist' },
];

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

      <section id="fieldwork" className="fieldwork section-pad"><div className="wrap">
        <div className="fieldwork-heading"><div><p className="eyebrow">{t.fieldwork[0]}</p><h2>{t.fieldwork[1]}</h2></div><p>{t.fieldwork[2]}</p></div>
        <div className="fieldwork-grid">{t.fieldworkItems.map(([title, description, alt], i) => <figure className={'fieldwork-item fieldwork-item-' + (i + 1)} key={title}>
          <div className="fieldwork-photo"><img src={fieldworkPhotos[i].image} alt={alt} loading="lazy" decoding="async" /></div>
          <figcaption><span className="fieldwork-number">0{i + 1}</span><div><h3>{title}</h3><p>{description}</p></div></figcaption>
        </figure>)}</div>
        <p className="fieldwork-disclaimer">{t.fieldwork[3]} <span>{t.fieldwork[4]}: {fieldworkPhotos.map((photo, i) => <span key={photo.credit}>{i > 0 && ' · '}<a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.credit}</a></span>)}</span></p>
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
