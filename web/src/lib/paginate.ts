/** Page size of the careers list (the live site shows 5 roles per page). */
export const PAGE_SIZE = 5;

export interface PageInfo {
  /** The page actually shown (1-based), after clamping. 0 when there are no items. */
  page: number;
  totalPages: number;
  /** Item positions shown, 1-based and inclusive: "start - end of total". Both 0 when there are no items. */
  start: number;
  end: number;
  /** Slice bounds into the item list (end exclusive). */
  from: number;
  to: number;
  /** Controls are only needed when the items do not fit one page. */
  showControls: boolean;
  hasPrev: boolean;
  hasNext: boolean;
}

/** Which slice of `total` items to show on `page` (1-based). Out-of-range and non-integer pages are clamped. */
export function paginate(total: number, page: number, size: number = PAGE_SIZE): PageInfo {
  const count = Math.max(0, Math.floor(total));
  const per = Math.max(1, Math.floor(size));
  const totalPages = Math.ceil(count / per);
  const current = totalPages === 0 ? 0 : Math.min(totalPages, Math.max(1, Math.floor(Number.isFinite(page) ? page : 1)));
  const from = current === 0 ? 0 : (current - 1) * per;
  const to = Math.min(count, from + per);
  return {
    page: current,
    totalPages,
    start: count === 0 ? 0 : from + 1,
    end: to,
    from,
    to,
    showControls: count > per,
    hasPrev: current > 1,
    hasNext: current < totalPages,
  };
}

/** Fills `{start}`, `{end}`, `{total}` and `{n}` in a UI string template. */
export function fillTemplate(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}
