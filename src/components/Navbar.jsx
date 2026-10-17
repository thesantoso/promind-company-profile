import React, { useState } from 'react';
import { ArrowUpRight, Menu, X, Globe } from 'lucide-react';

export default function Navbar({ currentPage, onNavigate, lang, setLang, t }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logo = '/images/promind-header-brand.png';

  const navItems = t.nav;

  const handleLinkClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#e0e1de] shadow-sm transition-all duration-200">
      <div className="wrap flex items-center justify-between h-[84px] gap-6">
        {/* Brand Logo */}
        <button
          onClick={() => handleLinkClick('home')}
          className="flex items-center shrink-0 cursor-pointer text-left border-0 bg-transparent p-0"
          style={{ width: '185px', height: '58px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}
          aria-label="PROMIND Home"
        >
          <img
            src={logo}
            alt="PROMIND - PT Properti Manajemen Inovasi Indonesia"
            className="block mix-blend-multiply shrink-0"
            style={{ width: '320px', maxWidth: 'none', height: 'auto', display: 'block' }}
          />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-7" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleLinkClick(item.id)}
                className={`text-[13px] font-bold tracking-tight whitespace-nowrap transition cursor-pointer py-1 relative border-0 bg-transparent ${
                  isActive
                    ? 'text-[#2b5caf] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#2b5caf]'
                    : 'text-[#27384a] hover:text-[#2b5caf]'
                }`}
                style={{ background: 'transparent', border: 'none' }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center space-x-4 shrink-0">
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="text-xs font-bold text-[#3c4d60] hover:text-[#2b5caf] transition px-2 py-1 cursor-pointer border-0 bg-transparent"
            style={{ background: 'transparent', border: 'none' }}
          >
            {lang === 'id' ? 'ID / EN' : 'EN / ID'}
          </button>

          <button
            onClick={() => handleLinkClick('contact')}
            className="header-contact cursor-pointer border-0"
          >
            <span>{lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
            className="text-xs font-bold text-[#3c4d60] px-2 py-1"
          >
            {lang.toUpperCase()}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#18365f]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#faf9f6] border-t border-[#e0e1de] px-6 py-5 space-y-3 shadow-xl">
          <div className="text-[10px] uppercase font-bold text-[#2b5caf] tracking-wider mb-2">
            PT Properti Manajemen Inovasi Indonesia
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.id)}
              className={`block w-full text-left py-2.5 border-b border-[#e5e5e0] text-sm font-bold ${
                currentPage === item.id ? 'text-[#2b5caf]' : 'text-[#233547]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={() => handleLinkClick('contact')}
              className="w-full text-center py-3 bg-[#2959ab] text-white font-bold text-xs uppercase tracking-wider"
            >
              {lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

