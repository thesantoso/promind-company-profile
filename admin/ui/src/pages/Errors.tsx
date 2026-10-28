import { PageHeader } from '../components/ui';
import { Link } from '../router';
import { useTitle } from '../useTitle';

export function Forbidden() {
  useTitle('Khusus administrator');
  return (
    <>
      <PageHeader title="Khusus administrator" />
      <div className="panel">
        <p>
          Halaman ini hanya bisa dibuka oleh administrator. Bila Anda perlu menambah pengguna atau melihat log audit,
          hubungi administrator portal.
        </p>
        <p className="small muted">Kode: 403 (tidak diizinkan)</p>
        <Link href="/" className="btn btn-secondary">
          Kembali ke Ringkasan
        </Link>
      </div>
    </>
  );
}

export function NotFound() {
  useTitle('Halaman tidak ditemukan');
  return (
    <>
      <PageHeader title="Halaman tidak ditemukan" />
      <div className="panel">
        <p>Alamat ini tidak ada di portal. Mungkin tautannya salah ketik atau sudah dipindah.</p>
        <Link href="/" className="btn btn-secondary">
          Kembali ke Ringkasan
        </Link>
      </div>
    </>
  );
}
