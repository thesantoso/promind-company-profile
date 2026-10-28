// Careers list pagination, as on the live site: PAGE_SIZE roles per page, "Menampilkan 1 - 5 dari total 6
// posisi" and Prev / numbers / Next, shown only when more roles match the department filter than fit one page.
// All roles are in the HTML, so without this script everything stays visible. The page size is read from
// data-page-size on the list (the e2e tests set it to exercise the controls with the real content).
import { PAGE_SIZE, fillTemplate, paginate } from '../lib/paginate';

const list = document.querySelector<HTMLElement>('[data-roles]');
const pager = document.querySelector<HTMLElement>('[data-pager]');
if (list && pager) {
  const root = list.closest('.filterable') ?? document;
  const size = Number(list.dataset.pageSize) || PAGE_SIZE;
  const items = [...list.children] as HTMLElement[];
  const info = pager.querySelector<HTMLElement>('[data-pager-info]')!;
  const pages = pager.querySelector<HTMLElement>('[data-pager-pages]')!;
  const prev = pager.querySelector<HTMLButtonElement>('[data-pager-prev]')!;
  const next = pager.querySelector<HTMLButtonElement>('[data-pager-next]')!;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let matching: HTMLElement[] = items;
  let page = 1;

  const filter = () => Number(root.querySelector<HTMLInputElement>('.filter-input:checked')?.dataset.f ?? 0);

  function render(moveFocus = false) {
    const p = paginate(matching.length, page, size);
    page = p.page;
    items.forEach((li) => (li.hidden = true));
    matching.slice(p.from, p.to).forEach((li, i) => {
      li.hidden = false;
      const n = li.querySelector('.text-xs.font-extrabold');
      if (n) n.textContent = String(p.from + i + 1).padStart(2, '0');
    });
    pager.hidden = !p.showControls;
    info.textContent = fillTemplate(pager.dataset.summary ?? '', { start: p.start, end: p.end, total: matching.length });
    prev.disabled = !p.hasPrev;
    next.disabled = !p.hasNext;
    [...pages.children].forEach((b, i) => {
      const active = i + 1 === p.page;
      b.classList.toggle('is-active', active);
      if (active) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    // A disabled button cannot keep focus: hand it to the current page number.
    if (moveFocus && document.activeElement && (document.activeElement as HTMLButtonElement).disabled) {
      (pages.children[p.page - 1] as HTMLElement | undefined)?.focus();
    }
  }

  function go(n: number, scroll: boolean) {
    page = n;
    render(true);
    if (scroll) list!.closest('section')?.querySelector('.section-heading')?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  function rebuild() {
    const f = filter();
    matching = items.filter((li) => f === 0 || Number(li.dataset.g) === f);
    page = 1;
    pages.replaceChildren(
      ...Array.from({ length: paginate(matching.length, 1, size).totalPages }, (_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'career-page-num-btn';
        b.textContent = String(i + 1);
        b.setAttribute('aria-label', fillTemplate(pager.dataset.pageLabel ?? '', { n: i + 1 }));
        b.addEventListener('click', () => go(i + 1, true));
        return b;
      }),
    );
    render();
  }

  prev.addEventListener('click', () => go(page - 1, true));
  next.addEventListener('click', () => go(page + 1, true));
  root.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).matches('.filter-input')) rebuild();
  });
  rebuild();
}
