import React from 'react';
import { MapPin, ShieldCheck, Mail, Phone, Globe } from 'lucide-react';

export default function TopBar({ lang, setLang, t }) {
  return (
    <div className="bg-[#11243B] text-slate-300 text-xs py-2 px-4 border-b border-white/10 hidden md:block">
      <div className="wrap flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-1.5 text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span><strong>{t.topBar.location}</strong></span>
          </span>
          <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{t.topBar.certifications}</span>
          </span>
        </div>

        <div className="flex items-center space-x-5">
          <a href={`mailto:${t.topBar.email}`} className="flex items-center space-x-1 hover:text-white transition">
            <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{t.topBar.email}</span>
          </a>
          <span className="text-white/20">|</span>
          <a href={`tel:${t.topBar.hotline.replace(/\s+/g, '')}`} className="flex items-center space-x-1 hover:text-white transition">
            <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{t.topBar.hotline}</span>
          </a>

          <div className="flex items-center pl-3 border-l border-white/15">
            <button
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border-0 cursor-pointer"
              style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none' }}
              title="Toggle Language"
            >
              <Globe className="w-3 h-3 text-sky-300" />
              <span>{lang === 'id' ? 'ID / EN' : 'EN / ID'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

