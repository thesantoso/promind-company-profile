/**
 * PROMIND Corporate Application Controller
 * Handles Multi-Language (ID/EN), Theme Switching, ROI Calculator,
 * Portfolio Filters, and Interactive RFP Modals
 */

const PROMIND_I18N = {
  id: {
    navServices: 'Layanan Kami',
    navSectors: 'Sektor Properti',
    navSpatial: 'Digital Twin 3D',
    navInsights: 'Riset & Wawasan',
    navAbout: 'Tentang Promind',
    navContact: 'Hubungi Kami',
    btnCta: 'Konsultasi Korporat',
    heroBadge: 'KONSULTAN MANAJEMEN PROPERTI & DIGITAL TWIN',
    heroTitle: 'Elevating Indonesia\'s Real Estate',
    heroSubtitle: 'PT Properti Manajemen Inovasi Indonesia (PROMIND) adalah konsultan properti dan manajemen aset terdepan berstandar global. Menggabungkan keunggulan operasional institusional dengan teknologi 3D Spatial Digital Twin untuk memaksimalkan yield investasi di seluruh Indonesia.',
    btnExploreTwin: 'Eksplorasi Twin 3D',
    btnOurServices: 'Layanan Kami',
    metric1Label: 'Luas Aset Dikelola',
    metric2Label: 'Tingkat Retensi Tenant',
    metric3Label: 'Valuasi & Penasihat Investasi',
    metric4Label: 'Rata-rata Penghematan Energi',
    twinTitle: 'Digital Twin: Mangkuluhur City Tower One',
    servicesTitle: 'Solusi Lengkap Manajemen Properti & Konsultasi Strategis',
    servicesSubtitle: 'Standar keunggulan global yang disesuaikan dengan regulasi dan dinamika pasar real estate Indonesia.',
    calcTitle: 'Kalkulator Proyeksi Nilai & Efisiensi Aset',
    calcSubtitle: 'Hitung estimasi peningkatan yield dan efisiensi operasional gedung Anda bersama manajemen PROMIND.',
    calcAreaLabel: 'Luas Bangunan (SGA m²)',
    calcTariffLabel: 'Biaya Sewa Rata-rata (Rp / m² / bulan)',
    calcResultYield: 'Estimasi Kenaikan NOI Tahunan',
    calcResultEnergy: 'Penghematan Energi Pertahun',
    calcResultValuation: 'Potensi Kenaikan Nilai Kapitalisasi Aset'
  },
  en: {
    navServices: 'Our Services',
    navSectors: 'Sectors',
    navSpatial: '3D Digital Twin',
    navInsights: 'Research & Insights',
    navAbout: 'About Us',
    navContact: 'Contact',
    btnCta: 'Corporate Advisory',
    heroBadge: 'PROPERTY CONSULTING & SPATIAL DIGITAL TWIN',
    heroTitle: 'Elevating Indonesia\'s Real Estate',
    heroSubtitle: 'PT Properti Manajemen Inovasi Indonesia (PROMIND) is the next-generation global-standard property consultancy and asset management firm. Bridging institutional operational excellence with 3D Spatial Digital Twins to maximize investment yields across the archipelago.',
    btnExploreTwin: 'Explore 3D Twin',
    btnOurServices: 'Our Practice Areas',
    metric1Label: 'Managed Assets (SQM)',
    metric2Label: 'Tenant Retention Rate',
    metric3Label: 'Valuation & Advisory',
    metric4Label: 'Avg Energy Efficiency Gain',
    twinTitle: 'Spatial Twin: Mangkuluhur City Tower One',
    servicesTitle: 'Comprehensive Property Management & Strategic Advisory',
    servicesSubtitle: 'Global standards engineered for Indonesia\'s institutional real estate market dynamics.',
    calcTitle: 'Asset Yield & Operational Upside Calculator',
    calcSubtitle: 'Simulate the net operating income expansion and carbon reduction under PROMIND management.',
    calcAreaLabel: 'Floor Area (SGA SQM)',
    calcTariffLabel: 'Average Rental Rate (IDR / SQM / Month)',
    calcResultYield: 'Est. Annual NOI Expansion',
    calcResultEnergy: 'Annual Energy Cost Savings',
    calcResultValuation: 'Potential Asset Capitalization Gain'
  }
};

