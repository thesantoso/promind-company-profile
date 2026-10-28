import { useRef, useState, type ReactNode } from 'react';
import { FieldIssues, join, useForm, useInvalid } from './ctx';
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import {
  Badge, Button, Checkbox, ConfirmDialog, FieldHint, Input, Label, NativeSelect, Textarea, Tooltip, announce,
} from '../components/ui';
import { cn } from '../lib/cn';
import { humanizeKey, itemSummary, nounFor, ROUTE_OPTIONS } from '../lib/labels';
import { fieldId, joinPath } from '../lib/paths';
import { todayIso } from '../lib/format';
import {
  isLongText, isPlainObject, keysFor, moveItem, newItemFor, removeAt, shapeOf, type Json, type JsonObject,
} from '../lib/shape';
import { ImageField } from './ImageField';

const READONLY: Record<string, string> = { brand: 'Nama merek selalu PROMIND dan tidak bisa diubah di sini.' };

const SLUG_HINT = 'Huruf kecil, angka, dan tanda hubung saja, mis. building-manager. Slug dipakai di alamat halaman; mengubahnya mengubah tautan.';

/* ---------- kontrol dasar ---------- */

function TextControl({
  path,
  label,
  srPrefix,
  value,
  onChange,
  long,
  type = 'text',
  hint,
  readOnly,
  chip,
}: {
  path: string;
  label: string;
  chip?: 'ID' | 'EN';
  srPrefix?: string;
  value: string;
  onChange: (v: string) => void;
  long: boolean;
  type?: 'text' | 'email';
  hint?: string;
  readOnly?: boolean;
}) {
  const id = fieldId(path);
  const { invalid, describedBy } = useInvalid(path);
  // Jenis kontrol diputuskan sekali agar fokus tidak hilang saat teks melewati 80 karakter.
  const [multiline] = useState(long);
  const hintId = hint ? `${id}-hint` : undefined;
  const common = {
    id,
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    'aria-invalid': invalid || undefined,
    'aria-describedby': join(describedBy, hintId),
    readOnly,
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label htmlFor={id} className="mb-0">
          {srPrefix && <span className="sr-only">{srPrefix}, </span>}
          {label}
        </Label>
        {chip && (
          <span aria-hidden="true" className="rounded bg-muted px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none tracking-wide text-muted-foreground">
            {chip}
          </span>
        )}
      </div>
      {multiline ? <Textarea {...common} rows={value.length > 240 ? 6 : 4} /> : <Input type={type} {...common} spellCheck={type === 'text'} />}
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <FieldIssues path={path} />
    </div>
  );
}

function BilingualField({ path, k, value, onChange }: { path: string; k: string; value: { id: string; en: string }; onChange: (v: Json) => void }) {
  const label = humanizeKey(k);
  const [long] = useState(() => isLongText(k, [value.id, value.en]));
  return (
    <fieldset className="bi min-w-0" id={fieldId(path)} tabIndex={-1}>
      <legend className="mb-2 text-sm font-semibold text-foreground">{label}</legend>
      <div className="grid gap-4 md:grid-cols-2">
        <TextControl path={joinPath(path, 'id')} chip="ID" srPrefix={label} label="Indonesia" value={value.id} long={long} onChange={(id) => onChange({ ...value, id })} />
        <TextControl path={joinPath(path, 'en')} chip="EN" srPrefix={label} label="English (US)" value={value.en} long={long} onChange={(en) => onChange({ ...value, en })} />
      </div>
      <FieldIssues path={path} />
    </fieldset>
  );
}

/* ---------- daftar dua bahasa (baris id/en sejajar) ---------- */

