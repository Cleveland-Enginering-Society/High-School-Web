/** Options for host_options (select all that apply). Stored as jsonb array. */
export const HOST_OPTION_LABELS = [
  'Provide job shadowing opportunities',
  'Provide internship or co-op opportunities',
  'Partner with CES to host a career fair',
  'Attend in school STEM Education program (hosted by CES)',
  'Other',
] as const;

const STANDARD_OPTIONS = new Set(
  HOST_OPTION_LABELS.filter((option) => option !== 'Other')
);

/** Build jsonb-ready host_options array from form selections. */
export function buildHostOptions(
  selected: string[],
  otherText?: string
): string[] | null {
  if (!Array.isArray(selected) || selected.length === 0) return null;

  const otherSpecify = otherText?.trim();
  const hostOptions = selected
    .filter((option) => option !== 'Other')
    .concat(
      selected.includes('Other')
        ? [otherSpecify ? `Other: ${otherSpecify}` : 'Other']
        : []
    );

  return hostOptions.length > 0 ? hostOptions : null;
}

/** Parse stored host_options back into checkbox state + Other textbox. */
export function parseHostOptions(stored: string[] | null | undefined): {
  hostOptions: string[];
  hostOptionsOther: string;
} {
  if (!Array.isArray(stored) || stored.length === 0) {
    return { hostOptions: [], hostOptionsOther: '' };
  }

  const hostOptions: string[] = [];
  let hostOptionsOther = '';

  for (const entry of stored) {
    if (entry === 'Other') {
      if (!hostOptions.includes('Other')) hostOptions.push('Other');
    } else if (entry.startsWith('Other:')) {
      if (!hostOptions.includes('Other')) hostOptions.push('Other');
      hostOptionsOther = entry.slice('Other:'.length).trim();
    } else if (STANDARD_OPTIONS.has(entry)) {
      hostOptions.push(entry);
    }
  }

  return { hostOptions, hostOptionsOther };
}

/** True if stored host_options includes the given filter label (handles Other / Other:…). */
export function storedHostOptionsInclude(
  stored: string[] | null | undefined,
  filterOption: string
): boolean {
  if (!Array.isArray(stored) || stored.length === 0) return false;
  if (filterOption === 'Other') {
    return stored.some((entry) => entry === 'Other' || entry.startsWith('Other:'));
  }
  return stored.includes(filterOption);
}

/**
 * When filter selections are non-empty, company must have at least one matching host option.
 */
export function companyMatchesHostOptionFilters(
  stored: string[] | null | undefined,
  selectedFilters: string[]
): boolean {
  if (selectedFilters.length === 0) return true;
  return selectedFilters.some((option) => storedHostOptionsInclude(stored, option));
}
