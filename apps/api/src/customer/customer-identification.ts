export function normalizeIdentificationType(value: string): string {
  return value.trim().toLocaleUpperCase('en-US');
}

export function normalizeIdentificationValue(value: string): string {
  return value
    .trim()
    .toLocaleUpperCase('en-US')
    .replace(/[\s.-]+/g, '');
}

export function trimToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
