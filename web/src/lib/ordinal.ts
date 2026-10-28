/** Plain ordinal label for list item `index` (0-based): 0 -> "01". Derived in templates, never stored in content. */
export function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0');
}
