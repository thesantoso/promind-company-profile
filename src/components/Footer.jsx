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
            <address className="whitespace-pre-line not-italic text-sm leading-relaxed text-[#526171]">
              {meta.hq}
            </address>
            <a
              href={`mailto:${meta.email}`}
              className="footer-email mt-3"
            >
              {meta.email}
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

          {/* Standards Column */}
          <div className="footer-column footer-standards">
            <h2>{lang === 'id' ? 'Standar & Sistem' : 'Standards & Systems'}</h2>
            <ul>
              {meta.standards.map((std) => (
                <li key={std.code}>
                  <strong>{std.code}</strong>
                  <span>{std.name}</span>
                </li>
              ))}
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
