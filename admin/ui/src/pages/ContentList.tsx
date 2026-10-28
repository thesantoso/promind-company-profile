import { useEffect, useState } from 'react';
import { ApiError } from '../api';
import { Badge, ErrorText, Loading, PageHeader } from '../components/ui';
import { listFiles, type FileStatus } from '../content';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { Link } from '../router';
import { useTitle } from '../useTitle';
import { useUserNames } from './Overview';

export function ContentList() {
  useTitle('Konten');
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
      {!files && !error && <Loading what="daftar konten" />}
      {files && (
        <div className="panel panel-tight">
          <ul className="list-plain list-rows" aria-label="Berkas konten">
            {files.map((f) => (
              <li key={f.key}>
                <span>
                  <Link href={`/konten/${f.key}`} className="title">
                    {f.label}
                  </Link>
                  <span className="meta">
                    {' '}
                    · <code>{f.key}</code>
                    {f.hasDraft && f.draftUpdatedAt && <> · draf {formatDateTime(f.draftUpdatedAt)} oleh {nameOf(f.draftUpdatedBy)}</>}
                  </span>
                </span>
                {f.hasDraft ? <Badge tone="draft">Ada draf</Badge> : <Badge tone="muted">Sama dengan situs</Badge>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
