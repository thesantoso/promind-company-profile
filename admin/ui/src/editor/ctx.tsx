import { createContext, useContext } from 'react';
import { fieldId } from '../lib/paths';

/* ---------- konteks editor ---------- */

export interface EditorCtx {
  fileKey: string;
  issues: Map<string, string[]>;
  /** Apakah ada masalah di path ini atau di bawahnya. */
  hasIssuesUnder: (path: string) => boolean;
}

export const FormContext = createContext<EditorCtx>({ fileKey: '', issues: new Map(), hasIssuesUnder: () => false });
export const useForm = () => useContext(FormContext);

/* ---------- pesan masalah per isian ---------- */

export const errId = (path: string) => `${fieldId(path)}-err`;

export function FieldIssues({ path }: { path: string }) {
  const msgs = useForm().issues.get(path);
  if (!msgs?.length) return null;
  return (
    <div className="field-error mt-1.5 text-xs font-medium text-destructive" id={errId(path)}>
      {msgs.length === 1 ? msgs[0] : (
        <ul className="list-disc space-y-0.5 pl-4">
          {msgs.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function useInvalid(path: string) {
  const has = (useForm().issues.get(path)?.length ?? 0) > 0;
  return { invalid: has, describedBy: has ? errId(path) : undefined };
}

export const join = (...ids: (string | undefined)[]) => ids.filter(Boolean).join(' ') || undefined;

