import { useEffect } from 'react';

export function useTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Portal Admin PROMIND`;
  }, [title]);
}
