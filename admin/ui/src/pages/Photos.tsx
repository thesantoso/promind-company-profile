import { ImageOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api';
import { PhotoUploader } from '../components/PhotoUploader';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, ErrorText, Loading, PageHeader } from '../components/ui';
import { listImages, type ImageInfo } from '../content';
import { PhotoPreview } from '../editor/ImageField';
import { errorMessage } from '../lib/errors';

export function Photos() {
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
      <PageHeader title="Foto" lead="Foto yang bisa dipakai di konten. Foto baru berstatus unggahan baru sampai konten diterbitkan, lalu ikut tayang di situs." />
      <Card className="panel mb-8">
        <CardHeader>
          <CardTitle>Unggah foto</CardTitle>
          <CardDescription>Foto langsung tersedia di editor konten setelah terunggah.</CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoUploader onUploaded={load} />
        </CardContent>
      </Card>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Semua foto</h2>
        {images && <p className="text-sm text-muted-foreground">{images.length} foto</p>}
      </div>
      <ErrorText>{error}</ErrorText>
      {!images && !error && <Loading what="foto" rows={2} />}
      {images && images.length === 0 && (
        <EmptyState icon={<ImageOff />} title="Belum ada foto">
          Unggah foto pertama di atas.
        </EmptyState>
      )}
      {images && images.length > 0 && (
        <ul className="photo-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Daftar foto">
          {images.map((i) => (
            <li key={i.name} className="overflow-hidden rounded-lg border bg-card">
              <PhotoPreview name={i.name} draft={i.draft} />
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-t px-3 py-2">
                <code className="min-w-0 truncate text-xs text-foreground">{i.name}</code>
                {i.draft ? <Badge tone="draft">Unggahan baru</Badge> : <Badge tone="muted">Di situs</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
