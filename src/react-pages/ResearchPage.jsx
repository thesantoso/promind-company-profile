import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ResearchPage({ t, lang, onNavigate }) {
  const r = t.researchPage;

  return (
    <div className="bg-[#f6f5f1]">
      {/* Clean Editorial Header */}
      <section className="bg-white border-b border-[#d8dfe5] py-20">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="eyebrow">{r.eyebrow}</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#172b42] font-manrope leading-tight mb-5">
              {r.title}
            </h1>
            <p className="text-base sm:text-lg text-[#526374] leading-relaxed m-0">
              {r.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Articles List */}
      <section className="section-pad">
        <div className="wrap">
          <div className="border-t border-[#cbd2d9]">
            {r.reports.map((rep, idx) => (
              <article
                key={rep.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12 border-b border-[#cbd2d9] items-start"
              >
                <div className="lg:col-span-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#2b5caf] block">
                    0{idx + 1} / {rep.category}
                  </span>
                </div>

                <div className="lg:col-span-5 pr-4">
                  <h2 className="text-2xl font-bold text-[#172b42] font-manrope mb-3 leading-snug">
                    {rep.title}
                  </h2>
                  <p className="text-sm sm:text-base text-[#5b6874] leading-relaxed m-0">
                    {rep.summary}
                  </p>
                </div>

                <div className="lg:col-span-5 bg-white border border-[#d8dfe5] p-6 sm:p-8">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2b5caf] block mb-4">
                    {lang === 'id' ? 'POIN UTAMA PEMBAHASAN' : 'KEY FOCUS AREAS'}
                  </span>
                  <ol className="list-none m-0 p-0 space-y-3">
                    {rep.highlights.map((hl, hIdx) => (
                      <li
                        key={hIdx}
                        className="grid grid-cols-[28px_1fr] items-baseline text-xs sm:text-sm text-[#2c4157] pb-3 border-b border-[#eef2f5] last:border-b-0 last:pb-0"
                      >
                        <span className="text-[11px] font-extrabold text-[#3d6cad]">
                          0{hIdx + 1}
                        </span>
                        <span className="leading-relaxed">{hl}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14">
            <button
              onClick={() => onNavigate('contact')}
              className="button button-primary cursor-pointer"
            >
              <span>
                {lang === 'id'
                  ? 'Diskusikan Kebutuhan Operasional Gedung Anda'
                  : 'Discuss Your Building Operational Needs'}
              </span>
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
