import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

function formatPublishDate(dateString, isIndonesian) {
  if (!dateString) return isIndonesian ? '17 Okt 2026' : 'Oct 17, 2026';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(isIndonesian ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default function CareersPage({ t, lang, onNavigate }) {
  const c = t.careersPage;
  const isIndonesian = lang === 'id';
  const [selectedJob, setSelectedJob] = useState(null);
  const [applySubmitted, setApplySubmitted] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [cmsJobs, setCmsJobs] = useState(null);

  // Filter & Pagination States
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [currentPageNum, setCurrentPageNum] = useState(1);

  React.useEffect(() => {
    fetch('/api/careers.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.jobs)) {
          setCmsJobs(data.jobs);
        }
      })
      .catch(() => {});
  }, []);

  const allJobs = cmsJobs !== null ? cmsJobs : (c.jobs || []);

  // Extract unique departments for filter tabs
  const departments = useMemo(() => {
    const set = new Set();
    allJobs.forEach((j) => {
      if (j.dept) set.add(j.dept.trim());
    });
    return Array.from(set);
  }, [allJobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (selectedDept === 'ALL') return allJobs;
    return allJobs.filter((j) => (j.dept || '').trim() === selectedDept);
  }, [allJobs, selectedDept]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  const handleDeptChange = (dept) => {
    setSelectedDept(dept);
    setCurrentPageNum(1);
  };

  const currentJobs = useMemo(() => {
    const startIndex = (currentPageNum - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredJobs, currentPageNum]);

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
                {isIndonesian ? 'LINGKUNGAN KERJA' : 'WORK ENVIRONMENT'}
              </p>
              <h2>
                {isIndonesian
                  ? 'Budaya Kerja Terukur dan Profesional'
                  : 'Structured and Professional Working Culture'}
              </h2>
            </div>
            <p>
              {isIndonesian
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
              {isIndonesian ? 'POSISI TERBUKA' : 'OPEN ROLES'}
            </p>
            <h2>
              {isIndonesian
                ? 'Peluang Karir Operasional & Manajemen Gedung'
                : 'Building Operations & Management Opportunities'}
            </h2>
            <p>
              {isIndonesian
                ? 'Pilih posisi yang sesuai dengan kualifikasi Anda untuk mengirimkan lamaran kepada tim HR PROMIND.'
                : 'Select a role aligned with your qualifications to submit your application to the PROMIND HR team.'}
            </p>
          </div>

          {/* Department Filter Bar */}
          {departments.length > 0 && (
            <div className="career-filter-bar">
              <button
                type="button"
                onClick={() => handleDeptChange('ALL')}
                className={`career-filter-btn ${selectedDept === 'ALL' ? 'is-active' : ''}`}
              >
                <span>{isIndonesian ? 'Semua Departemen' : 'All Departments'}</span>
                <span className="career-filter-count">{allJobs.length}</span>
              </button>
              {departments.map((dept) => {
                const count = allJobs.filter((j) => (j.dept || '').trim() === dept).length;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => handleDeptChange(dept)}
                    className={`career-filter-btn ${selectedDept === dept ? 'is-active' : ''}`}
                  >
                    <span>{dept}</span>
                    <span className="career-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Jobs List */}
          <div className="border-t border-[#cbd2d9]">
            {currentJobs.length === 0 ? (
              <div className="py-20 text-center max-w-xl mx-auto">
                <p className="text-lg font-bold text-[#172b42] font-manrope mb-2">
                  {allJobs.length === 0
                    ? (isIndonesian ? 'Belum Ada Posisi Terbuka' : 'No Open Positions Currently')
                    : (isIndonesian ? 'Tidak Ada Posisi pada Kategori Ini' : 'No Positions in This Category')}
                </p>
                <p className="text-sm text-[#526374] leading-relaxed mb-6">
                  {allJobs.length === 0
                    ? (isIndonesian
                        ? 'Saat ini seluruh lowongan belum dipublikasikan atau sedang dalam tahap persiapan. Silakan periksa kembali di lain waktu atau hubungi tim HR kami.'
                        : 'There are currently no active job openings. Please check back later or contact our HR team.')
                    : (isIndonesian
                        ? 'Tidak ada lowongan terbuka pada departemen yang Anda pilih.'
                        : 'No open positions found in the selected department.')}
                </p>
                {allJobs.length > 0 && selectedDept !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => handleDeptChange('ALL')}
                    className="inline-flex items-center px-5 py-2.5 bg-[#ffffff] hover:bg-[#f0f5fc] text-[#2b5caf] border border-[#2b5caf] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    {isIndonesian ? 'Lihat Semua Lowongan' : 'View All Positions'}
                  </button>
                )}
              </div>
            ) : (
              currentJobs.map((job, idx) => {
                const globalIndex = (currentPageNum - 1) * ITEMS_PER_PAGE + idx + 1;
                const pubDateStr = formatPublishDate(job.published_at || job.created_at, isIndonesian);

                return (
                  <div
                    key={job.id}
                    className="py-8 border-b border-[#cbd2d9] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    <div className="lg:col-span-1">
                      <span className="text-xs font-extrabold text-[#2b5caf]">
                        {String(globalIndex).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="lg:col-span-4">
                      <h3
                        onClick={() =>
                          onNavigate && onNavigate(`careers/${job.slug || job.id}`)
                        }
                        className="text-xl font-bold text-[#172b42] hover:text-[#2b5caf] font-manrope mb-1 transition cursor-pointer"
                      >
                        {job.title}
                      </h3>
                      <div className="career-meta-row">
                        <span>{job.dept}</span>
                        {job.exp && (
                          <>
                            <span className="career-meta-dot">•</span>
                            <span>{job.exp}</span>
                          </>
                        )}
                        <span className="career-meta-dot">•</span>
                        <span className="career-meta-date" title={isIndonesian ? 'Tanggal Dipublikasikan' : 'Date Published'}>
                          <Calendar size={12} aria-hidden="true" />
                          <span>{pubDateStr}</span>
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <p className="text-sm text-[#526374] leading-relaxed m-0">
                        {job.desc}
                      </p>
                    </div>

                    <div className="lg:col-span-2 lg:text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate && onNavigate(`careers/${job.slug || job.id}`)
                        }
                        className="inline-flex items-center space-x-2 px-5 py-3 bg-[#2959ab] hover:bg-[#194586] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                      >
                        <span>{isIndonesian ? 'Detail & Lamar' : 'View & Apply'}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Component — only shown when filteredJobs > 5 */}
          {filteredJobs.length > ITEMS_PER_PAGE && (
            <div className="career-pagination" aria-label="Pagination">
              <span className="career-pagination-info">
                {isIndonesian
                  ? `Menampilkan ${(currentPageNum - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(currentPageNum * ITEMS_PER_PAGE, filteredJobs.length)} dari total ${filteredJobs.length} posisi`
                  : `Showing ${(currentPageNum - 1) * ITEMS_PER_PAGE + 1} - ${Math.min(currentPageNum * ITEMS_PER_PAGE, filteredJobs.length)} of ${filteredJobs.length} positions`}
              </span>

              <div className="career-pagination-btns">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPageNum((p) => Math.max(1, p - 1));
                    document.querySelector('.section-heading')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPageNum === 1}
                  className="career-page-nav-btn"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                  <span>{isIndonesian ? 'Sebelumnya' : 'Prev'}</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCurrentPageNum(num);
                      document.querySelector('.section-heading')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`career-page-num-btn ${currentPageNum === num ? 'is-active' : ''}`}
                    aria-current={currentPageNum === num ? 'page' : undefined}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPageNum((p) => Math.min(totalPages, p + 1));
                    document.querySelector('.section-heading')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={currentPageNum === totalPages}
                  className="career-page-nav-btn"
                  aria-label="Next Page"
                >
                  <span>{isIndonesian ? 'Berikutnya' : 'Next'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
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
