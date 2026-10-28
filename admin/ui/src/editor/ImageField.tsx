import { createContext, useContext, type ReactNode } from 'react';
import { PhotoUploader } from '../components/PhotoUploader';
import { imageUrl, type ImageInfo } from '../content';
import { fieldId, joinPath } from '../lib/paths';
import { FieldIssues, join, useInvalid } from './ctx';
import type { Json } from '../lib/shape';

export const ImagesContext = createContext<{ images: ImageInfo[] | null; refresh: () => void }>({ images: null, refresh: () => undefined });

type Img = { src: string; alt: { id: string; en: string } };

/** Pratinjau: foto draf dari API, foto yang sudah ada di repo sebagai ubin bernama (servernya tidak menyajikan byte-nya). */
export function PhotoPreview({ name, draft }: { name: string; draft: boolean }) {
  if (draft) return <img className="thumb" src={imageUrl(name)} alt="" />;
  return (
    <div className="thumb thumb-placeholder">
      <span>{name ? 'Foto di situs' : 'Belum ada foto'}</span>
      {name && <strong>{name}</strong>}
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
    <fieldset className="group" id={fieldId(path)} tabIndex={-1}>
      <legend className="group-title">Foto</legend>
      <div className="image-field">
        <PhotoPreview name={value.src} draft={current?.draft ?? false} />
        <div>
          <div className="field">
            <label htmlFor={id}>Pilih foto</label>
            <select
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
            </select>
            <span className="hint" id={`${id}-hint`}>
              Atau unggah foto baru; foto itu langsung dipilih untuk butir ini.
            </span>
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
      <p className="hint">Teks alternatif wajib di kedua bahasa: jelaskan isi foto untuk pembaca yang tidak bisa melihatnya.</p>
    </fieldset>
  );
}
