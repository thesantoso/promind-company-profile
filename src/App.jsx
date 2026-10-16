import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

const copy = {
  id: {
    nav: ['Layanan', 'Pendekatan', 'Di lapangan', 'Sektor', 'Tentang'],
    contact: 'Hubungi kami', skip: 'Lewati ke konten',
    hero: ['Manajemen properti terintegrasi', 'Properti terkelola.', 'Nilainya terus terjaga.', 'PROMIND mendampingi pemilik aset sejak persiapan operasional hingga pengelolaan gedung sehari-hari. Tim manajemen, engineering, HSE, dan layanan tenant bekerja dalam satu arah: menjaga bangunan tetap andal dan nyaman digunakan.', 'Diskusikan properti Anda', 'Lihat layanan kami', 'Visual ilustratif, bukan portofolio proyek PROMIND'],
    intro: ['Mengapa PROMIND', 'Aset yang baik perlu dikelola dengan perhatian yang sama baiknya.', 'Kinerja properti tidak berhenti pada bangunan yang selesai dibangun. Sistem harus dirawat, biaya dikendalikan, kebutuhan tenant ditangani, dan risiko kerja diawasi. PROMIND membantu menyatukan pekerjaan tersebut dalam pengelolaan yang tertata dan dapat dipantau.'],
    services: ['Layanan kami', 'Dukungan lengkap untuk setiap tahap properti.', 'Mulai dari persiapan gedung, pengelolaan operasional, hingga pengembangan tim dan sistem kerja. Ruang lingkupnya disesuaikan dengan kebutuhan aset Anda.'],
    serviceItems: [
      ['Persiapan operasional & serah terima', 'Pendampingan teknis sebelum gedung beroperasi, termasuk kesiapan sistem dan proses serah terima unit kepada pengguna.'],
      ['Asesmen & manajemen properti', 'Menilai kondisi aset, menyusun rencana operasional, lalu memantau pelaksanaannya agar keputusan pengelolaan tetap tepat sasaran.'],
      ['Engineering & pemeliharaan', 'Mengelola pemeriksaan dan perawatan berkala pada peralatan serta infrastruktur gedung untuk menjaga keandalannya.'],
      ['Operasional gedung terintegrasi', 'Koordinasi building management, housekeeping, keamanan, dan parkir dalam standar layanan yang selaras.'],
      ['HSE & hubungan tenant', 'Mengelola risiko keselamatan kerja sekaligus membantu merespons kebutuhan, masukan, dan keluhan tenant secara profesional.'],
      ['Keuangan & administrasi properti', 'Mendukung anggaran, pelaporan keuangan, dan pengelolaan tagihan seperti service charge, sinking fund, serta utilitas.'],
      ['Penyediaan SDM & pelatihan', 'Dukungan personel dan pengembangan kompetensi untuk fungsi building management, engineering, HSE, serta operasional gedung.'],
      ['Sistem manajemen properti', 'Pemanfaatan Pro-Apps untuk membantu pencatatan, pemantauan, dan koordinasi pekerjaan pengelolaan properti.'],
    ],
    approach: ['Cara kerja', 'Rencana yang jelas. Pelaksanaan yang terpantau.', 'Pengelolaan dimulai dengan memahami aset, kemudian diterjemahkan menjadi pekerjaan harian yang punya penanggung jawab dan dapat dievaluasi.'],
    steps: [
      ['Kenali kebutuhan aset', 'Tujuan pemilik, karakter properti, dan kebutuhan pengguna menjadi titik awal perencanaan.'],
      ['Lakukan asesmen', 'Kondisi fisik, sistem teknis, data operasional, dan proses kerja ditinjau untuk menemukan prioritas.'],
      ['Jalankan operasional', 'Tugas tim, jadwal pemeliharaan, vendor, dan standar layanan dikoordinasikan dalam pekerjaan sehari-hari.'],
      ['Pantau dan evaluasi', 'Hasil kerja dan temuan lapangan ditinjau berkala sebagai dasar perbaikan berikutnya.'],
    ],
    fieldwork: ['Aktivitas kami', 'Di balik gedung yang berfungsi baik, ada tim yang bekerja.', 'Dari koordinasi operasional hingga layanan tenant, pengelolaan properti berjalan melalui perhatian pada detail setiap hari.'],
    fieldworkItems: [
      ['Operasional gedung', 'Koordinasi tim di lapangan membantu memastikan fasilitas, keamanan, dan pekerjaan harian berjalan sesuai rencana.', 'Tim operasional gedung berkoordinasi di area luar bangunan.'],
      ['Engineering & pemeliharaan', 'Pemeriksaan peralatan dan sistem teknis membantu tim menemukan potensi gangguan lebih awal.', 'Dua anggota tim engineering meninjau peralatan di ruang teknis.'],
      ['HSE & keselamatan kerja', 'Pemeriksaan risiko dan kesiapan sistem keselamatan menjadi bagian dari pengawasan gedung.', 'Petugas HSE meninjau instalasi pompa pemadam kebakaran.'],
      ['Hubungan tenant', 'Komunikasi yang responsif membantu kebutuhan dan masukan pengguna gedung ditangani dengan baik.', 'Petugas layanan tenant berbicara dengan pengguna di meja layanan.'],
    ],
    sectors: ['Properti yang kami layani', 'Satu pendekatan tidak cukup untuk semua aset.', 'Prioritas operasional disesuaikan dengan fungsi bangunan, pola penggunaan, dan kebutuhan pemilik maupun penggunanya.'],
    sectorItems: [
      ['Office building', 'Kesiapan fasilitas, kelancaran operasional, dan layanan bagi tenant.'],
      ['Apartemen', 'Perawatan area bersama, keandalan sistem, dan kenyamanan penghuni.'],
      ['Mall', 'Kesiapan fasilitas publik, koordinasi tenant, dan aktivitas harian yang dinamis.'],
      ['Real estate', 'Pemeliharaan aset dan pengelolaan kawasan yang tertata.'],
    ],
    about: ['Tentang PROMIND', 'Pengelolaan properti yang dekat dengan kebutuhan pemilik dan pengguna.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) menyediakan layanan manajemen properti terintegrasi, mulai dari persiapan operasional, pengelolaan gedung, hingga dukungan tim dan sistem kerja.', 'Fokus kami adalah menjaga keandalan bangunan, keteraturan operasional, dan kualitas layanan bagi orang yang menggunakan properti setiap hari.'],
    closing: ['Mari berbicara', 'Mari bahas kebutuhan properti Anda.', 'Sedang menyiapkan gedung baru atau meninjau kembali pengelolaan aset yang sudah berjalan? Ceritakan kondisinya, dan kami akan membantu menentukan ruang lingkup yang sesuai.', 'Hubungi PROMIND', 'Diskusi kebutuhan manajemen properti'],
    footer: { address: 'Alamat kantor', contact: 'Hubungi kami', standards: 'Sertifikasi ISO', back: 'Kembali ke atas', rights: 'Hak cipta dilindungi.' }
  },
  en: {
    nav: ['Services', 'Approach', 'In the field', 'Sectors', 'About'],
    contact: 'Contact us', skip: 'Skip to content',
    hero: ['Integrated property management', 'Well-managed property.', 'Lasting asset value.', 'PROMIND supports asset owners from operational preparation through the day-to-day management of their buildings. Management, engineering, HSE, and tenant services work toward one goal: reliable buildings that people feel comfortable using.', 'Discuss your property', 'Explore our services', 'Illustrative image, not a PROMIND project'],
    intro: ['Why PROMIND', 'A good asset deserves equally good management.', 'Property performance does not end when construction is complete. Systems need maintenance, costs need control, tenant needs must be addressed, and workplace risks must be managed. PROMIND brings these responsibilities into a coordinated operation that owners can follow.'],
    services: ['Our services', 'Support for every stage of the property.', 'From building preparation and daily operations to team development and management systems, the scope is tailored to your asset.'],
    serviceItems: [
      ['Operational preparation & handover', 'Technical support before a building opens, including system readiness and the handover process for occupants.'],
      ['Property assessment & management', 'Assessing asset condition, planning operations, and monitoring delivery to keep management decisions focused.'],
      ['Engineering & maintenance', 'Managing regular inspections and maintenance of building equipment and infrastructure to support reliability.'],
      ['Integrated building operations', 'Coordinating building management, housekeeping, security, and parking around consistent service standards.'],
      ['HSE & tenant relations', 'Managing workplace safety risks while responding professionally to tenant requests, feedback, and complaints.'],
      ['Property finance & administration', 'Supporting budgets, financial reporting, and billing for service charges, sinking funds, and utilities.'],
      ['Staffing & training', 'Personnel support and skills development for building management, engineering, HSE, and operational roles.'],
      ['Property management systems', 'Using Pro-Apps to support records, monitoring, and coordination across property management work.'],
    ],
    approach: ['Our approach', 'A clear plan. Work you can follow.', 'Management starts with understanding the asset, then turns that understanding into daily work with clear responsibilities and regular review.'],
    steps: [
      ['Understand the asset', 'The owner’s goals, the property’s character, and occupant needs shape the starting point.'],
      ['Assess its condition', 'Physical condition, technical systems, operating data, and workflows are reviewed to identify priorities.'],
      ['Run the operation', 'Team responsibilities, maintenance schedules, vendors, and service standards come together in daily work.'],
      ['Monitor and improve', 'Results and site observations are reviewed regularly to guide the next improvements.'],
    ],
    fieldwork: ['Our work', 'Behind a well-run building is a team at work.', 'From operational coordination to tenant service, good property management depends on attention to everyday details.'],
    fieldworkItems: [
      ['Building operations', 'On-site coordination helps keep facilities, security, and daily work aligned with the plan.', 'Building operations staff coordinate outside a building.'],
      ['Engineering & maintenance', 'Checks on equipment and technical systems help teams identify potential disruptions early.', 'Two engineering team members review equipment in a plant room.'],
      ['HSE & workplace safety', 'Risk checks and the readiness of safety systems are part of building oversight.', 'An HSE worker inspects a fire pump installation.'],
      ['Tenant relations', 'Responsive communication helps occupant requests and feedback receive proper attention.', 'A tenant service worker speaks with a visitor at a reception desk.'],
    ],
    sectors: ['Properties we serve', 'One approach cannot serve every asset.', 'Operational priorities reflect how a property is used and what its owners and occupants need.'],
    sectorItems: [
      ['Office buildings', 'Facility readiness, smooth operations, and tenant services.'],
      ['Apartments', 'Common-area upkeep, reliable building systems, and resident comfort.'],
      ['Shopping malls', 'Public facilities, tenant coordination, and busy daily operations.'],
      ['Real estate', 'Planned asset maintenance and well-organised estate management.'],
    ],
    about: ['About PROMIND', 'Property management shaped around owners and occupants.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) provides integrated property management services, from operational preparation and building management to teams and management systems.', 'Our focus is on building reliability, orderly operations, and the quality of service experienced by the people who use the property each day.'],
    closing: ['Let’s talk', 'Tell us what your property needs.', 'Preparing a new building or reviewing an existing operation? Share the situation with us and we can discuss the right scope of support.', 'Contact PROMIND', 'Property management enquiry'],
    footer: { address: 'Office address', contact: 'Contact us', standards: 'ISO certifications', back: 'Back to top', rights: 'All rights reserved.' }
  }
};

const ids = ['services', 'approach', 'fieldwork', 'sectors', 'about'];
const logo = '/images/promind-header-brand.png';
const fieldworkPhotos = [
  '/images/promind-building-operations-v2.jpg',
  '/images/promind-engineering-v2.jpg',
  '/images/promind-hse-v2.jpg',
  '/images/promind-tenant-relations-v2.jpg',
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
          <div className="fieldwork-photo"><img src={fieldworkPhotos[i]} alt={alt} loading="lazy" decoding="async" /></div>
          <figcaption><span className="fieldwork-number">0{i + 1}</span><div><h3>{title}</h3><p>{description}</p></div></figcaption>
        </figure>)}</div>
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
    <Analytics />
  </div>;
}