let currentLang = 'id';

function initTheme() {
  const savedTheme = localStorage.getItem('promind-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('promind-theme', next);
      updateThemeIcon(next);
      if (window.promindTwin) {
        window.promindTwin.setTimeOfDay(next === 'light' ? 'day' : 'night');
      }
    });
  }
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = theme === 'dark' 
    ? `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`
    : `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
}

function initLanguage() {
  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      currentLang = currentLang === 'id' ? 'en' : 'id';
      langBtn.textContent = currentLang.toUpperCase();
      applyLanguage(currentLang);
    });
  }
}

function applyLanguage(lang) {
  const dict = PROMIND_I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
}

function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const assetCards = document.querySelectorAll('.asset-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      assetCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function initCalculator() {
  const areaSlider = document.getElementById('calcArea');
  const rateSlider = document.getElementById('calcRate');
  const areaVal = document.getElementById('calcAreaVal');
  const rateVal = document.getElementById('calcRateVal');

  const resYield = document.getElementById('resYield');
  const resEnergy = document.getElementById('resEnergy');
  const resValuation = document.getElementById('resValuation');

  function calculate() {
    if (!areaSlider || !rateSlider) return;
    const area = parseFloat(areaSlider.value);
    const rate = parseFloat(rateSlider.value);

    areaVal.textContent = area.toLocaleString('id-ID') + ' m²';
    rateVal.textContent = 'Rp ' + rate.toLocaleString('id-ID');

    // Formula based on Cushman/RICS standard commercial models
    // Gross Annual Rental: area * rate * 12
    const annualGrossRent = area * rate * 12;
    // PROMIND Optimization: 8.5% efficiency uplift + vacancy reduction
    const noiExpansion = annualGrossRent * 0.085;
    // Energy savings: ~Rp 35.000 / m² / month saved via BMS digital twin
    const energySavings = area * 35000 * 12;
    // Capitalization uplift at 7.5% cap rate
    const valuationGain = noiExpansion / 0.075;

    if (resYield) resYield.textContent = '+ Rp ' + (noiExpansion / 1000000000).toFixed(2) + ' Miliar / thn';
    if (resEnergy) resEnergy.textContent = 'Rp ' + (energySavings / 1000000000).toFixed(2) + ' Miliar / thn';
    if (resValuation) resValuation.textContent = '+ Rp ' + (valuationGain / 1000000000).toFixed(2) + ' Miliar';
  }

  if (areaSlider && rateSlider) {
    areaSlider.addEventListener('input', calculate);
    rateSlider.addEventListener('input', calculate);
    calculate();
  }
}

function initContactForm() {
  const form = document.getElementById('consultationForm');
  const statusMsg = document.getElementById('formStatusMsg');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses Pengajuan...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Pengajuan RFP';
        form.reset();
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.innerHTML = `
            <div style="background: rgba(6, 214, 160, 0.15); border: 1px solid #06D6A0; color: #06D6A0; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.88rem;">
              <strong>Terima kasih atas kepercayaan Anda.</strong><br>
              Tim Advisory & Asset Management PROMIND akan segera menghubungi Anda melalui email korporat dalam kurun waktu 1x24 jam kerja.
            </div>
          `;
          setTimeout(() => {
            statusMsg.style.display = 'none';
          }, 8000);
        }
      }, 1000);
    });
  }
}

function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '80px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.background = 'var(--bg-secondary)';
      navLinks.style.padding = '2rem';
      navLinks.style.borderBottom = '1px solid var(--border-subtle)';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initPortfolioFilter();
  initCalculator();
  initContactForm();
  initMobileMenu();
});

