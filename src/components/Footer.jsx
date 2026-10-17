import React from 'react';

export default function Footer({ onNavigate, t, lang }) {
  const logo = '/images/promind-header-brand.png';
  const meta = t.meta;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="PROMIND" />
            </div>
            <strong>{meta.companyName}</strong>
            <p>{meta.tagline}</p>
          </div>

          {/* Office Address Column */}
          <div className="footer-column">
            <h2>{lang === 'id' ? 'Kantor' : 'Office'}</h2>
            <address>
              Mangkuluhur City Office Tower One
              <br />
              Jl. Gatot Subroto Kav. 1-3
              <br />
              Karet Semanggi, Kecamatan Setiabudi
              <br />
              Kota Jakarta Selatan, DKI Jakarta 12930
            </address>
            <a
              href="mailto:corporate@promind.id"
              className="footer-email mt-3"
            >
              corporate@promind.id
            </a>
          </div>

          {/* Navigation Column */}
          <div className="footer-column">
            <h2>{lang === 'id' ? 'Navigasi' : 'Navigation'}</h2>
            {t.nav.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="block text-left text-sm text-[#31475f] hover:text-[#285bb0] mb-3 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Standards & PROAPPS Column */}
          <div className="footer-column footer-standards">
            <h2>{lang === 'id' ? 'Standar & Sistem' : 'Standards & System'}</h2>
            <ul>
              {meta.standards.map((std) => (
                <li key={std.code}>
                  <strong>{std.code}</strong>
                  <span>{std.name}</span>
                </li>
              ))}
              <li>
                <strong>PROAPPS</strong>
                <span>
                  {lang === 'id'
                    ? 'Digital Supporting Operasional Building Management'
                    : 'Digital Operational Support for Building Management'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; {new Date().getFullYear()} {meta.companyName}
          </span>
          <button
            type="button"
            onClick={scrollToTop}
            className="text-xs font-bold text-[#31475f] hover:text-[#285bb0] cursor-pointer"
          >
            {lang === 'id' ? 'Kembali ke atas ↑' : 'Back to top ↑'}
          </button>
        </div>
      </div>
    </footer>
  );
}
