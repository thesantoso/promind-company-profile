import { createContext, useContext, type ReactNode } from 'react';
import { PhotoUploader } from '../components/PhotoUploader';
import { imageUrl, type ImageInfo } from '../content';
import { fieldId, joinPath } from '../lib/paths';
import { FieldHint, Label, NativeSelect } from '../components/ui';
import { FieldIssues, join, useInvalid } from './ctx';
import type { Json } from '../lib/shape';

export const ImagesContext = createContext<{ images: ImageInfo[] | null; refresh: () => void }>({ images: null, refresh: () => undefined });

type Img = { src: string; alt: { id: string; en: string } };

/** Pratinjau: foto draf dari API, foto yang sudah ada di repo sebagai ubin bernama (servernya tidak menyajikan byte-nya). */
export function PhotoPreview({ name, draft }: { name: string; draft: boolean }) {
  if (draft) return <img className="thumb aspect-[4/3] w-full bg-muted object-cover" src={imageUrl(name)} alt="" />;
  return (
    <div className="thumb thumb-placeholder grid aspect-[4/3] w-full place-content-center gap-1 bg-muted p-3 text-center text-xs text-muted-foreground">
      <span>{name ? 'Foto di situs' : 'Belum ada foto'}</span>
      {name && <strong className="break-all font-medium text-foreground">{name}</strong>}
    </div>
  );
}

export function ImageField({
  path,
  value,
  onChange,
  renderAlt,
}: {
  path: string;
  value: Img;
  onChange: (v: Json) => void;
  renderAlt: (path: string, v: { id: string; en: string }, set: (v: Json | undefined) => void) => ReactNode;
}) {
  const { images, refresh } = useContext(ImagesContext);
  const srcPath = joinPath(path, 'src');
  const id = fieldId(srcPath);
  const { invalid, describedBy } = useInvalid(srcPath);
  const known = images ?? [];
  const current = known.find((i) => i.name === value.src);
  const options = current || !value.src ? known : [{ name: value.src, draft: false }, ...known];
  return (
    <fieldset className="group min-w-0 space-y-4 rounded-lg border bg-subtle p-4 md:p-5" id={fieldId(path)} tabIndex={-1}>
      <legend className="-ml-1 px-1 text-sm font-semibold">Foto</legend>
      <div className="image-field grid gap-4 md:grid-cols-[14rem_1fr]">
        <div className="overflow-hidden rounded-lg border">
          <PhotoPreview name={value.src} draft={current?.draft ?? false} />
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor={id}>Pilih foto</Label>
            <NativeSelect
              id={id}
              value={value.src}
              onChange={(e) => onChange({ ...value, src: e.target.value })}
              aria-invalid={invalid || undefined}
              aria-describedby={join(describedBy, `${id}-hint`)}
            >
              {!value.src && <option value="">(belum dipilih)</option>}
              {options.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.name}
                  {i.draft ? ' (unggahan baru)' : ''}
                  {!current && i.name === value.src && images ? ' (tidak ditemukan)' : ''}
                </option>
              ))}
            </NativeSelect>
            <FieldHint id={`${id}-hint`}>Atau unggah foto baru; foto itu langsung dipilih untuk butir ini.</FieldHint>
            <FieldIssues path={srcPath} />
          </div>
          <PhotoUploader
            label="Unggah foto baru"
            onUploaded={(u) => {
              refresh();
              onChange({ ...value, src: u.name });
            }}
          />
        </div>
      </div>
      {renderAlt(joinPath(path, 'alt'), value.alt, (alt) => onChange({ ...value, alt: alt as Img['alt'] }))}
      <p className="text-xs text-muted-foreground">Teks alternatif wajib di kedua bahasa: jelaskan isi foto untuk pembaca yang tidak bisa melihatnya.</p>
    </fieldset>
  );
}
