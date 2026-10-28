import { useId, useState, type ChangeEvent } from 'react';
import { ApiError } from '../api';
import { errorMessage } from '../lib/errors';
import { formatBytes } from '../lib/format';
import { prepareImage, uploadImage, type Uploaded } from '../photoUpload';
import { ConfirmDialog, ErrorText, announce } from './ui';

/** Tombol unggah foto: kompres di browser, unggah, tangani setiap kode galat, tawarkan timpa bila nama sudah ada. */
export function PhotoUploader({ onUploaded, label = 'Unggah foto' }: { onUploaded: (u: Uploaded) => void; label?: string }) {
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
      announce(msg);
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
    <div className="uploader">
      <div className="file-pick">
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg"
          onChange={(e) => void onPick(e)}
          disabled={busy !== null}
          aria-describedby={`${id}-hint`}
        />
        <label htmlFor={id} className="btn btn-secondary">
          {busy ?? label}
        </label>
      </div>
      <span className="hint" id={`${id}-hint`}>
        JPEG, lebar minimal 800 px. Foto besar otomatis dikecilkan (maks. 2000 px, 1,5 MB). Nama berkas: huruf kecil, angka, tanda hubung.
      </span>
      {busy && (
        <p className="small" role="status">
          {busy}
        </p>
      )}
      {done && (
        <p className="small msg-inline-success" role="status">
          {done}
        </p>
      )}
      <ErrorText>{error}</ErrorText>
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
          Sudah ada foto bernama <code>{pending?.name.toLowerCase()}</code> di situs. Bila ditimpa, semua konten yang memakai
          foto ini akan menampilkan foto baru setelah diterbitkan.
        </p>
      </ConfirmDialog>
    </div>
  );
}
