import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PortfolioPage from './pages/PortfolioPage';
import ResearchPage from './pages/ResearchPage';
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import ContactPage from './pages/ContactPage';

import { promindContent } from './data/promindContent';

export default function App() {
  const [lang, setLang] = useState('id');
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
      const validPages = ['home', 'services', 'portfolio', 'research', 'about', 'careers', 'contact'];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      } else if (!hash) {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (pageId) => {
    setCurrentPage(pageId);
    window.location.hash = `#/${pageId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = promindContent[lang];

  return (
    <div className="site-shell min-h-screen flex flex-col justify-between bg-[#f6f5f1] text-[#1d2936] font-sans antialiased">
      <div>
        <Navbar
          currentPage={currentPage}
          onNavigate={navigateTo}
          lang={lang}
          setLang={setLang}
          t={t}
        />

        <main id="main">
          {currentPage === 'home' && (
            <HomePage t={t} lang={lang} onNavigate={navigateTo} />
          )}
          {currentPage === 'services' && (
            <ServicesPage t={t} lang={lang} onNavigate={navigateTo} />
          )}
          {currentPage === 'portfolio' && (
            <PortfolioPage t={t} lang={lang} onNavigate={navigateTo} />
          )}
          {currentPage === 'research' && (
            <ResearchPage t={t} lang={lang} onNavigate={navigateTo} />
          )}
          {currentPage === 'about' && (
            <AboutPage t={t} lang={lang} onNavigate={navigateTo} />
          )}
          {currentPage === 'careers' && (
            <CareersPage t={t} lang={lang} onNavigate={navigateTo} />
          )}
          {currentPage === 'contact' && (
            <ContactPage t={t} lang={lang} onNavigate={navigateTo} />
          )}
        </main>
      </div>

      <Footer onNavigate={navigateTo} t={t} lang={lang} />
    </div>
  );
}