function BilingualList({ path, k, value, onChange }: { path: string; k: string; value: { id: string[]; en: string[] }; onChange: (v: Json) => void }) {
  const label = humanizeKey(k);
  const rows = Math.max(value.id.length, value.en.length);
  const ids = Array.from({ length: rows }, (_, i) => value.id[i] ?? '');
  const ens = Array.from({ length: rows }, (_, i) => value.en[i] ?? '');
  const [long] = useState(() => [...ids, ...ens].some((t) => t.length > 60));
  const keys = useStableKeys(rows);

  const set = (nextId: string[], nextEn: string[]) => onChange({ id: nextId, en: nextEn });
  const move = (i: number, to: number) => {
    keys.move(i, to);
    set(moveItem(ids, i, to), moveItem(ens, i, to));
    announce(`Baris ${i + 1} dipindah ke posisi ${to + 1}.`);
  };
  const remove = (i: number) => {
    keys.remove(i);
    set(removeAt(ids, i), removeAt(ens, i));
    announce(`Baris ${i + 1} dihapus.`);
  };
  const add = () => {
    keys.add();
    set([...ids, ''], [...ens, '']);
    announce(`Baris ${rows + 1} ditambahkan.`);
    window.setTimeout(() => document.getElementById(fieldId(joinPath(joinPath(path, 'id'), rows)))?.focus(), 0);
  };

  return (
    <fieldset className="bi min-w-0" id={fieldId(path)} tabIndex={-1}>
      <legend className="mb-2 text-sm font-semibold text-foreground">{label}</legend>
      <div className="space-y-3">
        {ids.map((_, i) => {
          const pid = joinPath(joinPath(path, 'id'), i);
          const pen = joinPath(joinPath(path, 'en'), i);
          const rowLabel = `${label} baris ${i + 1}`;
          return (
            <div className="flex gap-3 rounded-lg border bg-subtle p-3" role="group" aria-label={rowLabel} key={keys.ids[i]}>
              <span className="w-5 shrink-0 pt-8 text-right text-sm text-muted-foreground max-md:hidden" aria-hidden="true">
                {i + 1}.
              </span>
              <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                <TextControl path={pid} chip="ID" srPrefix={rowLabel} label="Indonesia" value={ids[i]!} long={long} onChange={(v) => set(ids.map((x, j) => (j === i ? v : x)), ens)} />
                <TextControl path={pen} chip="EN" srPrefix={rowLabel} label="English (US)" value={ens[i]!} long={long} onChange={(v) => set(ids, ens.map((x, j) => (j === i ? v : x)))} />
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-start sm:pt-6">
                <IconAction label={`Naikkan ${rowLabel}`} tip="Naikkan" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowUp aria-hidden="true" />
                </IconAction>
                <IconAction label={`Turunkan ${rowLabel}`} tip="Turunkan" disabled={i === rows - 1} onClick={() => move(i, i + 1)}>
                  <ArrowDown aria-hidden="true" />
                </IconAction>
                <IconAction label={`Hapus ${rowLabel}`} tip="Hapus baris" danger disabled={rows <= 1} onClick={() => remove(i)}>
                  <Trash2 aria-hidden="true" />
                </IconAction>
              </div>
            </div>
          );
        })}
      </div>
      <FieldIssues path={path} />
      <FieldIssues path={joinPath(path, 'id')} />
      <FieldIssues path={joinPath(path, 'en')} />
      <Button variant="ghost" size="sm" className="mt-2 -ml-3" onClick={add}>
        <Plus aria-hidden="true" />
        Tambah baris {label.toLowerCase()}
      </Button>
    </fieldset>
  );
}

/** Tombol ikon dengan tooltip; nama aksesibelnya selalu dari aria-label. */
function IconAction({ label, tip, danger, disabled, onClick, children }: { label: string; tip: string; danger?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  const btn = (
    <Button variant={danger ? 'ghost-destructive' : 'ghost'} size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick} className={cn(!danger && 'text-muted-foreground hover:text-foreground')}>
      {children}
    </Button>
  );
  // Tombol nonaktif tidak memicu tooltip; cukup tampilkan tombolnya.
  return disabled ? btn : <Tooltip content={tip}>{btn}</Tooltip>;
}

/* ---------- kunci stabil untuk daftar yang bisa diurutkan ---------- */

let keySeq = 0;
function useStableKeys(length: number) {
  const ref = useRef<number[]>([]);
  if (ref.current.length !== length) ref.current = Array.from({ length }, () => ++keySeq);
  return {
    get ids() {
      return ref.current;
    },
    move: (from: number, to: number) => {
      ref.current = moveItem(ref.current, from, to);
    },
    remove: (i: number) => {
      ref.current = removeAt(ref.current, i);
    },
    add: () => {
      ref.current = [...ref.current, ++keySeq];
    },
  };
}

/* ---------- daftar objek ---------- */

