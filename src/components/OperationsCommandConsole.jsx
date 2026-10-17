import React, { useState } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  ArrowUpRight, 
  Flame, 
  Zap, 
  Droplet, 
  Building2,
  FileSpreadsheet,
  BadgeCheck
} from 'lucide-react';

export default function OperationsCommandConsole({ lang, onNavigate }) {
  const [activeTab, setActiveTab] = useState('engineering');

  const content = {
    id: {
      eyebrow: "PENGENDALIAN OPERASIONAL TERPADU",
      title: "Pusat Kendali Manajemen Properti & Tata Kelola Aset",
      subtitle: "Standarisasi operasional gedung bertingkat dan kawasan industri berbasis transparansi data, kepatuhan regulasi ketat, dan perlindungan nilai investasi properti jangka panjang.",
      tabs: [
        { id: 'engineering', label: 'Rekayasa ME & Pemeliharaan', icon: Wrench },
        { id: 'finance', label: 'Billing & Tata Kelola Finansial', icon: FileSpreadsheet },
        { id: 'safety', label: 'K3, HSE & Kepatuhan Legal (SLF)', icon: ShieldCheck },
        { id: 'hospitality', label: 'Layanan Tenant & Kepuasan', icon: Users },
      ],
      details: {
        engineering: {
          badge: "ENGINEERING & PREVENTATIVE MAINTENANCE",
          heading: "Keandalan Sistem Kritis Gedung dengan Target Uptime 99.8%",
          summary: "Setiap peralatan mekanikal dan elektrikal dipelihara melalui jadwal Planned Preventative Maintenance (PPM) berkala untuk mencegah downtime yang berbiaya tinggi.",
          kpis: [
            { label: "SLA Uptime Chiller & Genset", val: "99.85%", sub: "Target zero-downtime bisnis" },
            { label: "Rata-rata Respon Darurat ME", val: "12 Menit", sub: "Tim teknisi siaga di lokasi 24/7" },
            { label: "Kepatuhan Jadwal PPM", val: "98.4%", sub: "Terdokumentasi via ProApps" },
            { label: "Penurunan Gangguan Listrik", val: "-34%", sub: "Inspeksi termografi rutin" },
          ],
          checklist: [
            "Inspeksi termografi panel distribusi listrik tegangan menengah & rendah (TM/TR)",
            "Pengujian beban berkala Genset darurat dan ketersediaan solar cadangan",
            "Pemantauan efisiensi chiller HVAC & water-treatment cooling tower",
            "Pemeriksaan berkala lift penumpang, lift service, dan eskalator berizin Kemenaker"
          ],
          liveFeed: {
            title: "Log Pemeliharaan Aktif Hari Ini",
            asset: "Mangkuluhur City Office Tower One",
            items: [
              { time: "09:30 WIB", desc: "Uji fungsi sensor deteksi asap & flow switch sprinkler Zona B", status: "Selesai | Normal" },
              { time: "11:15 WIB", desc: "Inspeksi vibrasi bearing motor Chiller #2", status: "Optimal | 0.8 mm/s" },
              { time: "13:00 WIB", desc: "Pembersihan filter AHU Lantai 18-24", status: "Tuntas Sesuai SLA" }
            ]
          }
        },
        finance: {
          badge: "FINANCIAL GOVERNANCE & SINKING FUND",
          heading: "Transparansi Anggaran Layanan & Kolektibilitas Tagihan Maksimal",
          summary: "Pengelolaan keuangan properti yang akuntabel, mulai dari audit service charge, efisiensi konsumsi utilitas penyewa, hingga pencadangan dana cadangan (sinking fund).",
          kpis: [
            { label: "Tingkat Kolektibilitas Tagihan", val: "98.7%", sub: "Service charge & sinking fund" },
            { label: "Akurasi Rekonsiliasi OPEX", val: "100%", sub: "Audit terbuka bagi pemilik properti" },
            { label: "Efisiensi Biaya Kontraktor", val: "14.2%", sub: "Benchmarking vendor transparan" },
            { label: "Pelaporan Keuangan", val: "Tepat Waktu", sub: "Buku tutup tanggal 5 tiap bulan" },
          ],
          checklist: [
            "Penagihan otomatis Service Charge & Sinking Fund berbasis sistem ProApps",
            "Rekonsiliasi pencatatan sub-metering KWh listrik dan meteran air per unit penyewa",
            "Penyusunan Rencana Anggaran Biaya Tahunan (RAB) dan audit per kuartal",
            "Kepatuhan pelaporan pajak PPh Final sewa, PPN, dan standar audit IFRS/PSAK"
          ],
          liveFeed: {
            title: "Status Rekonsiliasi Finansial Terkini",
            asset: "Portfolio Komersial & Mixed-Use",
            items: [
              { time: "Bulan Berjalan", desc: "Distribusi faktur utilitas & service charge 100% terkirim", status: "Terkirim ke 142 Tenant" },
              { time: "Status Pembayaran", desc: "Realisasi pembayaran sebelum jatuh tempo", status: "96.4% Terbayar" },
              { time: "Audit Sinking Fund", desc: "Verifikasi alokasi peremajaan lift penumpang Tower A", status: "Sesuai Anggaran" }
            ]
          }
        },
        safety: {
          badge: "STATUTORY COMPLIANCE & LIFE SAFETY",
          heading: "Kepatuhan Regulasi Gedung, K3 & Proteksi Kebakaran",
          summary: "Memastikan seluruh sertifikasi wajib gedung (SLF, Damkar, Kemenaker) selalu aktif dan memenuhi regulasi pemerintah daerah maupun standar keselamatan internasional.",
          kpis: [
            { label: "Rekor Jam Kerja Aman", val: "1,450+ Hari", sub: "Zero lost-time injury (LTI)" },
            { label: "Kepatuhan Regulasi SLF", val: "100%", sub: "Sertifikat Laik Fungsi aktif" },
            { label: "Simulasi Evakuasi Kebakaran", val: "2x / Tahun", sub: "Melibatkan seluruh tenant" },
            { label: "Audit K3 & Lingkungan", val: "ISO 41001", sub: "Terakreditasi institusional" },
          ],
          checklist: [
            "Pemeriksaan berkala instalasi proteksi kebakaran (Hydrant, Sprinkler, FM-200)",
            "Penyusunan dokumen berkala untuk perpanjangan Sertifikat Laik Fungsi (SLF)",
            "Riksa uji tahunan bejana tekan, pesawat uap, dan genset bersama Disnaker",
            "Pemberdayaan tim tanggap darurat (ERT) terlatih bersertifikasi Damkar"
          ],
          liveFeed: {
            title: "Pemeriksaan Kepatuhan Legal & K3",
            asset: "Kawasan Industri & Gedung Komersial",
            items: [
              { time: "Bulan Lalu", desc: "Riksa uji instalasi penyalur petir & grounding system", status: "Lulus Uji Disnaker" },
              { time: "Kuartal Ini", desc: "Hydrotest tabung APAR dan pengetesan pompa diesel fire pump", status: "Sertifikasi Diperbarui" },
              { time: "Terjadwal", desc: "Pelatihan evakuasi gempa bumi bersama instruktur Damkar", status: "Teragenda Minggu Depan" }
            ]
          }
        },
        hospitality: {
          badge: "TENANT RETENTION & COMMUNITY PLACEMAKING",
          heading: "Pengalaman Hunian Unggul untuk Memaksimalkan Nilai Retensi",
          summary: "Gedung dengan manajemen hospitality yang ramah dan sigap mempertahankan okupansi tinggi serta memperkuat kepuasan penyewa korporat dan multinasional.",
          kpis: [
            { label: "Skor Kepuasan Penyewa (CSAT)", val: "94.6%", sub: "Berdasarkan survey independen" },
            { label: "Penyelesaian Keluhan <2 Jam", val: "96.2%", sub: "Target SLA tertangani tuntas" },
            { label: "Tingkat Retensi Kontrak Sewa", val: "89.0%", sub: "WALT portofolio 4.8 tahun" },
            { label: "Standar Grooming & Etika", val: "Bintang 5", sub: "Pelatihan berkala staf frontliner" },
          ],
          checklist: [
            "Layanan Helpdesk & Pengaduan terintegrasi via aplikasi ProApps",
            "Manajemen perizinan renovasi dan peraturan tata tertib gedung (fit-out guidelines)",
            "Standar pengamanan akses pengunjung dengan sistem identifikasi digital",
            "Program komunikasi dan temu rutin manajemen dengan tenant korporasi"
          ],
          liveFeed: {
            title: "Indeks Layanan Helpdesk & Tenant Relations",
            asset: "Penyewa Perkantoran & Ritel",
            items: [
              { time: "10:10 WIB", desc: "Permintaan izin lembur kerja & pendingin udara Lantai 22", status: "Disetujui Otomatis" },
              { time: "11:45 WIB", desc: "Laporan penyesuaian temperatur AC meeting room", status: "Ditangani dalam 14 Menit" },
              { time: "14:20 WIB", desc: "Koordinasi bongkar muat material fit-out tenant baru", status: "Izin Loading Dock Diterbitkan" }
            ]
          }
        }
      }
    },
    en: {
      eyebrow: "INTEGRATED OPERATIONS GOVERNANCE",
      title: "Property Operations Control & Asset Management Console",
      subtitle: "Standardizing multi-storey commercial and industrial asset management through data transparency, rigorous compliance, and long-term capital preservation.",
      tabs: [
        { id: 'engineering', label: 'ME Engineering & Maintenance', icon: Wrench },
        { id: 'finance', label: 'Billing & Financial Controls', icon: FileSpreadsheet },
        { id: 'safety', label: 'HSE & Statutory Compliance (SLF)', icon: ShieldCheck },
        { id: 'hospitality', label: 'Tenant Relations & Retention', icon: Users },
      ],
      details: {
        engineering: {
          badge: "ENGINEERING & PREVENTATIVE MAINTENANCE",
          heading: "Critical Building Reliability with 99.8% Targeted Uptime",
          summary: "All mechanical and electrical systems are governed under Planned Preventative Maintenance (PPM) cycles to protect assets against catastrophic downtime.",
          kpis: [
            { label: "Chiller & Genset Uptime SLA", val: "99.85%", sub: "Targeting zero operational downtime" },
            { label: "Emergency Response Time", val: "12 Min", sub: "On-site 24/7 technical presence" },
            { label: "PPM Schedule Compliance", val: "98.4%", sub: "Logged via ProApps system" },
            { label: "Power Disruption Rate", val: "-34%", sub: "Routine thermographic audits" },
          ],
          checklist: [
            "Thermographic electrical panel scanning for medium & low voltage distribution",
            "Periodic full-load test runs of emergency generators & diesel fuel reserves",
            "HVAC chiller efficiency optimization & cooling tower water treatment",
            "Certified periodic passenger and service elevator safety inspections"
          ],
          liveFeed: {
            title: "Active Maintenance Log Today",
            asset: "Mangkuluhur City Office Tower One",
            items: [
              { time: "09:30 AM", desc: "Smoke sensor & sprinkler flow switch testing Zone B", status: "Completed | Normal" },
              { time: "11:15 AM", desc: "Vibration inspection on Chiller #2 motor bearings", status: "Optimal | 0.8 mm/s" },
              { time: "01:00 PM", desc: "AHU air filter cleaning & sanitization Floors 18-24", status: "SLA Compliant" }
            ]
          }
        },
        finance: {
          badge: "FINANCIAL GOVERNANCE & SINKING FUND",
          heading: "Transparent Operating Accounts & Maximum Service Charge Collection",
          summary: "Accountable property financial governance, spanning service charge reconciliation, tenant utility recovery, and long-term capital replacement sinking fund reserves.",
          kpis: [
            { label: "Collection Efficiency Rate", val: "98.7%", sub: "Service charges & sinking funds" },
            { label: "OPEX Reconciliation Accuracy", val: "100%", sub: "Open-book auditing for owners" },
            { label: "Procurement Cost Savings", val: "14.2%", sub: "Competitive vendor benchmarking" },
            { label: "Financial Reporting", val: "On-Time", sub: "Monthly books closed by the 5th" },
          ],
          checklist: [
            "Automated invoicing for Service Charge & Sinking Fund via ProApps",
            "Sub-metering reconciliation for individual tenant electricity and water consumption",
            "Annual operating budget formulation (OPEX/CAPEX) with quarterly variance audits",
            "Strict compliance with tax withholding, VAT, and IFRS/PSAK property accounting"
          ],
          liveFeed: {
            title: "Financial Reconciliation Status",
            asset: "Commercial & Mixed-Use Portfolio",
            items: [
              { time: "Current Month", desc: "100% of tenant billing notices delivered digitally", status: "Sent to 142 Tenants" },
              { time: "Collection Realization", desc: "Payments received prior to due date", status: "96.4% Settled" },
              { time: "Sinking Fund Review", desc: "Modernization reserve for Tower A passenger lifts verified", status: "On Budget" }
            ]
          }
        },
        safety: {
          badge: "STATUTORY COMPLIANCE & LIFE SAFETY",
          heading: "Statutory Building Compliance, Workplace Safety & Fire Protection",
          summary: "Maintaining active building certifications (SLF, Fire Department, Labor Ministry) to comply with municipal guidelines and international life safety standards.",
          kpis: [
            { label: "Safe Work Hours Recorded", val: "1,450+ Days", sub: "Zero lost-time injuries (LTI)" },
            { label: "SLF Certification Compliance", val: "100%", sub: "Active Certificate of Fitness" },
            { label: "Fire Evacuation Drills", val: "2x / Year", sub: "Engaging all corporate tenants" },
            { label: "Safety & Quality Audits", val: "ISO 41001", sub: "Institutionally certified" },
          ],
          checklist: [
            "Periodic testing of active fire suppression (Hydrant, Sprinklers, FM-200 gases)",
            "Structural and MEP technical documentation for SLF renewal filings",
            "Annual pressure vessel, boiler, and generator inspections with Ministry of Labor",
            "Dedicated on-site Emergency Response Team (ERT) trained by Fire Department"
          ],
          liveFeed: {
            title: "Statutory Compliance & HSE Log",
            asset: "Industrial Parks & Commercial Towers",
            items: [
              { time: "Last Month", desc: "Lightning protection & earthing system impedance verification", status: "Passed Labor Audit" },
              { time: "This Quarter", desc: "Fire extinguisher hydrotests & diesel fire pump run test", status: "Certificates Renewed" },
              { time: "Scheduled", desc: "Building earthquake evacuation simulation with Fire Authority", status: "Slated Next Week" }
            ]
          }
        },
        hospitality: {
          badge: "TENANT RETENTION & COMMUNITY PLACEMAKING",
          heading: "High-Touch Hospitality Standards to Maximize Occupier Retention",
          summary: "Properties managed with courteous, responsive hospitality maintain higher occupancy levels and cultivate strong loyalty with corporate and multinational occupiers.",
          kpis: [
            { label: "Tenant Satisfaction (CSAT)", val: "94.6%", sub: "Measured by independent survey" },
            { label: "Issue Resolution <2 Hours", val: "96.2%", sub: "Strict SLA fulfillment" },
            { label: "Lease Renewal Retention Rate", val: "89.0%", sub: "Portfolio WALT of 4.8 years" },
            { label: "Staff Grooming & Etiquette", val: "5-Star", sub: "Routine front-line hospitality training" },
          ],
          checklist: [
            "Integrated tenant service desk & complaint tracking via ProApps portal",
            "Fit-out guidelines, architectural approvals, and contractor supervision",
            "Visitor access management with digital identification and speed gates",
            "Periodic executive tenant coordination meetings and community building"
          ],
          liveFeed: {
            title: "Helpdesk & Tenant Relations Index",
            asset: "Office & Retail Occupiers",
            items: [
              { time: "10:10 AM", desc: "Overtime HVAC and lighting permit for 22nd Floor", status: "Auto-Approved" },
              { time: "11:45 AM", desc: "Conference room temperature calibration ticket", status: "Resolved in 14 Min" },
              { time: "02:20 PM", desc: "Fit-out loading dock coordination for new tenant move-in", status: "Dock Pass Issued" }
            ]
          }
        }
      }
    }
  };

  const tData = content[lang] || content.id;
  const currentDetail = tData.details[activeTab];

  return (
    <div className="bg-white border border-[#cbd5e1] shadow-sm overflow-hidden">
      {/* 1. Header of the Console */}
      <div className="bg-[#172b42] text-white p-6 sm:p-8 border-b border-[#2d4663]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-[#2b5caf] text-white text-[11px] font-extrabold uppercase tracking-wider mb-3">
              <BadgeCheck className="w-3.5 h-3.5 text-sky-300" />
              <span>{tData.eyebrow}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-manrope text-white mb-2">
              {tData.title}
            </h3>
            <p className="text-sm sm:text-base text-[#c8d6e5] max-w-3xl leading-relaxed">
              {tData.subtitle}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center space-x-2 px-5 py-3 bg-[#2959ab] hover:bg-[#1f478a] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer border-0"
            >
              <span>{lang === 'id' ? 'Ajukan Audit Gedung' : 'Request Asset Audit'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Interactive Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-8 pt-4 border-t border-white/10">
          {tData.tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2.5 p-3 text-left transition cursor-pointer border-0 rounded-none ${
                  isActive
                    ? 'bg-[#2959ab] text-white font-bold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                <span className="text-xs sm:text-sm tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Operational View */}
      <div className="p-6 sm:p-8 bg-[#fafbfc]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#e2e8f0]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2959ab] bg-[#e8eef6] px-2.5 py-1 inline-block mb-2">
              {currentDetail.badge}
            </span>
            <h4 className="text-xl sm:text-2xl font-bold text-[#172b42] font-manrope">
              {currentDetail.heading}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-[#526374] max-w-md leading-relaxed">
            {currentDetail.summary}
          </p>
        </div>

        {/* 4 KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {currentDetail.kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white border border-[#cbd5e1] p-4 shadow-xs">
              <div className="text-xs text-[#526374] font-medium mb-1">{kpi.label}</div>
              <div className="text-2xl font-extrabold text-[#2959ab] font-manrope mb-0.5">{kpi.val}</div>
              <div className="text-[11px] text-[#718096]">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* 2-Column: SOP Checklist & Live Feed Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SOP Checklist */}
          <div className="lg:col-span-7 bg-white border border-[#cbd5e1] p-6 shadow-xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#172b42] mb-4 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#2959ab]" />
              <span>{lang === 'id' ? 'Prosedur Operasi Baku (SOP Terverifikasi)' : 'Standard Operating Procedures (Verified SOP)'}</span>
            </h5>
            <ul className="space-y-3">
              {currentDetail.checklist.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-[#2c4157] pb-3 border-b border-[#f1f5f9] last:border-b-0 last:pb-0">
                  <span className="w-5 h-5 rounded-full bg-[#e8eef6] text-[#2959ab] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Live Feed Terminal */}
          <div className="lg:col-span-5 bg-[#11243B] text-slate-200 border border-[#2d4663] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase text-white tracking-wide">
                  {currentDetail.liveFeed.title}
                </span>
              </div>
              <span className="text-[10px] text-sky-300 font-mono">
                LIVE
              </span>
            </div>

            <div className="text-[11px] text-slate-400 mb-3">
              Objek Aset: <strong className="text-white">{currentDetail.liveFeed.asset}</strong>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              {currentDetail.liveFeed.items.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-2.5 border-l-2 border-[#2b5caf]">
                  <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                    <span>{item.time}</span>
                    <span className="text-emerald-400 font-sans font-bold">{item.status}</span>
                  </div>
                  <div className="text-slate-200 font-sans text-xs">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>Sistem Pencatatan: ProApps Enterprise</span>
              <span className="text-sky-400 font-bold">Terverifikasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

