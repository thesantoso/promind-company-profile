import { CheckCircle2, Upload } from 'lucide-react';
import { useId, useState, type ChangeEvent } from 'react';
import { ApiError } from '../api';
import { cn } from '../lib/cn';
import { errorMessage } from '../lib/errors';
import { formatBytes } from '../lib/format';
import { prepareImage, uploadImage, type Uploaded } from '../photoUpload';
import { Alert, ConfirmDialog, buttonVariants, toast } from './ui';

/** Tombol unggah foto: kompres di browser, unggah, tangani setiap kode galat, tawarkan timpa bila nama sudah ada. */
export function PhotoUploader({ onUploaded, label = 'Unggah foto', compact = false }: { onUploaded: (u: Uploaded) => void; label?: string; compact?: boolean }) {
  const id = useId();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null);

  const send = async (file: File, overwrite: boolean) => {
    setBusy('Mengunggah…');
    try {
      const r = await uploadImage(file, overwrite);
      const msg = `Foto ${r.name} terunggah (${r.width}×${r.height} px, ${formatBytes(r.size)}). Foto ini ikut terbit saat konten diterbitkan.`;
      setDone(msg);
      toast(`Foto ${r.name} terunggah.`);
      onUploaded(r);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'network';
      if (code === 'exists' && !overwrite) {
        setPending(file);
        return;
      }
      const serverMsg = e instanceof ApiError && code === 'bad_name' && typeof e.body.message === 'string' ? ` (${e.body.message})` : '';
      setError(errorMessage(code, 'photo') + serverMsg);
    } finally {
      setBusy(null);
    }
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    setError(null);
    setDone(null);
    setBusy('Menyiapkan foto…');
    const { file } = await prepareImage(picked);
    await send(file, false);
  };

  return (
    <div className="space-y-2">
      <div className="relative inline-flex">
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg"
          onChange={(e) => void onPick(e)}
          disabled={busy !== null}
          aria-describedby={`${id}-hint`}
          className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0 disabled:cursor-wait"
        />
        <label
          htmlFor={id}
          className={cn(buttonVariants({ variant: compact ? 'outline' : 'default' }), 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring', busy && 'opacity-60')}
        >
          <Upload aria-hidden="true" />
          {busy ?? label}
        </label>
      </div>
      <p className="text-xs text-muted-foreground" id={`${id}-hint`}>
        JPEG, lebar minimal 800 px. Foto besar otomatis dikecilkan (maks. 2000 px, 1,5 MB). Nama berkas: huruf kecil, angka, tanda hubung.
      </p>
      {busy && (
        <p className="sr-only" role="status">
          {busy}
        </p>
      )}
      {done && (
        <p className="flex items-start gap-2 text-sm text-success" role="status">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {done}
        </p>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <ConfirmDialog
        open={pending !== null}
        title="Timpa foto lama?"
        confirmLabel="Ya, timpa foto lama"
        danger
        onClose={() => setPending(null)}
        onConfirm={async () => {
          const f = pending;
          setPending(null);
          if (f) await send(f, true);
        }}
      >
        <p>
          Sudah ada foto bernama <code>{pending?.name.toLowerCase()}</code> di situs. Bila ditimpa, semua konten yang memakai foto ini akan
          menampilkan foto baru setelah diterbitkan.
        </p>
      </ConfirmDialog>
    </div>
  );
}