function ObjectArray({ path, k, value, onChange, rootItems }: { path: string; k: string; value: Json[]; onChange: (v: Json) => void; rootItems: boolean }) {
  const { fileKey, hasIssuesUnder } = useForm();
  const noun = nounFor(k);
  const keys = useStableKeys(value.length);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  // Butir baru dibuka sekali saat muncul; selanjutnya <details> dikendalikan pengguna.
  const toOpen = useRef(new Set<number>());

  const move = (i: number, to: number) => {
    keys.move(i, to);
    onChange(moveItem(value, i, to));
    announce(`${capital(noun)} ${i + 1} dipindah ke posisi ${to + 1}.`);
  };
  const add = () => {
    const template = value[0] ?? {};
    keys.add();
    const next = [...value, newItemFor(rootItems ? fileKey : k, template, todayIso())];
    toOpen.current.add(keys.ids[keys.ids.length - 1]!);
    onChange(next);
    announce(`${capital(noun)} baru ditambahkan di posisi ${next.length}.`);
    window.setTimeout(() => {
      const body = document.getElementById(fieldId(joinPath(path, value.length)));
      body?.querySelector<HTMLElement>('input, textarea, select')?.focus();
    }, 0);
  };

  return (
    <div id={fieldId(path)} tabIndex={-1} className="array space-y-3 outline-none">
      <ol className="items space-y-3" aria-label={`Daftar ${noun}`}>
        {value.map((item, i) => {
          const itemPath = joinPath(path, i);
          const summary = itemSummary(item) ?? `${capital(noun)} baru`;
          const bad = hasIssuesUnder(itemPath);
          return (
            <li key={keys.ids[i]}>
              <details
                className={cn('item-panel overflow-hidden rounded-lg border bg-card', bad && 'border-destructive-border')}
                ref={(el) => {
                  const id = keys.ids[i]!;
                  if (el && toOpen.current.has(id)) {
                    el.open = true;
                    toOpen.current.delete(id);
                  }
                }}
              >
                <summary className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                  <ChevronRight aria-hidden="true" className="chevron size-4 shrink-0 text-muted-foreground transition-transform duration-150" />
                  <span className="item-pos w-6 shrink-0 text-sm text-muted-foreground">{i + 1}.</span>
                  <span className="item-title min-w-0 flex-1 truncate font-medium">{summary}</span>
                  {bad && <Badge tone="danger">Perlu diperbaiki</Badge>}
                  {isPlainObject(item) && item.active === false && <Badge tone="muted">Tidak tampil</Badge>}
                </summary>
                <div className="item-body space-y-5 border-t p-4 outline-none md:p-5" id={fieldId(itemPath)} tabIndex={-1}>
                  <FieldIssues path={itemPath} />
                  {isPlainObject(item) ? (
                    <ObjectFields path={itemPath} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} rootItem={rootItems} />
                  ) : (
                    <Node path={itemPath} k={k} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? (v as Json) : x)))} />
                  )}
                  <div className="item-tools -mx-4 -mb-4 flex flex-wrap items-center gap-1 border-t bg-subtle px-3 py-2 md:-mx-5 md:-mb-5 md:px-4" role="group" aria-label={`Atur ${noun} ${i + 1}`}>
                    <IconAction label={`Naikkan ${noun} ${i + 1}`} tip="Naikkan" disabled={i === 0} onClick={() => move(i, i - 1)}>
                      <ArrowUp aria-hidden="true" />
                    </IconAction>
                    <IconAction label={`Turunkan ${noun} ${i + 1}`} tip="Turunkan" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}>
                      <ArrowDown aria-hidden="true" />
                    </IconAction>
                    <span className="flex-1" />
                    <Button variant="ghost-destructive" size="sm" onClick={() => setConfirmRemove(i)} aria-label={`Hapus ${noun} ${i + 1}`}>
                      <Trash2 aria-hidden="true" />
                      Hapus {noun}
                    </Button>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
      <FieldIssues path={path} />
      <Button variant="outline" onClick={add}>
        <Plus aria-hidden="true" />
        Tambah {noun}
      </Button>
      <ConfirmDialog
        open={confirmRemove !== null}
        title={`Hapus ${noun}?`}
        confirmLabel={`Ya, hapus ${noun}`}
        danger
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          const i = confirmRemove!;
          keys.remove(i);
          onChange(removeAt(value, i));
          setConfirmRemove(null);
          announce(`${capital(noun)} ${i + 1} dihapus dari draf.`);
        }}
      >
        <p>
          {capital(noun)} <strong>{confirmRemove !== null ? itemSummary(value[confirmRemove]) ?? `nomor ${confirmRemove + 1}` : ''}</strong> akan
          dihapus dari draf. Situs baru berubah setelah draf diterbitkan; sebelum itu Anda masih bisa membuang draf untuk
          mengembalikannya.
        </p>
      </ConfirmDialog>
    </div>
  );
}

