/** Tipe dan pemanggilan API konten yang dipakai beberapa halaman. */
import { get, type Issue } from './api';
import type { Json } from './lib/shape';

export interface FileStatus {
  key: string;
  label: string;
  path: string;
  hasDraft: boolean;
  draftUpdatedAt: number | null;
  draftUpdatedBy: number | null;
}

export interface ContentDoc {
  key: string;
  label: string;
  kind: 'object' | 'array';
  data: Json;
  sha: string;
  draft: null | { data: Json; baseSha: string; updatedAt: number; updatedBy: number | null; issues: Issue[] };
}

export interface ImageInfo {
  name: string;
  draft: boolean;
}

export const listFiles = async () => (await get<{ files: FileStatus[] }>('/api/content')).files;
export const loadDoc = (key: string) => get<ContentDoc>(`/api/content/${encodeURIComponent(key)}`);
export const listImages = async () => (await get<{ images: ImageInfo[] }>('/api/images')).images;
export const imageUrl = (name: string) => `/api/images/${encodeURIComponent(name)}`;
