import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function PortfolioPage({ t, lang, onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    { id: 'All', label: lang === 'id' ? 'Semua Kategori' : 'All Categories' },
    { id: 'Office Building', label: 'Office Building' },
    { id: 'Apartment', label: 'Apartment' },
    { id: 'Mall & Commercial', label: 'Mall & Commercial' },
    { id: 'Real Estate & Facility', label: 'Real Estate & Facility' },
  ];

  const portfolioItems = [
    {
      name: 'NT Tower',
      sector: 'Office Building',
      scope:
        lang === 'id'
          ? 'Pengelolaan operasional gedung perkantoran, pemeliharaan preventif instalasi M&E, tata graha, dan keamanan.'
          : 'Office building operations, preventive M&E maintenance, housekeeping, and building security.',
    },
    {
      name: 'Ravindo Tower',
      sector: 'Office Building',
      scope:
        lang === 'id'
          ? 'Manajemen operasional gedung perkantoran, pemeliharaan fasilitas teknis, dan layanan pengguna gedung.'
          : 'Commercial office operations, technical facility maintenance, and tenant services.',
    },
    {
      name: 'Park Royale (Tower 1 & 2)',
      sector: 'Apartment',
      scope:
        lang === 'id'
          ? 'Pengelolaan hunian vertikal, layanan penghuni, administrasi pengelolaan, serta perawatan fasilitas bersama.'
          : 'High-rise residential management, resident services, administration, and shared facility upkeep.',
    },
    {
      name: 'Permata Hijau Residences',
      sector: 'Apartment',
      scope:
        lang === 'id'
          ? 'Manajemen operasional apartemen, pemeliharaan utilitas gedung, tata graha, lanskap, dan keamanan.'
          : 'Apartment operations, building utility maintenance, housekeeping, landscaping, and security.',
    },
    {
      name: 'Paladian Park',
      sector: 'Apartment',
      scope:
        lang === 'id'
          ? 'Pengelolaan lingkungan hunian apartemen, perawatan instalasi teknis gedung, dan ketertiban fasilitas.'
          : 'Residential apartment management, technical installation maintenance, and facility order.',
    },
    {
      name: 'Icon Apartment',
      sector: 'Apartment',
      scope:
        lang === 'id'
          ? 'Operasional gedung hunian vertikal, inspeksi keselamatan gedung (HSE), serta layanan penghuni.'
          : 'High-rise residential operations, building safety (HSE) inspections, and resident relations.',
    },
    {
      name: 'Taman Sari',
      sector: 'Apartment',
      scope:
        lang === 'id'
          ? 'Pendampingan operasional gedung hunian, perawatan rutin M&E, dan pengelolaan layanan harian.'
          : 'Residential building operational support, routine M&E upkeep, and daily service management.',
    },
    {
      name: 'The Park Residence',
      sector: 'Apartment',
      scope:
        lang === 'id'
          ? 'Pengelolaan fasilitas hunian, kebersihan area publik, keamanan akses, dan pemeliharaan teknis.'
          : 'Residential facility management, public area housekeeping, access security, and technical maintenance.',
    },
    {
      name: 'Plaza Pasifik',
      sector: 'Mall & Commercial',
      scope:
        lang === 'id'
          ? 'Pengelolaan pusat komersial dan area ritel, ketertiban operasional, keamanan, dan pemeliharaan fasilitas.'
          : 'Commercial and retail center management, operational order, security, and facility upkeep.',
    },
    {
      name: 'Kingsland International',
      sector: 'Real Estate & Facility',
      scope:
        lang === 'id'
          ? 'Standarisasi operasional kawasan properti, pemeliharaan infrastruktur, dan tata kelola fasilitas.'
          : 'Property estate operational standardization, infrastructure maintenance, and facility governance.',
    },
    {
      name: 'Prasastha',
      sector: 'Real Estate & Facility',
      scope:
        lang === 'id'
          ? 'Pengelolaan lingkungan properti, perawatan fasilitas komunal, tata graha, dan pemeliharaan berkala.'
          : 'Property environment management, communal facility care, housekeeping, and periodic upkeep.',
    },
    {
      name: 'Mandiri University',
      sector: 'Real Estate & Facility',
      scope:
        lang === 'id'
          ? 'Manajemen fasilitas terpadu (Facility Management) untuk lingkungan kampus pendidikan korporat.'
          : 'Integrated Facility Management for a corporate educational campus environment.',
    },
    {
      name: 'Patra Jasa Property',
      sector: 'Real Estate & Facility',
      scope:
        lang === 'id'
          ? 'Dukungan pengelolaan teknis, operasional fasilitas, dan penerapan standar keselamatan kerja gedung.'
          : 'Technical management support, facility operations, and workplace safety implementation.',
    },
    {
      name: 'WIKA Property',
      sector: 'Real Estate & Facility',
      scope:
        lang === 'id'
          ? 'Pendampingan pengelolaan aset properti, pemeliharaan peralatan gedung, dan standarisasi SOP lapangan.'
          : 'Property asset management support, building equipment maintenance, and field SOP standardization.',
    },
  ];

  const filteredItems =
    activeCategory === 'All'
      ? portfolioItems
      : portfolioItems.filter((item) => item.sector === activeCategory);

  const fieldwork = t.home.fieldwork;

  return (
    <div className="bg-[#f6f5f1]">
      {/* Clean Editorial Header */}
      <section className="bg-white border-b border-[#d8dfe5] py-20">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="eyebrow">
              {lang === 'id' ? 'PORTOFOLIO & REKAM JEJAK' : 'PORTFOLIO & TRACK RECORD'}
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#172b42] font-manrope leading-tight mb-5">
              {lang === 'id'
                ? 'Pengalaman Mengelola Beragam Sektor Properti.'
                : 'Experience Managing Diverse Property Sectors.'}
            </h1>
            <p className="text-base sm:text-lg text-[#526374] leading-relaxed m-0">
              {lang === 'id'
                ? 'PROMIND dipercaya menangani operasional Office Building, Apartment, Mall, serta kawasan Real Estate dan fasilitas korporat dengan dukungan sistem operasional PROAPPS.'
                : 'PROMIND is trusted to manage Office Buildings, Apartments, Malls, Real Estate developments, and corporate facilities—supported by the PROAPPS operational system.'}
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio Client Register — Clean Architectural Table/Grid without locations or badges */}
      <section className="section-pad">
        <div className="wrap">
          <div className="section-heading">
            <p className="eyebrow">
              {lang === 'id' ? 'DAFTAR PROPERTI & KLIEN' : 'PROPERTY & CLIENT REGISTER'}
            </p>
            <h2>
              {lang === 'id'
                ? 'Aset & Organisasi yang Telah Kami Layani'
                : 'Properties & Organizations We Have Served'}
            </h2>
            <p>
              {lang === 'id'
                ? 'Pilih kategori di bawah ini untuk meninjau daftar properti berdasarkan sektor pengelolaan.'
                : 'Select a category below to review our managed properties by sector.'}
            </p>
          </div>

          {/* Minimalist Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-[#cbd2d9]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#172b42] text-white'
                    : 'bg-white text-[#334b63] border border-[#cbd5e1] hover:border-[#2959ab]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Clean Hairline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 border-t border-[#cbd2d9]">
            {filteredItems.map((item, idx) => (
              <article
                key={item.name}
                className="py-7 border-b border-[#cbd2d9] grid grid-cols-[38px_1fr] gap-4 items-baseline"
              >
                <span className="text-xs font-extrabold text-[#2b5caf]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[#172b42] font-manrope m-0">
                      {item.name}
                    </h3>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5b6874]">
                      {item.sector}
                    </span>
                  </div>
                  <p className="text-sm text-[#5b6874] leading-relaxed m-0">
                    {item.scope}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Field Execution Documentation — Clean Photos without floating stickers or location labels */}
      <section className="fieldwork section-pad bg-white border-t border-[#d8dfe5]">
        <div className="wrap">
          <div className="fieldwork-heading">
            <div>
              <p className="eyebrow">{fieldwork.eyebrow}</p>
              <h2>{fieldwork.title}</h2>
            </div>
            <p>{fieldwork.subtitle}</p>
          </div>

          <div className="fieldwork-grid">
            {fieldwork.items.map((item, idx) => (
              <figure key={item.num} className={`fieldwork-item fieldwork-item-${idx + 1}`}>
                <div className="fieldwork-photo">
                  <img src={item.photo} alt={item.title} loading="lazy" />
                </div>
                <figcaption>
                  <span className="fieldwork-number">{item.num}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-14">
            <button
              onClick={() => onNavigate('contact')}
              className="button button-primary cursor-pointer"
            >
              <span>
                {lang === 'id'
                  ? 'Diskusikan Pengelolaan Properti Anda'
                  : 'Discuss Your Property Management'}
              </span>
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
