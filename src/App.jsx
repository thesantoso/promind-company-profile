import { useState } from 'react';
import { ArrowUpRight, Menu, Pause, Play, X } from 'lucide-react';
import { buildInquiryMailto } from './inquiry.js';

const copy = {
  id: {
    nav: ['Layanan', 'Pendekatan', 'Di lapangan', 'Sektor', 'Portofolio', 'Tentang'],
    contact: 'Hubungi kami', skip: 'Lewati ke konten',
    hero: ['Manajemen properti terintegrasi', 'Properti terkelola.', 'Nilainya terus terjaga.', 'PROMIND mendampingi pemilik aset sejak persiapan operasional hingga pengelolaan gedung sehari-hari. Tim manajemen, engineering, HSE, dan layanan tenant bekerja dalam satu arah: menjaga bangunan tetap andal dan nyaman digunakan.', 'Diskusikan properti Anda', 'Lihat layanan kami', 'Visual ilustratif, bukan portofolio proyek PROMIND'],
    intro: ['Mengapa PROMIND', 'Aset yang baik perlu dikelola dengan perhatian yang sama baiknya.', 'Kinerja properti tidak berhenti pada bangunan yang selesai dibangun. Sistem harus dirawat, biaya dikendalikan, kebutuhan tenant ditangani, dan risiko kerja diawasi. PROMIND membantu menyatukan pekerjaan tersebut dalam pengelolaan yang tertata dan dapat dipantau.'],
    value: ['Nilai untuk pemilik aset', 'Empat hal yang kami jaga dalam pengelolaan properti.', 'Setiap ruang lingkup kerja diarahkan pada kebutuhan yang paling berpengaruh terhadap keberlangsungan aset.'],
    valueItems: [
      ['Keandalan operasional', 'Sistem, fasilitas, dan pekerjaan rutin dikelola agar aktivitas properti tetap berjalan.'],
      ['Kontrol biaya', 'Anggaran, vendor, dan kebutuhan perawatan ditinjau agar keputusan lebih terukur.'],
      ['Keselamatan & kepatuhan', 'Risiko kerja, inspeksi, dan tindak lanjut menjadi bagian dari disiplin operasional.'],
      ['Pengalaman pengguna', 'Kebutuhan tenant, penghuni, dan pengunjung ditangani melalui standar layanan yang jelas.'],
    ],
    services: ['Layanan kami', 'Dukungan lengkap untuk setiap tahap properti.', 'Mulai dari persiapan gedung, pengelolaan operasional, hingga pengembangan tim dan sistem kerja. Ruang lingkupnya disesuaikan dengan kebutuhan aset Anda.'],
    serviceItems: [
      ['Persiapan operasional & serah terima', 'Pendampingan teknis sebelum gedung beroperasi, termasuk kesiapan sistem dan proses serah terima unit kepada pengguna.'],
      ['Asesmen & manajemen properti', 'Menilai kondisi aset, menyusun rencana operasional, lalu memantau pelaksanaannya agar keputusan pengelolaan tetap tepat sasaran.'],
      ['Engineering & pemeliharaan', 'Mengelola pemeriksaan dan perawatan berkala pada peralatan serta infrastruktur gedung untuk menjaga keandalannya.'],
      ['Operasional gedung terintegrasi', 'Koordinasi building management, housekeeping, keamanan, dan parkir dalam standar layanan yang selaras.'],
      ['HSE & hubungan tenant', 'Mengelola risiko keselamatan kerja sekaligus membantu merespons kebutuhan, masukan, dan keluhan tenant secara profesional.'],
      ['Keuangan & administrasi properti', 'Mendukung anggaran, pelaporan keuangan, dan pengelolaan tagihan seperti service charge, sinking fund, serta utilitas.'],
      ['Penyediaan SDM & pelatihan', 'Dukungan personel dan pengembangan kompetensi untuk fungsi building management, engineering, HSE, serta operasional gedung.'],
      ['Sistem manajemen properti', 'Pemanfaatan ProApps untuk membantu pencatatan, pemantauan, dan koordinasi pekerjaan pengelolaan properti.'],
    ],
    engagement: ['Model kerja sama', 'Dukungan sesuai kebutuhan dan kondisi aset.', 'PROMIND dapat terlibat mulai dari satu asesmen terarah hingga pengelolaan operasional yang terintegrasi.'],
    engagementItems: [
      ['Property assessment', 'Pemeriksaan kondisi aset dan proses kerja sebagai dasar prioritas perbaikan.'],
      ['Management consultancy', 'Penyusunan struktur, SOP, anggaran, dan rencana peningkatan operasional.'],
      ['Dedicated management team', 'Penyediaan personel pengelola dengan fungsi yang disesuaikan kebutuhan properti.'],
      ['Integrated property management', 'Koordinasi building management, engineering, HSE, tenant relations, keuangan, dan layanan pendukung.'],
    ],
    approach: ['Cara kerja', 'Rencana yang jelas. Pelaksanaan yang terpantau.', 'Pengelolaan dimulai dengan memahami aset, kemudian diterjemahkan menjadi pekerjaan harian yang punya penanggung jawab dan dapat dievaluasi.'],
    steps: [
      ['Kenali kebutuhan aset', 'Tujuan pemilik, karakter properti, dan kebutuhan pengguna menjadi titik awal perencanaan.'],
      ['Lakukan asesmen', 'Kondisi fisik, sistem teknis, data operasional, dan proses kerja ditinjau untuk menemukan prioritas.'],
      ['Jalankan operasional', 'Tugas tim, jadwal pemeliharaan, vendor, dan standar layanan dikoordinasikan dalam pekerjaan sehari-hari.'],
      ['Pantau dan evaluasi', 'Hasil kerja dan temuan lapangan ditinjau berkala sebagai dasar perbaikan berikutnya.'],
    ],
    technology: ['Dukungan teknologi', 'Operasional yang tercatat lebih mudah dikendalikan.', 'ProApps membantu menghubungkan aktivitas lapangan dengan pemantauan manajemen, sehingga pekerjaan, temuan, dan tindak lanjut tidak berhenti di percakapan.', 'Catat', 'Aktivitas dan temuan lapangan terdokumentasi dalam alur kerja.', 'Koordinasikan', 'Tugas dan tindak lanjut diteruskan kepada pihak yang bertanggung jawab.', 'Tinjau', 'Informasi operasional menjadi bahan evaluasi dan keputusan berikutnya.'],
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
    clients: ['Pengalaman kami', 'Properti yang pernah kami tangani.', 'Pengalaman operasional kami mencakup beragam properti residensial, komersial, pendidikan, dan kawasan.', 'Jeda pergerakan logo', 'Jalankan pergerakan logo'],
    clientNote: 'Daftar properti dan organisasi berdasarkan rekam pengalaman perusahaan.',
    deliverables: ['Yang diterima klien', 'Pengelolaan yang bisa dilihat, ditinjau, dan ditindaklanjuti.', 'Ruang lingkup akhir mengikuti kebutuhan aset, tetapi setiap engagement dibangun dengan keluaran kerja yang jelas.'],
    deliverableItems: ['Baseline assessment', 'Rencana operasional', 'Struktur tim & tanggung jawab', 'Jadwal preventive maintenance', 'SOP & emergency response', 'Kontrol vendor & anggaran', 'Laporan manajemen berkala', 'Daftar temuan & tindak lanjut'],
    about: ['Tentang PROMIND', 'Pengelolaan properti yang dekat dengan kebutuhan pemilik dan pengguna.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) menyediakan layanan manajemen properti terintegrasi, mulai dari persiapan operasional, pengelolaan gedung, hingga dukungan tim dan sistem kerja.', 'Fokus kami adalah menjaga keandalan bangunan, keteraturan operasional, dan kualitas layanan bagi orang yang menggunakan properti setiap hari.'],
    closing: ['Konsultasi awal', 'Mari bahas kebutuhan properti Anda.', 'Sedang menyiapkan gedung baru atau meninjau kembali pengelolaan aset yang sudah berjalan? Isi informasi singkat berikut agar diskusi awal lebih terarah.', 'Kirim inquiry', 'Diskusi kebutuhan manajemen properti', 'Nama', 'Perusahaan', 'Email kantor', 'Nomor telepon', 'Jenis properti', 'Lokasi properti', 'Kebutuhan utama', 'Ceritakan kondisi atau tantangannya', 'Pilih jenis properti', 'Pilih kebutuhan', 'Office building', 'Apartemen', 'Mall', 'Real estate / kawasan', 'Lainnya', 'Property assessment', 'Management consultancy', 'Dedicated management team', 'Integrated property management'],
    footer: { address: 'Alamat kantor', contact: 'Hubungi kami', standards: 'Sertifikasi ISO', back: 'Kembali ke atas', rights: 'Hak cipta dilindungi.' }
  },
  en: {
    nav: ['Services', 'Approach', 'In the field', 'Sectors', 'Portfolio', 'About'],
    contact: 'Contact us', skip: 'Skip to content',
    hero: ['Integrated property management', 'Well-managed property.', 'Lasting asset value.', 'PROMIND supports asset owners from operational preparation through the day-to-day management of their buildings. Management, engineering, HSE, and tenant services work toward one goal: reliable buildings that people feel comfortable using.', 'Discuss your property', 'Explore our services', 'Illustrative image, not a PROMIND project'],
    intro: ['Why PROMIND', 'A good asset deserves equally good management.', 'Property performance does not end when construction is complete. Systems need maintenance, costs need control, tenant needs must be addressed, and workplace risks must be managed. PROMIND brings these responsibilities into a coordinated operation that owners can follow.'],
    value: ['Value for asset owners', 'Four priorities behind well-managed property.', 'Each engagement focuses on the areas that matter most to the continuity of the asset.'],
    valueItems: [
      ['Operational reliability', 'Systems, facilities, and routine work are managed to keep the property operating.'],
      ['Cost control', 'Budgets, vendors, and maintenance needs are reviewed to support measured decisions.'],
      ['Safety & compliance', 'Workplace risks, inspections, and corrective actions form part of operational discipline.'],
      ['Occupant experience', 'Tenant, resident, and visitor needs are handled through clear service standards.'],
    ],
    services: ['Our services', 'Support for every stage of the property.', 'From building preparation and daily operations to team development and management systems, the scope is tailored to your asset.'],
    serviceItems: [
      ['Operational preparation & handover', 'Technical support before a building opens, including system readiness and the handover process for occupants.'],
      ['Property assessment & management', 'Assessing asset condition, planning operations, and monitoring delivery to keep management decisions focused.'],
      ['Engineering & maintenance', 'Managing regular inspections and maintenance of building equipment and infrastructure to support reliability.'],
      ['Integrated building operations', 'Coordinating building management, housekeeping, security, and parking around consistent service standards.'],
      ['HSE & tenant relations', 'Managing workplace safety risks while responding professionally to tenant requests, feedback, and complaints.'],
      ['Property finance & administration', 'Supporting budgets, financial reporting, and billing for service charges, sinking funds, and utilities.'],
      ['Staffing & training', 'Personnel support and skills development for building management, engineering, HSE, and operational roles.'],
      ['Property management systems', 'Using ProApps to support records, monitoring, and coordination across property management work.'],
    ],
    engagement: ['Engagement models', 'Support shaped around the needs of the asset.', 'PROMIND can contribute through a focused assessment or take responsibility for an integrated property operation.'],
    engagementItems: [
      ['Property assessment', 'Reviewing asset condition and workflows to establish improvement priorities.'],
      ['Management consultancy', 'Developing structures, SOPs, budgets, and an operational improvement plan.'],
      ['Dedicated management team', 'Providing management personnel with functions tailored to the property.'],
      ['Integrated property management', 'Coordinating building management, engineering, HSE, tenant relations, finance, and support services.'],
    ],
    approach: ['Our approach', 'A clear plan. Work you can follow.', 'Management starts with understanding the asset, then turns that understanding into daily work with clear responsibilities and regular review.'],
    steps: [
      ['Understand the asset', 'The owner’s goals, the property’s character, and occupant needs shape the starting point.'],
      ['Assess its condition', 'Physical condition, technical systems, operating data, and workflows are reviewed to identify priorities.'],
      ['Run the operation', 'Team responsibilities, maintenance schedules, vendors, and service standards come together in daily work.'],
      ['Monitor and improve', 'Results and site observations are reviewed regularly to guide the next improvements.'],
    ],
    technology: ['Technology support', 'Recorded operations are easier to control.', 'ProApps connects field activity with management oversight, helping work, findings, and follow-up move beyond informal conversations.', 'Record', 'Field activity and findings enter a documented workflow.', 'Coordinate', 'Tasks and follow-up reach the people responsible.', 'Review', 'Operational information supports evaluation and the next decision.'],
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
    clients: ['Our experience', 'Properties we have worked with.', 'Our operational experience spans residential, commercial, educational, and estate properties.', 'Pause logo movement', 'Play logo movement'],
    clientNote: 'Property and organisation names are based on the company’s experience records.',
    deliverables: ['What clients receive', 'Management that can be seen, reviewed, and acted upon.', 'The final scope reflects the asset, while every engagement is built around clear working outputs.'],
    deliverableItems: ['Baseline assessment', 'Operational plan', 'Team structure & responsibilities', 'Preventive maintenance schedule', 'SOPs & emergency response', 'Vendor & budget controls', 'Periodic management reports', 'Findings & action register'],
    about: ['About PROMIND', 'Property management shaped around owners and occupants.', 'PT Properti Manajemen Inovasi Indonesia (PROMIND) provides integrated property management services, from operational preparation and building management to teams and management systems.', 'Our focus is on building reliability, orderly operations, and the quality of service experienced by the people who use the property each day.'],
    closing: ['Initial consultation', 'Tell us what your property needs.', 'Preparing a new building or reviewing an existing operation? Share a few details so the first conversation can be more focused.', 'Send inquiry', 'Property management enquiry', 'Name', 'Company', 'Work email', 'Phone number', 'Property type', 'Property location', 'Primary need', 'Tell us about the situation or challenge', 'Select property type', 'Select a service', 'Office building', 'Apartment', 'Shopping mall', 'Real estate / estate', 'Other', 'Property assessment', 'Management consultancy', 'Dedicated management team', 'Integrated property management'],
    footer: { address: 'Office address', contact: 'Contact us', standards: 'ISO certifications', back: 'Back to top', rights: 'All rights reserved.' }
  }
};

