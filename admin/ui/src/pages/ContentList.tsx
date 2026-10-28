import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '../api';
import { Badge, ErrorText, Loading, PageHeader } from '../components/ui';
import { listFiles, type FileStatus } from '../content';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { Link } from '../router';
import { useUserNames } from './Overview';

export function ContentList() {
  const [files, setFiles] = useState<FileStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameOf = useUserNames();
  useEffect(() => {
    listFiles()
      .then(setFiles)
      .catch((e) => setError(errorMessage(e instanceof ApiError ? e.code : 'network')));
  }, []);
  return (
    <>
      <PageHeader title="Konten" lead="Pilih bagian situs yang ingin diubah. Setiap perubahan disimpan sebagai draf sampai diterbitkan." />
      <ErrorText>{error}</ErrorText>
      {!files && !error && <Loading what="daftar konten" rows={6} />}
      {files && (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card" aria-label="Berkas konten">
          {files.map((f) => (
            <li key={f.key} className="group relative flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-subtle sm:px-5">
              <div className="min-w-0 flex-1">
                <Link href={`/konten/${f.key}`} className="font-medium text-foreground no-underline after:absolute after:inset-0 hover:text-foreground">
                  {f.label}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <code>{f.key}.json</code>
                  {f.hasDraft && f.draftUpdatedAt && (
                    <>
                      {' '}
                      · draf {formatDateTime(f.draftUpdatedAt)} oleh {nameOf(f.draftUpdatedBy)}
                    </>
                  )}
                </p>
              </div>
              {f.hasDraft ? <Badge tone="draft">Ada draf</Badge> : <Badge tone="muted">Sama dengan situs</Badge>}
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