const capital = (s: string) => s[0]!.toUpperCase() + s.slice(1);

function StringArray({ path, k, value, onChange }: { path: string; k: string; value: string[]; onChange: (v: Json) => void }) {
  const label = humanizeKey(k);
  return (
    <fieldset className="bi min-w-0 space-y-3" id={fieldId(path)} tabIndex={-1}>
      <legend className="mb-2 text-sm font-semibold text-foreground">{label}</legend>
      {value.map((v, i) => (
        <TextControl key={i} path={joinPath(path, i)} srPrefix={label} label={`Baris ${i + 1}`} value={v} long={false} onChange={(x) => onChange(value.map((y, j) => (j === i ? x : y)))} />
      ))}
      <FieldIssues path={path} />
      <Button variant="ghost" size="sm" className="-ml-3" onClick={() => onChange([...value, ''])}>
        <Plus aria-hidden="true" />
        Tambah baris
      </Button>
    </fieldset>
  );
}

/* ---------- objek dan simpul umum ---------- */

function ObjectFields({ path, value, onChange, rootItem = false }: { path: string; value: JsonObject; onChange: (v: Json) => void; rootItem?: boolean }) {
  const { fileKey } = useForm();
  const keys = keysFor(value, fileKey, rootItem);
  const setKey = (k: string, v: Json | undefined) => {
    const next: JsonObject = {};
    for (const key of keys) {
      if (key === k) {
        if (v !== undefined) next[key] = v;
      } else if (key in value) next[key] = value[key]!;
    }
    onChange(next);
  };
  return (
    <div className="space-y-5">
      {keys.map((k) => (
        <Node key={k} path={joinPath(path, k)} k={k} value={value[k]} onChange={(v) => setKey(k, v)} />
      ))}
    </div>
  );
}

export function Node({ path, k, value, onChange, depth = 0 }: { path: string; k: string; value: Json | undefined; onChange: (v: Json | undefined) => void; depth?: number }) {
  const shape = shapeOf(value, k);
  const label = humanizeKey(k);
  switch (shape) {
    case 'bilingual':
      return <BilingualField path={path} k={k} value={value as { id: string; en: string }} onChange={onChange} />;
    case 'bilingualList':
      return <BilingualList path={path} k={k} value={value as { id: string[]; en: string[] }} onChange={onChange} />;
    case 'image':
      return <ImageField path={path} value={value as { src: string; alt: { id: string; en: string } }} onChange={onChange} renderAlt={(p, v, set) => <BilingualField path={p} k="alt" value={v} onChange={set} />} />;
    case 'objectArray':
      return (
        <Group path={path} title={label} depth={depth}>
          <ObjectArray path={path} k={k} value={value as Json[]} onChange={onChange} rootItems={false} />
        </Group>
      );
    case 'stringArray':
      return <StringArray path={path} k={k} value={value as string[]} onChange={onChange} />;
    case 'object':
      return (
        <Group path={path} title={label} depth={depth}>
          <ObjectFields path={path} value={value as JsonObject} onChange={onChange} />
        </Group>
      );
    case 'route':
      return <RouteSelect path={path} label={label} value={value as string} onChange={onChange} />;
    case 'date':
      return <DateControl path={path} label={label} value={value as string | undefined} onChange={onChange} />;
    case 'boolean':
      return <BooleanControl path={path} label={label} value={value as boolean} onChange={onChange} />;
    case 'number':
      return <NumberControl path={path} label={label} value={value as number} onChange={onChange} />;
    case 'email':
      return <TextControl path={path} label={label} value={(value as string) ?? ''} long={false} type="email" onChange={onChange} />;
    default:
      return (
        <TextControl
          path={path}
          label={label}
          value={typeof value === 'string' ? value : ''}
          long={isLongText(k, [typeof value === 'string' ? value : ''])}
          onChange={onChange}
          hint={k === 'slug' ? SLUG_HINT : READONLY[k]}
          readOnly={k in READONLY}
        />
      );
  }
}

