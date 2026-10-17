import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const HERO_SLIDES = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Jakarta_Scyscrappers_from_Hutan_Kota_GBK.jpg/1920px-Jakarta_Scyscrappers_from_Hutan_Kota_GBK.jpg",
    alt: "Deretan gedung pencakar langit kawasan Sudirman dan SCBD Jakarta",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Jakarta_CBD.jpg/1920px-Jakarta_CBD.jpg",
    alt: "Gedung perkantoran dan komersial di Central Business District Jakarta",
  },
  {
    url: "/assets/jakarta-skyline-3.jpg",
    alt: "Panorama malam kawasan bisnis Semanggi dan gedung pencakar langit Jakarta",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/SCBD%2C_Jakarta.jpg/1280px-SCBD%2C_Jakarta.jpg",
    alt: "Kawasan terpadu gedung pencakar langit di Jakarta",
  },
];

export default function HomePage({ t, lang, onNavigate }) {
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const home = t.home;
  const services = t.servicesPage.pillars;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setActiveSlide(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
    );
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const clients = [
    ["Icon Apartment", "Apartment"],
    ["Kingsland", "Real Estate"],
    ["Mandiri University", "Corporate Facility"],
    ["NT Tower", "Office Building"],
    ["Paladian Park", "Apartment"],
    ["Park Royale", "Apartment"],
    ["Permata Hijau", "Apartment"],
    ["Plaza Pasifik", "Commercial"],
    ["Prasastha", "Real Estate"],
    ["Ravindo", "Office Building"],
    ["Taman Sari", "Apartment"],
    ["The Park", "Residence"],
    ["Patra Jasa", "Property"],
    ["WIKA", "Property"],
  ];

  return (
    <div>
      {/* 1. Hero Section — Real Jakarta Skyscrapers Slider */}
      <section className="hero">
        <div className="wrap hero-content">
          <div className="hero-copy">
            <p className="eyebrow">{home.hero.eyebrow}</p>

            <h1>
              {home.hero.titleMain} <em>{home.hero.titleHighlight}</em>
            </h1>

            <p className="hero-description">{home.hero.description}</p>

            <div className="hero-actions">
              <button
                onClick={() => onNavigate("contact")}
                className="button button-primary cursor-pointer"
              >
                <span>{home.hero.ctaPrimary}</span>
                <ArrowUpRight size={18} />
              </button>

              <button
                onClick={() => onNavigate("services")}
                className="text-link text-[#1d3c67] hover:text-[#2b5caf] cursor-pointer"
              >
                {home.hero.ctaSecondary}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Real Skyscrapers Image Slider */}
        <div className="hero-image">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.url}
              className={`hero-slide ${idx === activeSlide ? "is-active" : ""}`}
              aria-hidden={idx !== activeSlide}
            >
              <img
                src={slide.url}
                alt={slide.alt}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
          <div className="hero-gradient" />

          {/* Minimalist Slider Controls */}
          <div className="hero-slider-controls">
            <button
              type="button"
              onClick={prevSlide}
              className="text-white/80 hover:text-white p-1 cursor-pointer"
              aria-label={lang === "id" ? " Foto sebelumnya" : "Previous photo"}
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-1.5 px-1">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`hero-dot cursor-pointer ${idx === activeSlide ? "is-active" : ""}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              className="text-white/80 hover:text-white p-1 cursor-pointer"
              aria-label={lang === "id" ? "Foto berikutnya" : "Next photo"}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Managed Property Scope & PROAPPS Digital Supporting Bar (Addressing Foto 1 cleanly) */}
      <section className="bg-white border-b border-[#d8dfe5] py-14">
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* 4 Core Managed Asset Types */}
            <div className="lg:col-span-8">
              <p className="eyebrow mb-5">{home.hero.scopeTitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-[#cfd8e0]">
                {home.hero.scopes.map((item, idx) => (
                  <div key={idx} className="pr-2">
                    <span className="text-[11px] font-extrabold text-[#2b5caf] block mb-1.5">
                      0{idx + 1}
                    </span>
                    <h2 className="text-base font-bold text-[#172b42] font-manrope mb-1.5 tracking-tight">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[#5b6874] leading-relaxed m-0">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* PROAPPS as Digital Supporting System */}
            <div className="lg:col-span-4 bg-[#f4f7fa] border-l-2 border-[#2b5caf] p-6 self-stretch flex flex-col justify-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#2b5caf] block mb-2">
                {home.hero.supportingLabel}
              </span>
              <div className="text-xl font-extrabold text-[#172b42] font-manrope tracking-tight mb-2">
                PROAPPS
              </div>
              <p className="text-xs sm:text-sm text-[#4f5f70] leading-relaxed m-0">
                {home.hero.supportingText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Editorial Focus Intro */}
      <section className="intro section-pad border-b border-[#e2e6ea]">
        <div className="wrap intro-grid">
          <p className="eyebrow">{home.intro.eyebrow}</p>
          <div>
            <h2>{home.intro.title}</h2>
            <p>{home.intro.body}</p>
          </div>
        </div>
      </section>

      {/* 4. Property Sectors Managed (Office Building, Apartment, Mall, Real Estate) */}
      <section className="value-section">
        <div className="wrap">
          <div className="value-heading">
            <div>
              <p className="eyebrow">{home.sectors.eyebrow}</p>
              <h2>{home.sectors.title}</h2>
            </div>
            <p>{home.sectors.subtitle}</p>
          </div>

          <div className="value-list">
            {home.sectors.items.map((sector) => (
              <article key={sector.num}>
                <span>{sector.num}</span>
                <h3>{sector.title}</h3>
                <p>{sector.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Core Services Summary */}
      <section className="services section-pad">
        <div className="wrap">
          <div className="section-heading">
            <p className="eyebrow">{t.servicesPage.eyebrow}</p>
            <h2>{t.servicesPage.title}</h2>
            <p>{t.servicesPage.subtitle}</p>
          </div>

          <div className="service-list">
            {services.map((srv) => (
              <div key={srv.num} className="service-row">
                <span className="service-index">{srv.num}</span>
                <h3>{srv.title}</h3>
                <p>{srv.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <button
              onClick={() => onNavigate("services")}
              className="button button-primary cursor-pointer"
            >
              <span>
                {lang === "id"
                  ? "Lihat Rincian Layanan"
                  : "View Detailed Services"}
              </span>
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Field Execution Documentation — Clean Editorial without location or image stickers (Addressing Foto 2) */}
      <section className="fieldwork section-pad border-t border-[#e2e6ea]">
        <div className="wrap">
          <div className="fieldwork-heading">
            <div>
              <p className="eyebrow">{home.fieldwork.eyebrow}</p>
              <h2>{home.fieldwork.title}</h2>
            </div>
            <p>{home.fieldwork.subtitle}</p>
          </div>

          <div className="fieldwork-grid">
            {home.fieldwork.items.map((item, idx) => (
              <figure
                key={item.num}
                className={`fieldwork-item fieldwork-item-${idx + 1}`}
              >
                <div className="fieldwork-photo">
                  <img src={item.photo} alt={item.title} loading="lazy" />
                </div>
                <figcaption>
                  <span className="fieldwork-number">{item.num}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PROAPPS Digital Supporting System */}
      <section className="technology section-pad">
        <div className="wrap technology-grid">
          <div className="technology-copy">
            <p className="eyebrow">{home.technology.eyebrow}</p>
            <h2>{home.technology.title}</h2>
            <p>{home.technology.description}</p>
            <div className="technology-wordmark">
              PROAPPS{" "}
              <span>Digital Supporting System for Building Management</span>
            </div>
          </div>

          <div className="technology-flow">
            {home.technology.steps.map((step) => (
              <article key={step.num}>
                <span>{step.num}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Client Experience Marquee */}
      <section className="clients section-pad">
        <div className="wrap">
          <div className="clients-heading">
            <div>
              <p className="eyebrow">
                {lang === "id"
                  ? "PORTOFOLIO & PENGALAMAN"
                  : "PORTFOLIO & EXPERIENCE"}
              </p>
              <h2>
                {lang === "id"
                  ? "Properti & Organisasi yang Telah Kami Layani."
                  : "Properties & Organizations We Have Served."}
              </h2>
            </div>
            <div className="clients-intro">
              <p>
                {lang === "id"
                  ? "Rekam jejak pengelolaan dan pendampingan operasional tim PROMIND di berbagai gedung perkantoran, apartemen, pusat komersial, dan fasilitas institusi."
                  : "Operational track record of the PROMIND team across office buildings, apartments, commercial complexes, and institutional facilities."}
              </p>
              <button
                className="marquee-control cursor-pointer"
                type="button"
                onClick={() => setMarqueePaused(!marqueePaused)}
              >
                {marqueePaused ? <Play size={14} /> : <Pause size={14} />}{" "}
                {marqueePaused
                  ? lang === "id"
                    ? "Jalankan daftar klien"
                    : "Play marquee"
                  : lang === "id"
                    ? "Jeda daftar klien"
                    : "Pause marquee"}
              </button>
            </div>
          </div>

          <div
            className={"client-marquee" + (marqueePaused ? " is-paused" : "")}
          >
            <div className="client-marquee-track" aria-hidden="true">
              <img src="/images/promind-client-logos.png" alt="" />
              <img src="/images/promind-client-logos.png" alt="" />
            </div>
          </div>

          <ul className="sr-only">
            {clients.map(([name, type]) => (
              <li key={name}>
                {name}, {type}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9. Executive Contact Callout */}
      <section className="contact section-pad">
        <div className="wrap contact-grid">
          <div className="contact-lead">
            <p className="eyebrow">
              {lang === "id"
                ? "DISKUSI & KONSULTASI"
                : "INQUIRIES & CONSULTATION"}
            </p>
            <h2>
              {lang === "id"
                ? "Mari Bahas Kebutuhan Pengelolaan Properti Anda."
                : "Let’s Discuss Your Property Management Needs."}
            </h2>
            <p>
              {lang === "id"
                ? "Sedang menyiapkan operasional gedung baru atau ingin meningkatkan kualitas pengelolaan properti yang sudah berjalan? Tim kami siap berdiskusi."
                : "Preparing a new building for operation or looking to elevate your existing property management? Our team is ready to assist."}
            </p>
            <a href="mailto:corporate@promind.id">corporate@promind.id</a>
          </div>

          <div className="bg-[#214f8e] p-8 sm:p-10 border border-[#7e9bc4]/40 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#a9c8f4] block mb-3">
                {lang === "id" ? "PENGAJUAN PROPOSAL" : "PROPOSAL REQUEST"}
              </span>
              <h3 className="text-2xl font-bold text-white font-manrope mb-4">
                {lang === "id"
                  ? "Jadwalkan Peninjauan atau Minta Proposal Pengelolaan"
                  : "Schedule a Walk-Through or Request a Management Proposal"}
              </h3>
              <p className="text-sm text-[#dbe6f7] leading-relaxed mb-8">
                {lang === "id"
                  ? "Sampaikan profil singkat properti Anda (Office Building, Apartment, Mall, atau Real Estate) beserta ruang lingkup pengelolaan yang dibutuhkan."
                  : "Share your property profile (Office Building, Apartment, Mall, or Real Estate) and the management scope you require."}
              </p>
            </div>
            <button
              onClick={() => onNavigate("contact")}
              className="button button-light cursor-pointer w-fit"
            >
              <span>
                {lang === "id" ? "Hubungi Tim PROMIND" : "Contact PROMIND Team"}
              </span>
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
