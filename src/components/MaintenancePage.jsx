import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function MaintenancePage({ title, customMessage, estimate, contactEmail, contactPhone, emergencyContact }) {
  const displayTitle = title?.trim() || 'Situs PROMIND sedang diperbaiki.';
  const message = customMessage?.trim() || 'Kami sedang melakukan pemeliharaan sistem berkala untuk menjaga stabilitas dan performa layanan. Layanan publik akan segera kembali normal.';
  const repairEstimate = estimate?.trim();
  const email = contactEmail?.trim() || (emergencyContact?.includes('@') ? emergencyContact.split('|')[0].trim() : 'corporate@promind.id');
  const phone = contactPhone?.trim() || (emergencyContact?.includes('+') ? emergencyContact.split('|').find(s => s.includes('+'))?.trim() : '');
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';

  return (
    <div className="maintenance-page">
      <header className="maintenance-header">
        <div className="wrap maintenance-header-inner">
          <div className="maintenance-brand">
            <img src="/images/promind-header-brand.png" alt="PROMIND" />
          </div>
          <span className="maintenance-header-note">PT Properti Manajemen Inovasi Indonesia</span>
        </div>
      </header>

      <main className="maintenance-main">
        <div className="wrap maintenance-layout">
          <div className="maintenance-primary">
            <p className="maintenance-eyebrow">Pembaruan situs</p>
            <h1>{displayTitle}</h1>
            <p className="maintenance-message">{message}</p>
          </div>

          <aside className="maintenance-details" aria-label="Informasi pemeliharaan">
            <div className="maintenance-detail-block">
              <p className="maintenance-detail-label">Perkiraan kembali online</p>
              <p className="maintenance-estimate">{repairEstimate || 'Belum ada estimasi'}</p>
            </div>
            <div className="maintenance-detail-block">
              <p className="maintenance-detail-label">Hubungi PROMIND</p>
              <a className="maintenance-contact" href={`mailto:${email}`}>
                <span>{email}</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              {phone && <a className="maintenance-phone" href={phoneHref}>{phone}</a>}
            </div>
          </aside>
        </div>
      </main>

      <footer className="maintenance-footer">
        <div className="wrap maintenance-footer-inner">
          <span>PROMIND</span>
          <span>© {new Date().getFullYear()} PT Properti Manajemen Inovasi Indonesia</span>
        </div>
      </footer>
    </div>
  );
}
