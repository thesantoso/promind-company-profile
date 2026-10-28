import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { buildInquiryMailto } from '../inquiry';

export default function ContactPage({ t, lang }) {
  const c = t.contactPage;
  const [submitted, setSubmitted] = useState(false);

  const propertyTypes = [
    'Office Building',
    'Apartment',
    'Mall & Commercial',
    'Real Estate',
  ];

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    propertyType: propertyTypes[0],
    need: c.serviceOptions[0],
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject =
      lang === 'id'
        ? `Konsultasi Pengelolaan Properti — ${formData.company || formData.name}`
        : `Property Management Inquiry — ${formData.company || formData.name}`;
    const targetEmail = t.meta?.email || 'corporate@promind.id';
    const mailtoUrl = buildInquiryMailto(targetEmail, subject, formData);
    window.location.href = mailtoUrl;
    setSubmitted(true);
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

      {/* Main Contact Form Section */}
      <section className="contact section-pad">
        <div className="wrap contact-grid">
          <div className="contact-lead">
            <p className="eyebrow">
              {lang === 'id' ? 'DISKUSI KEBUtUHAN PROPERTI' : 'PROPERTY INQUIRY'}
            </p>
            <h2>
              {lang === 'id'
                ? 'Sampaikan Profil Aset dan Kebutuhan Pengelolaan Anda.'
                : 'Share Your Property Profile and Management Requirements.'}
            </h2>
            <p>
              {lang === 'id'
                ? 'Tim PROMIND siap mendiskusikan kebutuhan operasional untuk Office Building, Apartment, Mall, maupun kawasan Real Estate Anda.'
                : 'The PROMIND team is ready to discuss operational requirements for your Office Building, Apartment, Mall, or Real Estate development.'}
            </p>
            <a href={`mailto:${t.meta?.email || 'corporate@promind.id'}`}>
              {t.meta?.email || 'corporate@promind.id'}
            </a>
          </div>

          <div>
            {submitted ? (
              <div className="bg-[#214f8e] border border-[#7e9bc4] p-8 space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#a9c8f4] block">
                  {lang === 'id' ? 'TERIMA KASIH' : 'THANK YOU'}
                </span>
                <p className="text-base text-white leading-relaxed m-0">
                  {c.formSuccess}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="button button-light cursor-pointer mt-4"
                >
                  <span>
                    {lang === 'id' ? 'Kirim Pesan Lain' : 'Send Another Message'}
                  </span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="inquiry-form">
                <label>
                  <span>{lang === 'id' ? 'Nama Lengkap' : 'Full Name'}</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </label>

                <label>
                  <span>
                    {lang === 'id'
                      ? 'Perusahaan / Organisasi'
                      : 'Company / Organization'}
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </label>

                <label>
                  <span>{lang === 'id' ? 'Email' : 'Email'}</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </label>

                <label>
                  <span>{lang === 'id' ? 'Nomor Telepon' : 'Phone Number'}</span>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </label>

                <label>
                  <span>{lang === 'id' ? 'Jenis Properti' : 'Property Type'}</span>
                  <select
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value })
                    }
                  >
                    {propertyTypes.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>
                    {lang === 'id' ? 'Kebutuhan Layanan' : 'Service Needed'}
                  </span>
                  <select
                    value={formData.need}
                    onChange={(e) =>
                      setFormData({ ...formData, need: e.target.value })
                    }
                  >
                    {c.serviceOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-wide">
                  <span>
                    {lang === 'id' ? 'Catatan Tambahan' : 'Additional Notes'}
                  </span>
                  <textarea
                    rows="4"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  />
                </label>

                <button
                  type="submit"
                  className="button button-light form-submit"
                >
                  <span>
                    {lang === 'id' ? 'Kirim Pesan' : 'Submit Inquiry'}
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
