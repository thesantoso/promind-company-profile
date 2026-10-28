import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './react-pages/HomePage';
import ServicesPage from './react-pages/ServicesPage';
import PortfolioPage from './react-pages/PortfolioPage';
import ResearchPage from './react-pages/ResearchPage';
import AboutPage from './react-pages/AboutPage';
import CareersPage from './react-pages/CareersPage';
import CareerDetailPage from './react-pages/CareerDetailPage';
import ContactPage from './react-pages/ContactPage';

import { promindContent } from './data/promindContent';
import cachedSiteContent from './data/cachedSiteContent.json';

export default function App() {
  const [lang, setLang] = useState('id');
  const [currentPage, setCurrentPage] = useState('home');
  const [activeJobSlug, setActiveJobSlug] = useState(null);
  const [cmsContent, setCmsContent] = useState(cachedSiteContent || null);
  const [cmsResolved, setCmsResolved] = useState(true);

  useEffect(() => {
    fetch('/api/site-content.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setCmsContent(data);
        }
      })
      .catch(() => {})
      .finally(() => setCmsResolved(true));
  }, []);

  useEffect(() => {
    const resolveRoute = () => {
      // 1. Try clean pathname first (e.g., /careers/building-manager or /services)
      const path = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      const routeStr = path || rawHash;
      const lower = routeStr.toLowerCase();

      if (lower.startsWith('careers/')) {
        const encodedSlug = routeStr.substring('careers/'.length);
        let slug = encodedSlug;
        try {
          slug = decodeURIComponent(encodedSlug);
        } catch {
          slug = encodedSlug;
        }
        setCurrentPage('career-detail');
        setActiveJobSlug(slug);
      } else {
        const validPages = ['home', 'services', 'portfolio', 'research', 'about', 'careers', 'contact'];
        if (validPages.includes(lower)) {
          setCurrentPage(lower);
          setActiveJobSlug(null);
        } else if (!lower) {
          const sharedSlug = new URLSearchParams(window.location.search).get('career');
          setCurrentPage(sharedSlug ? 'career-detail' : 'home');
          setActiveJobSlug(sharedSlug);
        }
      }
    };

    resolveRoute();
    window.addEventListener('popstate', resolveRoute);
    window.addEventListener('hashchange', resolveRoute);
    return () => {
      window.removeEventListener('popstate', resolveRoute);
      window.removeEventListener('hashchange', resolveRoute);
    };
  }, []);

  const navigateTo = (pageId) => {
    const cleanPage = pageId.replace(/^#\/?/, '').replace(/^\/+/, '');
    let targetPath = '/';

    if (cleanPage && cleanPage !== 'home') {
      targetPath = `/${cleanPage}`;
    }

    if (cleanPage.startsWith('careers/')) {
      const slug = cleanPage.substring('careers/'.length);
      setCurrentPage('career-detail');
      setActiveJobSlug(slug);
    } else {
      setCurrentPage(cleanPage === '' ? 'home' : cleanPage);
      setActiveJobSlug(null);
    }

    // Push clean URL to browser history without '#'
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const baseT = promindContent[lang];
  const t = useMemo(() => {
    if (!cmsContent) return baseT;

    const merged = JSON.parse(JSON.stringify(baseT));

    // 1. Merge Company Info
    if (cmsContent.companyInfo) {
      const ci = cmsContent.companyInfo;
      if (ci.companyName) merged.meta.companyName = ci.companyName;
      if (ci.shortName) merged.meta.shortName = ci.shortName;
      if (ci.tagline) merged.meta.tagline = ci.tagline;
      if (ci.subTagline) merged.meta.subTagline = ci.subTagline;
      if (ci.hq) merged.meta.hq = ci.hq;
      if (ci.email) merged.meta.email = ci.email;
      if (ci.phone) merged.meta.phone = ci.phone;
    }

    // 2. Merge Fieldwork (Eksekusi di Lapangan)
    if (Array.isArray(cmsContent.fieldwork)) {
      merged.home.fieldwork.items = cmsContent.fieldwork;
    }

    // 3. Merge Research (Wawasan)
    if (Array.isArray(cmsContent.research)) {
      merged.researchPage.reports = cmsContent.research;
    }

    // 4. Merge Careers
    if (Array.isArray(cmsContent.careers)) {
      merged.careersPage.jobs = cmsContent.careers;
    }

    // 5. Merge Services (Cakupan Layanan)
    if (Array.isArray(cmsContent.services)) {
      merged.servicesPage.pillars = cmsContent.services;
    }

    // 6. Merge Property Scopes (Cakupan Pengelolaan Properti)
    if (Array.isArray(cmsContent.propertyScopes)) {
      merged.home.hero.scopes = cmsContent.propertyScopes;
    }

    return merged;
  }, [baseT, cmsContent]);

  const activeJob = useMemo(() => {
    if (!activeJobSlug) return null;
    const allJobs = t.careersPage?.jobs || [];
    return allJobs.find(
      (j) => j.slug === activeJobSlug || j.id === activeJobSlug
    ) || null;
  }, [activeJobSlug, t.careersPage?.jobs]);

  return (
    <div className="site-shell min-h-screen flex flex-col justify-between bg-[#f6f5f1] text-[#1d2936] font-sans antialiased">
      <div>
        <Navbar
          currentPage={currentPage === 'career-detail' ? 'careers' : currentPage}
          onNavigate={navigateTo}
          lang={lang}
          setLang={setLang}
          t={t}
        />

        <main id="main">
          {currentPage === 'home' && (
            <HomePage
              t={t}
              lang={lang}
              onNavigate={navigateTo}
              dynamicClients={cmsContent?.clients}
              dynamicFieldwork={cmsContent?.fieldwork}
              dynamicHeroSlides={cmsContent?.heroSlides}
            />
          )}
          {currentPage === 'services' && (
            <ServicesPage t={t} lang={lang} onNavigate={navigateTo} />
          )}
          {currentPage === 'portfolio' && (
            <PortfolioPage
              t={t}
              lang={lang}
              onNavigate={navigateTo}
              dynamicPortfolio={cmsContent?.portfolio}
            />
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
          {currentPage === 'career-detail' && (
            <CareerDetailPage
              job={activeJob}
              lang={lang}
              loading={!cmsResolved && !activeJob}
              onNavigate={navigateTo}
            />
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
