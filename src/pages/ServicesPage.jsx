import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ServicesPage({ t, lang, onNavigate }) {
  const s = t.servicesPage;

  return (
    <div className="bg-[#f6f5f1]">
      {/* Clean Editorial Page Header */}
      <section className="bg-white border-b border-[#d8dfe5] py-20">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="eyebrow">{s.eyebrow}</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#172b42] font-manrope leading-tight mb-5">
              {s.title}
            </h1>
            <p className="text-base sm:text-lg text-[#526374] leading-relaxed m-0">
              {s.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* 6 Core Service Pillars — Clean Editorial Table Layout */}
      <section className="section-pad">
        <div className="wrap">
          <div className="border-t border-[#cbd2d9]">
            {s.pillars.map((pillar) => (
              <div
                key={pillar.num}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12 border-b border-[#cbd2d9] items-start"
              >
                <div className="lg:col-span-1">
                  <span className="text-sm font-extrabold text-[#2b5caf]">
                    {pillar.num}
                  </span>
                </div>

                <div className="lg:col-span-5 pr-4">
                  <h2 className="text-2xl font-bold text-[#172b42] font-manrope mb-3">
                    {pillar.title}
                  </h2>
                  <p className="text-sm sm:text-base text-[#5b6874] leading-relaxed m-0">
                    {pillar.desc}
                  </p>
                </div>

                <div className="lg:col-span-6 bg-white border border-[#d8dfe5] p-6 sm:p-8">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2b5caf] block mb-4">
                    {lang === 'id' ? 'RUANG LINGKUP PEKERJAAN' : 'SCOPE OF WORK'}
                  </span>
                  <ol className="list-none m-0 p-0 space-y-3">
                    {pillar.deliverables.map((del, dIdx) => (
                      <li
                        key={dIdx}
                        className="grid grid-cols-[28px_1fr] items-baseline text-xs sm:text-sm text-[#2c4157] pb-3 border-b border-[#eef2f5] last:border-b-0 last:pb-0"
                      >
                        <span className="text-[11px] font-extrabold text-[#3d6cad]">
                          0{dIdx + 1}
                        </span>
                        <span className="leading-relaxed">{del}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Models — Using Clean Editorial Grid */}
      <section className="engagement section-pad border-t border-[#d8dfe5]">
        <div className="wrap engagement-grid">
          <div className="engagement-lead">
            <p className="eyebrow">{lang === 'id' ? 'SKEMA KERJA SAMA' : 'ENGAGEMENT MODELS'}</p>
            <h2>
              {lang === 'id'
                ? 'Pola Pendampingan yang Fleksibel Sesuai Kebutuhan Aset.'
                : 'Flexible Engagement Models Aligned with Your Property.'}
            </h2>
            <p>
              {lang === 'id'
                ? 'Kami menyesuaikan ruang lingkup penugasan—baik pengelolaan operasional penuh di lokasi maupun pendampingan teknis berjangka waktu.'
                : 'We tailor our mandate to your operational structure—from full on-site property management to focused technical advisory.'}
            </p>
          </div>

          <div className="engagement-list">
            {s.engagementModels.map((mod) => (
              <article key={mod.code}>
                <span>{mod.code}</span>
                <div>
                  <h3>{mod.title}</h3>
                  <p>{mod.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="wrap mt-14">
          <button
            onClick={() => onNavigate('contact')}
            className="button button-primary cursor-pointer"
          >
            <span>{lang === 'id' ? 'Diskusikan Layanan untuk Properti Anda' : 'Discuss Services for Your Property'}</span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
