import React, { useState } from 'react';
import { Calculator, TrendingDown, ShieldCheck, Zap, ArrowUpRight, Wrench } from 'lucide-react';

export default function RoiCalculator({ lang, onNavigate }) {
  const [area, setArea] = useState(25000); // m² luas gedung
  const [opexPerSqm, setOpexPerSqm] = useState(65000); // Rp / m² / bulan (rata-rata service charge / biaya operasional)
  const [energySavingRate, setEnergySavingRate] = useState(18); // % efisiensi energi HVAC & lampu
  const [maintenanceEfficiency, setMaintenanceEfficiency] = useState(15); // % pengurangan kerusakan mendadak lewat PPM

  // Perhitungan realistis operasional gedung:
  // Total OPEX tahunan gedung
  const annualTotalOpex = area * opexPerSqm * 12;
  // Komponen energi (listrik/air) biasanya ~50% dari total biaya operasional gedung
  const annualEnergySpend = annualTotalOpex * 0.50;
  const estimatedEnergySavings = annualEnergySpend * (energySavingRate / 100);

  // Komponen pemeliharaan M&E & vendor biasanya ~30% dari OPEX
  const annualMaintenanceSpend = annualTotalOpex * 0.30;
  const estimatedMaintenanceSavings = annualMaintenanceSpend * (maintenanceEfficiency / 100);

  // Total efisiensi anggaran operasional tahunan
  const totalAnnualOpexSavings = estimatedEnergySavings + estimatedMaintenanceSavings;

  const formatIDR = (val) => {
    if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)} Miliar`;
    if (val >= 1e6) return `Rp ${Math.round(val / 1e6).toLocaleString('id-ID')} Juta`;
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  return (
    <div className="bg-white border border-[#cbd7e2] p-6 sm:p-10 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Sliders Input */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 mb-2">
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed m-0">
              {lang === 'id'
                ? 'Geser parameter di bawah ini sesuai profil gedung Anda untuk melihat simulasi penghematan biaya operasional tahunan melalui penyetelan M&E, perawatan preventif, dan digitalisasi kerja operasional.'
                : 'Adjust the sliders below to match your building profile and estimate annual operating cost savings through M&E tuning, preventive maintenance, and digital workflows.'}
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-bold text-[#1a334d] mb-2 font-manrope">
              <span>{lang === 'id' ? '1. Luas Bangunan Gedung (Gross / Semi-Gross)' : '1. Building Floor Area (GFA / SGA)'}</span>
              <span className="text-[#2959ab] font-extrabold bg-[#eef4fb] px-2.5 py-0.5">{area.toLocaleString('id-ID')} m²</span>
            </div>
            <input
              type="range"
              min="5000"
              max="100000"
              step="2500"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full h-2 bg-[#d7e2ed] rounded-lg appearance-none cursor-pointer accent-[#2959ab]"
            />
            <div className="flex justify-between text-[11px] text-[#6b7b8d] mt-1 font-medium">
              <span>5.000 m² (Gedung Kampus / Mid-Rise)</span>
              <span>100.000 m² (Menara Kembar / Superblok)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-bold text-[#1a334d] mb-2 font-manrope">
              <span>{lang === 'id' ? '2. Rata-Rata Biaya Operasional / Service Charge' : '2. Average Operating Cost / Service Charge'}</span>
              <span className="text-[#2959ab] font-extrabold bg-[#eef4fb] px-2.5 py-0.5">Rp {opexPerSqm.toLocaleString('id-ID')} /m²/bln</span>
            </div>
            <input
              type="range"
              min="25000"
              max="120000"
              step="5000"
              value={opexPerSqm}
              onChange={(e) => setOpexPerSqm(Number(e.target.value))}
              className="w-full h-2 bg-[#d7e2ed] rounded-lg appearance-none cursor-pointer accent-[#2959ab]"
            />
            <div className="flex justify-between text-[11px] text-[#6b7b8d] mt-1 font-medium">
              <span>Rp 25.000 /m² (Apartemen / Ruko)</span>
              <span>Rp 120.000 /m² (Perkantoran Grade-A)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex justify-between items-center text-sm font-bold text-[#1a334d] mb-2 font-manrope">
                <span>{lang === 'id' ? 'Target Hemat Listrik & HVAC' : 'HVAC & Power Saving Target'}</span>
                <span className="text-emerald-700 font-extrabold">{energySavingRate}%</span>
              </div>
              <input
                type="range"
                min="8"
                max="25"
                step="1"
                value={energySavingRate}
                onChange={(e) => setEnergySavingRate(Number(e.target.value))}
                className="w-full h-2 bg-[#d7e2ed] rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="text-[11px] text-[#6b7b8d] mt-1">
                {lang === 'id' ? 'Rata-rata lapangan: 15% – 22%' : 'Typical field benchmark: 15% – 22%'}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-sm font-bold text-[#1a334d] mb-2 font-manrope">
                <span>{lang === 'id' ? 'Efisiensi Perawatan & Vendor' : 'Maintenance & Vendor Efficiency'}</span>
                <span className="text-[#2959ab] font-extrabold">{maintenanceEfficiency}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={maintenanceEfficiency}
                onChange={(e) => setMaintenanceEfficiency(Number(e.target.value))}
                className="w-full h-2 bg-[#d7e2ed] rounded-lg appearance-none cursor-pointer accent-[#2959ab]"
              />
              <div className="text-[11px] text-[#6b7b8d] mt-1">
                {lang === 'id' ? 'Mencegah kerusakan berat mesin' : 'Preventing major equipment failure'}
              </div>
            </div>
          </div>
        </div>

        {/* Output Results Card */}
        <div className="lg:col-span-5 bg-[#172b42] text-white p-7 border border-[#2c4766] space-y-6">
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-sky-300 font-bold block">
                {lang === 'id' ? 'ESTIMASI EFISIENSI ANGGARAN GEDUNG' : 'PROJECTED BUILDING BUDGET SAVINGS'}
              </span>
              <h4 className="text-lg font-bold font-manrope text-white mt-0.5">
                {lang === 'id' ? 'Potensi Penghematan Tahunan' : 'Estimated Annual Cost Reduction'}
              </h4>
            </div>
            <Calculator className="w-6 h-6 text-sky-400 shrink-0" />
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 p-4 border-l-4 border-emerald-400">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'id' ? 'Penghematan Tagihan Listrik & Air / Tahun' : 'Annual Electricity & Utility Savings'}</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 font-manrope">
                {formatIDR(estimatedEnergySavings)}
              </div>
            </div>

            <div className="bg-white/5 p-4 border-l-4 border-sky-400">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300 mb-1">
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                <span>{lang === 'id' ? 'Efisiensi Perawatan M&E & Kontrak Vendor' : 'M&E Upkeep & Vendor Contract Savings'}</span>
              </div>
              <div className="text-2xl font-extrabold text-sky-300 font-manrope">
                {formatIDR(estimatedMaintenanceSavings)}
              </div>
            </div>

            <div className="bg-[#2959ab]/40 p-4 border border-sky-400/40">
              <div className="flex items-center space-x-1.5 text-xs text-sky-200 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-white" />
                <span>{lang === 'id' ? 'Total Potensi Efisiensi OPEX per Tahun' : 'Total Projected Annual OPEX Savings'}</span>
              </div>
              <div className="text-3xl font-extrabold text-white font-manrope">
                {formatIDR(totalAnnualOpexSavings)}
              </div>
              <span className="text-[11px] text-slate-300 block mt-1">
                {lang === 'id'
                  ? `Dari estimasi total anggaran gedung ${formatIDR(annualTotalOpex)}/tahun`
                  : `Out of ${formatIDR(annualTotalOpex)} estimated annual operating budget`}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('contact')}
            className="w-full py-3.5 px-5 bg-[#2959ab] hover:bg-[#1e468a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <span>{lang === 'id' ? 'Minta Audit Efisiensi Gedung Gratis' : 'Request a Building Efficiency Audit'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
