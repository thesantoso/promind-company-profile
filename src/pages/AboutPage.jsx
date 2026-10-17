import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function AboutPage({ t, lang, onNavigate }) {
  const a = t.aboutPage;

  return (
    <div className="bg-[#f6f5f1]">
      {/* Clean Editorial Header */}
      <section className="bg-white border-b border-[#d8dfe5] py-20">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="eyebrow">{a.eyebrow}</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#172b42] font-manrope leading-tight mb-5">
              {a.title}
            </h1>
            <p className="text-base sm:text-lg text-[#526374] leading-relaxed m-0">
              {t.meta.companyName}
            </p>
          </div>
        </div>
      </section>

      {/* Corporate Narrative */}
      <section className="about section-pad bg-white border-b border-[#d8dfe5]">
        <div className="wrap about-grid">
          <div>
            <p className="eyebrow">
              {lang === 'id' ? 'PROFIL PERUSAHAAN' : 'COMPANY PROFILE'}
            </p>
            <h2>
              {lang === 'id'
                ? 'Menjaga Kualitas Gedung Melalui Pengelolaan yang Konsisten.'
                : 'Maintaining Building Quality Through Consistent Management.'}
            </h2>
          </div>

          <div className="about-copy">
            {a.story.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Core Pillars & ISO Standards */}
      <section className="value-section">
        <div className="wrap">
          <div className="value-heading">
            <div>
              <p className="eyebrow">
                {lang === 'id' ? 'PRINSIP KERJA' : 'WORKING PRINCIPLES'}
              </p>
              <h2>
                {lang === 'id'
                  ? 'Empat Fondasi Pengelolaan PROMIND'
                  : 'Four Foundations of PROMIND Management'}
              </h2>
            </div>
            <p>
              {lang === 'id'
                ? 'Komitmen operasional yang kami terapkan pada pengelolaan Office Building, Apartment, Mall, dan Real Estate.'
                : 'Operational commitments we apply across Office Buildings, Apartments, Malls, and Real Estate.'}
            </p>
          </div>

          <div className="value-list">
            {a.pillars.map((pillar, idx) => (
              <article key={idx}>
                <span>0{idx + 1}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ISO Management Standards */}
      <section className="section-pad bg-white">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="eyebrow">
                {lang === 'id' ? 'ACUAN STANDAR MUTU' : 'QUALITY STANDARDS'}
              </p>
              <h2 className="text-3xl font-bold text-[#172b42] font-manrope leading-tight mb-4">
                {lang === 'id'
                  ? 'Prosedur Kerja Berstandar Internasional'
                  : 'Internationally Aligned Operating Procedures'}
              </h2>
              <p className="text-sm sm:text-base text-[#5b6874] leading-relaxed m-0">
                {lang === 'id'
                  ? 'Seluruh prosedur operasional lapangan dan tata kelola fasilitas disusun mengacu pada standar manajemen internasional.'
                  : 'All field operating procedures and facility governance frameworks are structured around international management standards.'}
              </p>
            </div>

            <div className="lg:col-span-7 border-t border-[#cbd2d9]">
              {t.meta.standards.map((std, idx) => (
                <div
                  key={std.code}
                  className="py-6 border-b border-[#cbd2d9] grid grid-cols-[42px_1fr] gap-4 items-baseline"
                >
                  <span className="text-xs font-extrabold text-[#2b5caf]">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#172b42] font-manrope mb-1">
                      {std.code}
                    </h3>
                    <p className="text-sm text-[#5b6874] m-0">{std.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14">
            <button
              onClick={() => onNavigate('contact')}
              className="button button-primary cursor-pointer"
            >
              <span>
                {lang === 'id' ? 'Hubungi Tim Kami' : 'Contact Our Team'}
              </span>
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