function Group({ path, title, children, depth }: { path: string; title: string; children: ReactNode; depth: number }) {
  return (
    <fieldset className={cn('group min-w-0 rounded-lg border p-4 md:p-5', depth === 0 ? 'bg-subtle' : 'bg-card')} id={`${fieldId(path)}-group`} data-depth={depth}>
      <legend className="-ml-1 px-1 text-sm font-semibold text-foreground">{title}</legend>
      {children}
      <FieldIssues path={path} />
    </fieldset>
  );
}

function RouteSelect({ path, label, value, onChange }: { path: string; label: string; value: string; onChange: (v: string) => void }) {
  const id = fieldId(path);
  const { invalid, describedBy } = useInvalid(path);
  const known = ROUTE_OPTIONS.some((o) => o.value === value);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} aria-describedby={describedBy}>
        {!known && <option value={value}>{value || '(belum dipilih)'}</option>}
        {ROUTE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
      <FieldIssues path={path} />
    </div>
  );
}

function DateControl({ path, label, value, onChange }: { path: string; label: string; value: string | undefined; onChange: (v: string | undefined) => void }) {
  const id = fieldId(path);
  const { invalid, describedBy } = useInvalid(path);
  const optional = path.endsWith('validThrough');
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        className="md:max-w-56"
        id={id}
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || (optional ? undefined : ''))}
        aria-invalid={invalid || undefined}
        aria-describedby={join(describedBy, optional ? `${id}-hint` : undefined)}
      />
      {optional && <FieldHint id={`${id}-hint`}>Kosongkan bila lowongan tidak punya batas waktu.</FieldHint>}
      <FieldIssues path={path} />
    </div>
  );
}

function BooleanControl({ path, label, value, onChange }: { path: string; label: string; value: boolean; onChange: (v: boolean) => void }) {
  const id = fieldId(path);
  const { invalid, describedBy } = useInvalid(path);
  return (
    <div>
      <label className="inline-flex min-h-6 cursor-pointer items-center gap-2.5 text-sm font-medium max-md:min-h-11" htmlFor={id}>
        <Checkbox id={id} checked={value} onChange={(e) => onChange(e.target.checked)} aria-invalid={invalid || undefined} aria-describedby={describedBy} />
        {label}
      </label>
      <FieldIssues path={path} />
    </div>
  );
}

function NumberControl({ path, label, value, onChange }: { path: string; label: string; value: number; onChange: (v: number) => void }) {
  const id = fieldId(path);
  const { invalid, describedBy } = useInvalid(path);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input className="md:max-w-56" id={id} type="number" value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(Number(e.target.value))} aria-invalid={invalid || undefined} aria-describedby={describedBy} />
      <FieldIssues path={path} />
    </div>
  );
}

/* ---------- akar berkas ---------- */

export function RootForm({ kind, value, onChange }: { kind: 'object' | 'array'; value: Json; onChange: (v: Json) => void }) {
  const { fileKey } = useForm();
  if (kind === 'array' && Array.isArray(value)) {
    return <ObjectArray path="" k={fileKey} value={value} onChange={onChange} rootItems />;
  }
  if (isPlainObject(value)) {
    // Berkas berbentuk objek: kunci teratas yang berupa objek menjadi bagian dengan judul h2.
    const keys = Object.keys(value);
    const set = (k: string, v: Json | undefined) => {
      const next: JsonObject = {};
      for (const key of keys) {
        if (key === k) {
          if (v !== undefined) next[key] = v;
        } else next[key] = value[key]!;
      }
      onChange(next);
    };
    return (
      <div className="space-y-6">
        {keys.map((k) => {
          const v = value[k]!;
          if (shapeOf(v, k) === 'object') {
            return (
              <section key={k} aria-labelledby={`${fieldId(k)}-h`} className="space-y-4 rounded-xl border bg-card p-4 md:p-6">
                <h2 className="section-title text-lg font-bold" id={`${fieldId(k)}-h`}>
                  {humanizeKey(k)}
                </h2>
                <ObjectFields path={k} value={v as JsonObject} onChange={(x) => set(k, x)} />
              </section>
            );
          }
          return <Node key={k} path={k} k={k} value={v} onChange={(x) => set(k, x)} />;
        })}
      </div>
    );
  }
  return <p>Bentuk data berkas ini tidak dikenali.</p>;
}