const ids = ['services', 'approach', 'fieldwork', 'sectors', 'clients', 'about'];
const logo = '/images/promind-header-brand.png';
const clients = [
  ['Icon Apartment', 'Gresik'],
  ['Kingsland', 'International'],
  ['Mandiri University', 'Education facility'],
  ['NT Tower', 'Office building'],
  ['Paladian Park', 'Apartment'],
  ['Park Royale', 'Tower 1 & 2'],
  ['Permata Hijau', 'Residences'],
  ['Plaza Pasifik', 'Commercial property'],
  ['Prasastha', 'Residential property'],
  ['Ravindo', 'Property'],
  ['Taman Sari', 'Property'],
  ['The Park', 'Residence'],
  ['Patra Jasa', 'Property'],
  ['WIKA', 'Property'],
];
const fieldworkPhotos = [
  '/images/promind-building-operations-v2.jpg',
  '/images/promind-engineering-v2.jpg',
  '/images/promind-hse-v2.jpg',
  '/images/promind-tenant-relations-v2.jpg',
];

export default function App() {
  const [lang, setLang] = useState('id');
  const [menuOpen, setMenuOpen] = useState(false);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const t = copy[lang];
  const email = 'corporate@promind.id';
  const mailLink = 'mailto:' + email + '?subject=' + encodeURIComponent(t.closing[4]);
  const links = ids.map((id, i) => <a key={id} href={'#' + id} onClick={() => setMenuOpen(false)}>{t.nav[i]}</a>);
  const handleInquirySubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    window.location.href = buildInquiryMailto(email, t.closing[4], Object.fromEntries(data.entries()));
  };

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

      <section className="value-section"><div className="wrap">
        <div className="value-heading"><div><p className="eyebrow">{t.value[0]}</p><h2>{t.value[1]}</h2></div><p>{t.value[2]}</p></div>
        <div className="value-list">{t.valueItems.map(([title, body], i) => <article key={title}><span>{String(i + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </div></section>

      <section id="services" className="services section-pad"><div className="wrap">
        <div className="section-heading"><p className="eyebrow">{t.services[0]}</p><h2>{t.services[1]}</h2><p>{t.services[2]}</p></div>
        <div className="service-list">{t.serviceItems.map(([title, body], i) => <article className="service-row" key={title}><span className="service-index">{String(i + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </div></section>

      <section className="engagement section-pad"><div className="wrap engagement-grid">
        <div className="engagement-lead"><p className="eyebrow">{t.engagement[0]}</p><h2>{t.engagement[1]}</h2><p>{t.engagement[2]}</p></div>
        <div className="engagement-list">{t.engagementItems.map(([title, body], i) => <article key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </div></section>

      <section id="approach" className="approach section-pad"><div className="wrap approach-grid">
        <div className="approach-lead"><p className="eyebrow">{t.approach[0]}</p><h2>{t.approach[1]}</h2><p>{t.approach[2]}</p></div>
        <div className="approach-steps">{t.steps.map(([title, body], i) => <div className="approach-step" key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div>
      </div></section>

      <section className="technology section-pad"><div className="wrap technology-grid">
        <div className="technology-copy"><p className="eyebrow">{t.technology[0]}</p><h2>{t.technology[1]}</h2><p>{t.technology[2]}</p><div className="technology-wordmark">ProApps <span>Property Management System</span></div></div>
        <div className="technology-flow">{[[t.technology[3], t.technology[4]], [t.technology[5], t.technology[6]], [t.technology[7], t.technology[8]]].map(([title, body], i) => <article key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
      </div></section>

      <section id="fieldwork" className="fieldwork section-pad"><div className="wrap">
        <div className="fieldwork-heading"><div><p className="eyebrow">{t.fieldwork[0]}</p><h2>{t.fieldwork[1]}</h2></div><p>{t.fieldwork[2]}</p></div>
        <div className="fieldwork-grid">{t.fieldworkItems.map(([title, description, alt], i) => <figure className={'fieldwork-item fieldwork-item-' + (i + 1)} key={title}>
          <div className="fieldwork-photo"><img src={fieldworkPhotos[i]} alt={alt} loading="lazy" decoding="async" /></div>
          <figcaption><span className="fieldwork-number">0{i + 1}</span><div><h3>{title}</h3><p>{description}</p></div></figcaption>
        </figure>)}</div>
      </div></section>

      <section id="sectors" className="sectors section-pad"><div className="wrap sectors-grid"><div><p className="eyebrow">{t.sectors[0]}</p><h2>{t.sectors[1]}</h2><p>{t.sectors[2]}</p></div><ul>{t.sectorItems.map(([title, description]) => <li key={title}><strong>{title}</strong><span>{description}</span></li>)}</ul></div></section>

      <section id="clients" className="clients section-pad"><div className="wrap">
        <div className="clients-heading"><div><p className="eyebrow">{t.clients[0]}</p><h2>{t.clients[1]}</h2></div><div className="clients-intro"><p>{t.clients[2]}</p><button className="marquee-control" type="button" aria-pressed={marqueePaused} onClick={() => setMarqueePaused(!marqueePaused)}>{marqueePaused ? <Play size={15} /> : <Pause size={15} />} {marqueePaused ? t.clients[4] : t.clients[3]}</button></div></div>
        <div className={'client-marquee' + (marqueePaused ? ' is-paused' : '')}>
          <div className="client-marquee-track" aria-hidden="true">
            <img src="/images/promind-client-logos.png" alt="" />
            <img src="/images/promind-client-logos.png" alt="" />
          </div>
        </div>
        <ul className="sr-only">{clients.map(([name, type]) => <li key={name}>{name}, {type}</li>)}</ul>
        <p className="client-note">{t.clientNote}</p>
      </div></section>

      <section className="deliverables section-pad"><div className="wrap deliverables-grid">
        <div className="deliverables-lead"><p className="eyebrow">{t.deliverables[0]}</p><h2>{t.deliverables[1]}</h2><p>{t.deliverables[2]}</p></div>
        <ol>{t.deliverableItems.map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, '0')}</span>{item}</li>)}</ol>
      </div></section>

      <section id="about" className="about section-pad"><div className="wrap about-grid"><div><p className="eyebrow">{t.about[0]}</p><h2>{t.about[1]}</h2></div><div className="about-copy"><p>{t.about[2]}</p><p>{t.about[3]}</p></div></div></section>

      <section id="contact" className="contact section-pad"><div className="wrap contact-grid"><div className="contact-lead"><p className="eyebrow">{t.closing[0]}</p><h2>{t.closing[1]}</h2><p>{t.closing[2]}</p><a href={mailLink}>{email}</a></div><form className="inquiry-form" onSubmit={handleInquirySubmit}>
        <label><span>{t.closing[5]}</span><input name="name" autoComplete="name" required /></label>
        <label><span>{t.closing[6]}</span><input name="company" autoComplete="organization" /></label>
        <label><span>{t.closing[7]}</span><input name="email" type="email" autoComplete="email" required /></label>
        <label><span>{t.closing[8]}</span><input name="phone" type="tel" autoComplete="tel" /></label>
        <label><span>{t.closing[9]}</span><select name="propertyType" required defaultValue=""><option value="" disabled>{t.closing[13]}</option>{t.closing.slice(15, 20).map(option => <option key={option}>{option}</option>)}</select></label>
        <label><span>{t.closing[10]}</span><input name="location" autoComplete="address-level2" /></label>
        <label className="form-wide"><span>{t.closing[11]}</span><select name="need" required defaultValue=""><option value="" disabled>{t.closing[14]}</option>{t.closing.slice(20, 24).map(option => <option key={option}>{option}</option>)}</select></label>
        <label className="form-wide"><span>{t.closing[12]}</span><textarea name="message" rows="4"></textarea></label>
        <button className="button button-light form-submit" type="submit">{t.closing[3]} <ArrowUpRight size={18} /></button>
      </form></div></section>
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
