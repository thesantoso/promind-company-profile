import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Copy, Link2, Share2 } from 'lucide-react';

function createShareUrl(slug) {
  return new URL(`/careers/${encodeURIComponent(slug)}`, window.location.origin).toString();
}

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

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Unable to copy text');
}

export default function CareerDetailPage({ job, lang, loading, onNavigate }) {
  const [shareUrl, setShareUrl] = useState('');
  const [copyState, setCopyState] = useState('');
  const isIndonesian = lang === 'id';
  const slug = job?.slug || job?.id;

  useEffect(() => {
    setShareUrl(slug ? createShareUrl(slug) : '');
  }, [slug]);

  useEffect(() => {
    if (!copyState) return undefined;
    const timeout = window.setTimeout(() => setCopyState(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  if (!job) {
    return (
      <div className="career-empty-state">
        <div className="wrap">
          <p className="eyebrow">{isIndonesian ? 'INFORMASI LOWONGAN' : 'CAREER INFORMATION'}</p>
          <h1>{loading
            ? isIndonesian ? 'Memuat lowongan' : 'Loading position'
            : isIndonesian ? 'Lowongan tidak ditemukan' : 'Position not found'}</h1>
          <p>{loading
            ? isIndonesian ? 'Mohon tunggu sebentar.' : 'Please wait a moment.'
            : isIndonesian
              ? 'Posisi ini mungkin telah ditutup atau tautannya tidak tersedia.'
              : 'This position may have closed or the link is unavailable.'}</p>
          {!loading && (
            <button type="button" onClick={() => onNavigate('careers')} className="career-back-link">
              <ArrowLeft size={16} aria-hidden="true" />
              {isIndonesian ? 'Kembali ke daftar karir' : 'Back to careers'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const emailToApply = job.email || 'recruitment@promind.id';
  const subjectText = `${isIndonesian ? 'Lamaran' : 'Application'} - ${job.title} - [${isIndonesian ? 'Nama Lengkap' : 'Full Name'}]`;
  const emailBody = isIndonesian
    ? ['Yth. Tim Human Resources PROMIND,', '', `Saya ingin mengajukan lamaran untuk posisi ${job.title}.`, 'CV terbaru dan dokumen pendukung terlampir untuk pertimbangan.', '', 'Nama lengkap:', 'Nomor telepon:']
    : ['Dear PROMIND Human Resources Team,', '', `I would like to apply for the ${job.title} position.`, 'My latest CV and supporting documents are attached for your consideration.', '', 'Full name:', 'Phone number:'];
  const mailtoUrl = `mailto:${emailToApply}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(emailBody.join('\n'))}`;

  const sections = [
    {
      id: 'career-responsibilities',
      label: isIndonesian ? 'Lingkup pekerjaan' : 'Role scope',
      navLabel: isIndonesian ? 'Tanggung jawab' : 'Responsibilities',
      title: isIndonesian ? 'Tanggung Jawab Utama & Eksekusi Operasional' : 'Key Responsibilities & Operational Execution',
      items: Array.isArray(job.responsibilities) ? job.responsibilities : [],
    },
    {
      id: 'career-qualifications',
      label: isIndonesian ? 'Kriteria kandidat' : 'Candidate criteria',
      navLabel: isIndonesian ? 'Kualifikasi' : 'Qualifications',
      title: isIndonesian ? 'Kualifikasi & Persyaratan Kompetensi' : 'Qualifications & Competency Requirements',
      items: Array.isArray(job.qualifications) ? job.qualifications : [],
    },
    {
      id: 'career-benefits',
      label: isIndonesian ? 'Lingkungan kerja' : 'Working environment',
      navLabel: isIndonesian ? 'Lingkungan kerja' : 'Working environment',
      title: isIndonesian ? 'Kompensasi & Dukungan Profesional' : 'Compensation & Professional Support',
      items: Array.isArray(job.benefits) ? job.benefits : [],
    },
  ].filter((section) => section.items.length > 0);

  const shareTitle = isIndonesian ? `Lowongan ${job.title} di PROMIND` : `${job.title} at PROMIND`;
  const shareLinks = shareUrl ? {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
  } : {};

  const handleCopy = async (value, target) => {
    try {
      await copyText(value);
      setCopyState(target);
    } catch {
      setCopyState(`${target}-error`);
    }
  };

  const handleOtherShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: job.desc || shareTitle, url: shareUrl });
      } catch (error) {
        if (error?.name !== 'AbortError') setCopyState('share-error');
      }
      return;
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`;
  };

  return (
    <div className="career-detail-page">
      <section id="career-overview" className="career-intro" aria-labelledby="career-title">
        <div className="wrap">
          <div className="career-back-row">
            <button type="button" onClick={() => onNavigate('careers')} className="career-back-link">
              <ArrowLeft size={16} aria-hidden="true" />
              {isIndonesian ? 'Kembali ke karir' : 'Back to careers'}
            </button>
          </div>

          <div className="career-intro-copy">
            <p className="eyebrow">{job.dept}</p>
            <h1 id="career-title">{job.title}</h1>
            {job.desc && <p className="career-intro-description">{job.desc}</p>}
          </div>

          <dl className="career-spec-grid">
            <div className="career-spec-col"><dt>{isIndonesian ? 'Departemen' : 'Department'}</dt><dd>{job.dept}</dd></div>
            <div className="career-spec-col"><dt>{isIndonesian ? 'Tipe kerja' : 'Employment type'}</dt><dd>{job.type || 'Full-Time'}</dd></div>
            <div className="career-spec-col"><dt>{isIndonesian ? 'Lokasi penempatan' : 'Location'}</dt><dd>{job.location || 'Jakarta'}</dd></div>
            <div className="career-spec-col"><dt>{isIndonesian ? 'Pengalaman' : 'Experience'}</dt><dd>{job.exp || (isIndonesian ? 'Berpengalaman' : 'Experienced')}</dd></div>
            <div className="career-spec-col"><dt>{isIndonesian ? 'Tanggal Publikasi' : 'Date Posted'}</dt><dd>{formatPublishDate(job.published_at || job.created_at, isIndonesian)}</dd></div>
          </dl>

          <div className="career-share-bar">
            <span className="career-share-label">{isIndonesian ? 'Bagikan lowongan:' : 'Share position:'}</span>
            <div className="career-share-actions">
              {shareUrl && (
                <>
                  {/* Facebook */}
                  <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="career-share-btn"
                    aria-label="Share to Facebook"
                    title="Bagikan ke Facebook"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={shareLinks.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="career-share-btn"
                    aria-label="Share to X"
                    title="Bagikan ke X"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={shareLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="career-share-btn"
                    aria-label="Share to WhatsApp"
                    title="Bagikan ke WhatsApp"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.181-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.3-.502.1-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.238-.244-.589-.493-.509-.678-.519l-.578-.01c-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.511 0 1.482 1.079 2.912 1.23 3.113.15.201 2.123 3.242 5.143 4.547.718.31 1.279.496 1.716.635.721.23 1.377.197 1.896.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.126-.276-.201-.577-.352z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.548 4.101 1.512 5.827L0 24l6.347-1.477A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.84c-1.848 0-3.569-.509-5.044-1.393l-.362-.217-3.766.877.896-3.667-.238-.378C2.551 15.539 2.04 13.834 2.04 12c0-5.503 4.457-9.96 9.96-9.96 5.503 0 9.96 4.457 9.96 9.96 0 5.503-4.457 9.96-9.96 9.96z"/>
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={shareLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="career-share-btn"
                    aria-label="Share to LinkedIn"
                    title="Bagikan ke LinkedIn"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                </>
              )}

              {/* Salin Tautan */}
              <button
                type="button"
                onClick={() => handleCopy(shareUrl, 'link')}
                disabled={!shareUrl}
                className={`career-share-btn ${copyState === 'link' ? 'is-copied' : ''}`}
                aria-label={copyState === 'link' ? 'Tautan tersalin' : 'Salin tautan lowongan'}
                title={copyState === 'link' ? 'Tautan tersalin' : 'Salin tautan lowongan'}
              >
                {copyState === 'link' ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
              </button>

              {/* Lainnya (Web Share API) */}
              <button
                type="button"
                onClick={handleOtherShare}
                disabled={!shareUrl}
                className="career-share-btn"
                aria-label="Bagikan lainnya"
                title="Bagikan lainnya"
              >
                <Share2 size={17} aria-hidden="true" />
              </button>
            </div>

            <span className={copyState === 'link' ? 'career-share-feedback' : 'career-share-feedback is-error'} role="status" aria-live="polite">
              {copyState === 'link'
                ? isIndonesian ? '✓ Tautan lowongan berhasil disalin!' : '✓ Link copied!'
                : copyState === 'link-error'
                  ? isIndonesian ? 'Tautan gagal disalin. Silakan coba lagi.' : 'Could not copy link.'
                  : copyState === 'share-error'
                    ? isIndonesian ? 'Opsi berbagi tidak dapat dibuka.' : 'Sharing options unavailable.'
                    : ''}
            </span>
          </div>
        </div>
      </section>

      {sections.length > 0 && (
        <section className="career-content-section" aria-label={isIndonesian ? 'Detail posisi' : 'Position details'}>
          <div className="wrap career-content-layout">
            <nav className="career-section-nav" aria-label={isIndonesian ? 'Isi halaman' : 'On this page'}>
              <p>{isIndonesian ? 'Dalam posisi ini' : 'In this role'}</p>
              {sections.map((section) => (
                <button key={section.id} type="button" onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}>
                  {section.navLabel}
                </button>
              ))}
              <button type="button" onClick={() => document.getElementById('career-apply')?.scrollIntoView({ behavior: 'smooth' })}>
                {isIndonesian ? 'Cara melamar' : 'How to apply'}
              </button>
            </nav>

            <div className="career-content-flow">
              {sections.map((section) => (
                <article key={section.id} id={section.id} className="career-content-group" aria-labelledby={`${section.id}-title`}>
                  <p className="career-content-kicker">{section.label}</p>
                  <h2 id={`${section.id}-title`}>{section.title}</h2>
                  <ul className="career-detail-list">
                    {section.items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="career-apply" className="career-apply-section" aria-labelledby="career-apply-title">
        <div className="wrap career-apply-grid">
          <div className="career-apply-lead">
            <p className="eyebrow">{isIndonesian ? 'PENGAJUAN LAMARAN' : 'HOW TO APPLY'}</p>
            <h2 id="career-apply-title">{isIndonesian ? 'Kirimkan Lamaran Anda' : 'Submit Your Application'}</h2>
            <p>{isIndonesian
              ? 'Kirim CV terbaru dan dokumen pendukung ke alamat rekrutmen berikut. Cantumkan posisi yang dilamar pada subjek email.'
              : 'Send your latest CV and supporting documents to the recruitment email below. Include the position in the subject line.'}</p>
          </div>

          <div className="career-apply-content">
            <dl className="career-apply-details">
              <div>
                <dt>{isIndonesian ? 'Email tujuan' : 'Recruitment email'}</dt>
                <dd>
                  <a href={mailtoUrl}>{emailToApply}</a>
                  <button type="button" onClick={() => handleCopy(emailToApply, 'email')} className="career-copy-inline">
                    {copyState === 'email' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    {copyState === 'email' ? isIndonesian ? 'Tersalin' : 'Copied' : isIndonesian ? 'Salin email' : 'Copy email'}
                  </button>
                </dd>
              </div>
              <div><dt>{isIndonesian ? 'Subjek email' : 'Email subject'}</dt><dd>{subjectText}</dd></div>
              <div><dt>{isIndonesian ? 'Berkas lampiran' : 'Attachments'}</dt><dd>{isIndonesian ? 'CV terbaru (PDF) dan sertifikat pendukung' : 'Latest CV (PDF) and relevant certificates'}</dd></div>
            </dl>
            <a href={mailtoUrl} className="career-apply-cta">
              {isIndonesian ? 'Kirim lamaran via email' : 'Apply via email'}
              <ArrowUpRight size={19} aria-hidden="true" />
            </a>
            <span className={copyState === 'email' ? 'sr-only' : 'career-apply-feedback'} role="status" aria-live="polite">
              {copyState === 'email'
                ? isIndonesian ? 'Email rekrutmen tersalin.' : 'Recruitment email copied.'
                : copyState === 'email-error'
                  ? isIndonesian ? 'Email gagal disalin. Coba lagi.' : 'Could not copy the email. Please try again.'
                  : ''}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
