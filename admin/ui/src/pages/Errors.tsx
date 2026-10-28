import { ArrowLeft, Compass, ShieldAlert } from 'lucide-react';
import { Button, EmptyState, PageHeader } from '../components/ui';
import { Link } from '../router';

export function Forbidden() {
  return (
    <>
      <PageHeader title="Khusus administrator" />
      <EmptyState icon={<ShieldAlert />} title="Anda tidak punya akses ke halaman ini">
        <p>
          Halaman ini hanya bisa dibuka oleh administrator. Bila Anda perlu menambah pengguna atau melihat log audit, hubungi administrator
          portal.
        </p>
        <p className="mt-1 text-xs">Kode: 403 (tidak diizinkan)</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Kembali ke Ringkasan
          </Link>
        </Button>
      </EmptyState>
    </>
  );
}

export function NotFound() {
  return (
    <>
      <PageHeader title="Halaman tidak ditemukan" />
      <EmptyState icon={<Compass />} title="Alamat ini tidak ada di portal">
        <p>Mungkin tautannya salah ketik atau halamannya sudah dipindah.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Kembali ke Ringkasan
          </Link>
        </Button>
      </EmptyState>
    </>
  );
}
