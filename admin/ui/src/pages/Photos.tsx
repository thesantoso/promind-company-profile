import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import { PhotoUploader } from '../components/PhotoUploader';
import { Badge, ErrorText, Loading, PageHeader } from '../components/ui';
import { listImages, type ImageInfo } from '../content';
import { PhotoPreview } from '../editor/ImageField';
import { errorMessage } from '../lib/errors';
import { useTitle } from '../useTitle';

export function Photos() {
  useTitle('Foto');
  const [images, setImages] = useState<ImageInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    listImages()
      .then((i) => {
        setImages(i);
        setError(null);
      })
      .catch((e) => setError(errorMessage(e instanceof ApiError ? e.code : 'network')));
  }, []);
  useEffect(load, [load]);

  return (
    <>
      <PageHeader
        title="Foto"
        lead="Foto yang bisa dipakai di konten. Foto baru berstatus unggahan baru sampai konten diterbitkan, lalu ikut tayang di situs."
      />
      <section className="panel" aria-labelledby="upload-title">
        <h2 id="upload-title">Unggah foto</h2>
        <PhotoUploader onUploaded={load} />
      </section>
      <h2 className="section-title">Semua foto</h2>
      <ErrorText>{error}</ErrorText>
      {!images && !error && <Loading what="foto" />}
      {images && images.length === 0 && <p className="muted">Belum ada foto.</p>}
      {images && images.length > 0 && (
        <ul className="photo-grid" aria-label="Daftar foto">
          {images.map((i) => (
            <li key={i.name}>
              <PhotoPreview name={i.name} draft={i.draft} />
              <div className="cap">
                <code>{i.name}</code>
                {i.draft ? <Badge tone="draft">Unggahan baru</Badge> : <Badge tone="muted">Di situs</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
