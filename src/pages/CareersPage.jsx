import React, { useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';

export default function CareersPage({ t, lang }) {
  const c = t.careersPage;
  const [selectedJob, setSelectedJob] = useState(null);
  const [applySubmitted, setApplySubmitted] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  const handleApplySubmit = (e) => {
    e.preventDefault();
    setApplySubmitted(true);
    setTimeout(() => {
      setSelectedJob(null);
      setApplySubmitted(false);
      setCandidateName('');
      setCandidateEmail('');
    }, 3000);
  };

  return (
    <div className="bg-[#f6f5f1]">
      {/* Clean Editorial Header */}
      <section className="bg-white border-b border-[#d8dfe5] py-20">
        <div className="wrap">
          <div className="max-w-3xl">
            <p className="eyebrow">{c.eyebrow}</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#172b42] font-manrope leading-tight mb-5">
              {c.title}
            </h1>
            <p className="text-base sm:text-lg text-[#526374] leading-relaxed m-0">
              {c.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Culture & Working Environment */}
      <section className="value-section">
        <div className="wrap">
          <div className="value-heading">
            <div>
              <p className="eyebrow">
                {lang === 'id' ? 'LINGKUNGAN KERJA' : 'WORK ENVIRONMENT'}
              </p>
              <h2>
                {lang === 'id'
                  ? 'Budaya Kerja Terukur dan Profesional'
                  : 'Structured and Professional Working Culture'}
              </h2>
            </div>
            <p>
              {lang === 'id'
                ? 'Kami membangun tim operasional yang disiplin di lapangan dan didukung oleh sistem kerja yang rapi.'
                : 'We build disciplined field teams supported by organized operational systems.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#bdc9d2] pt-6">
            {c.culturePoints.map((pt, idx) => (
              <article key={idx}>
                <span className="text-xs font-extrabold text-[#2b5caf] block mb-3">
                  0{idx + 1}
                </span>
                <h3 className="text-xl font-bold text-[#172b42] font-manrope mb-2">
                  {pt.title}
                </h3>
                <p className="text-sm text-[#5b6874] leading-relaxed m-0">
                  {pt.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles List — Clean Hairline Rows */}
      <section className="section-pad bg-white">
        <div className="wrap">
          <div className="section-heading">
            <p className="eyebrow">
              {lang === 'id' ? 'POSISI TERBUKA' : 'OPEN ROLES'}
            </p>
            <h2>
              {lang === 'id'
                ? 'Peluang Karir Operasional & Manajemen Gedung'
                : 'Building Operations & Management Opportunities'}
            </h2>
            <p>
              {lang === 'id'
                ? 'Pilih posisi yang sesuai dengan kualifikasi Anda untuk mengirimkan lamaran kepada tim HR PROMIND.'
                : 'Select a role aligned with your qualifications to submit your application to the PROMIND HR team.'}
            </p>
          </div>

          <div className="border-t border-[#cbd2d9]">
            {c.jobs.map((job, idx) => (
              <div
                key={job.id}
                className="py-8 border-b border-[#cbd2d9] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                <div className="lg:col-span-1">
                  <span className="text-xs font-extrabold text-[#2b5caf]">
                    0{idx + 1}
                  </span>
                </div>

                <div className="lg:col-span-4">
                  <h3 className="text-xl font-bold text-[#172b42] font-manrope mb-1">
                    {job.title}
                  </h3>
                  <span className="text-xs font-bold text-[#5b6874] uppercase tracking-wider">
                    {job.dept} • {job.exp}
                  </span>
                </div>

                <div className="lg:col-span-5">
                  <p className="text-sm text-[#526374] leading-relaxed m-0">
                    {job.desc}
                  </p>
                </div>

                <div className="lg:col-span-2 lg:text-right">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-[#2959ab] hover:bg-[#194586] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    <span>{lang === 'id' ? 'Lamar' : 'Apply'}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full p-8 border border-[#cbd5e1] shadow-xl relative">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-5 right-5 text-[#526374] hover:text-[#172b42] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {applySubmitted ? (
              <div className="py-8 space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#2959ab] block">
                  {lang === 'id' ? 'TERKIRIM' : 'SUBMITTED'}
                </span>
                <h4 className="text-2xl font-bold text-[#172b42] font-manrope">
                  {lang === 'id' ? 'Lamaran Anda Telah Diterima' : 'Application Received'}
                </h4>
                <p className="text-sm text-[#526374] leading-relaxed">
                  {lang === 'id'
                    ? `Terima kasih ${candidateName}. Data Anda untuk posisi ${selectedJob.title} telah tercatat oleh tim HR PROMIND.`
                    : `Thank you ${candidateName}. Your application for ${selectedJob.title} has been recorded by the PROMIND HR team.`}
                </p>
              </div>
            ) : (
              <div>
                <p className="eyebrow mb-2">
                  {lang === 'id' ? 'FORMULIR LAMARAN' : 'APPLICATION FORM'}
                </p>
                <h3 className="text-2xl font-bold text-[#172b42] font-manrope mb-6">
                  {selectedJob.title}
                </h3>

                <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#334b63] mb-1.5">
                      {lang === 'id' ? 'Nama Lengkap' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-3.5 py-3 bg-[#f8fafc] border border-[#cbd5e1] text-sm text-[#172b42] focus:outline-none focus:border-[#2959ab]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#334b63] mb-1.5">
                      {lang === 'id' ? 'Alamat Email' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full px-3.5 py-3 bg-[#f8fafc] border border-[#cbd5e1] text-sm text-[#172b42] focus:outline-none focus:border-[#2959ab]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#334b63] mb-1.5">
                      {lang === 'id' ? 'Ringkasan Pengalaman Kerja' : 'Summary of Experience'}
                    </label>
                    <textarea
                      rows="3"
                      required
                      className="w-full px-3.5 py-3 bg-[#f8fafc] border border-[#cbd5e1] text-sm text-[#172b42] focus:outline-none focus:border-[#2959ab]"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="button button-primary w-full justify-center cursor-pointer"
                    >
                      <span>{lang === 'id' ? 'Kirim Lamaran' : 'Submit Application'}</span>
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
