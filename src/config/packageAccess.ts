export type SchoolPackage =
  | 'TIMETABLE'
  | 'REPORT_MANAGEMENT'
  | 'FEE_MANAGEMENT'
  | 'PAYROLL'
  | 'LIBRARY_MANAGEMENT';

export const PACKAGE_LABELS: Record<SchoolPackage, string> = {
  TIMETABLE: 'Timetable',
  REPORT_MANAGEMENT: 'Report Management',
  FEE_MANAGEMENT: 'Fee Management',
  PAYROLL: 'Payroll',
  LIBRARY_MANAGEMENT: 'Library Management',
};

export const PACKAGE_ORDER: SchoolPackage[] = [
  'TIMETABLE',
  'REPORT_MANAGEMENT',
  'FEE_MANAGEMENT',
  'PAYROLL',
  'LIBRARY_MANAGEMENT',
];

export const PACKAGE_PRICES: Record<SchoolPackage, { term: number; year: number }> = {
  TIMETABLE: { term: 1000, year: 3000 },
  REPORT_MANAGEMENT: { term: 14000, year: 37000 },
  FEE_MANAGEMENT: { term: 15000, year: 40000 },
  PAYROLL: { term: 9000, year: 25000 },
  LIBRARY_MANAGEMENT: { term: 8000, year: 22000 },
};

const VALID_PACKAGES = new Set<SchoolPackage>(PACKAGE_ORDER);

export const normalizePackages = (raw?: unknown): SchoolPackage[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<SchoolPackage>();
  const normalized: SchoolPackage[] = [];

  for (const item of raw) {
    const value = String(item || '').trim().toUpperCase() as SchoolPackage;
    if (VALID_PACKAGES.has(value) && !seen.has(value)) {
      seen.add(value);
      normalized.push(value);
    }
  }

  return normalized;
};

export const deriveLegacyPackageName = (selectedPackages: SchoolPackage[]): string => {
  const set = new Set(selectedPackages);
  if (set.size === 1 && set.has('TIMETABLE')) return 'TIMETABLE_ONLY';
  if (set.size === 2 && set.has('TIMETABLE') && set.has('REPORT_MANAGEMENT')) return 'TIMETABLE_RESULTS';
  if (set.size === 1 && set.has('FEE_MANAGEMENT')) return 'FEES_MANAGEMENT';
  if (set.size === PACKAGE_ORDER.length) return 'COMPLETE_PACKAGE';
  return 'CUSTOM_PACKAGE';
};

export const hasPackage = (selectedPackages: SchoolPackage[], packageName: SchoolPackage): boolean => {
  return selectedPackages.includes(packageName);
};

export const packageRouteAllowed = (
  pathname: string,
  selectedPackages: SchoolPackage[],
): boolean => {
  if (!pathname) return true;

  const globalPrefixes = ['/students', '/classes', '/admin/students', '/admin/classes', '/profile', '/school-profile'];
  if (globalPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  const startsWithAny = (prefixes: string[]) => prefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (startsWithAny(['/timetable'])) return hasPackage(selectedPackages, 'TIMETABLE');
  if (startsWithAny(['/results', '/input-marks', '/view-results', '/full-results', '/edit-marks', '/reports', '/report-card', '/statistics', '/grading', '/national-exams'])) {
    return hasPackage(selectedPackages, 'REPORT_MANAGEMENT');
  }
  if (startsWithAny(['/finance'])) return hasPackage(selectedPackages, 'FEE_MANAGEMENT');
  if (startsWithAny(['/payroll'])) return hasPackage(selectedPackages, 'PAYROLL');
  if (startsWithAny(['/library'])) return hasPackage(selectedPackages, 'LIBRARY_MANAGEMENT');

  return true;
};

export const generateAllPackageCombinations = (): SchoolPackage[][] => {
  const combos: SchoolPackage[][] = [];
  const n = PACKAGE_ORDER.length;

  for (let mask = 1; mask < (1 << n); mask++) {
    const combo: SchoolPackage[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) combo.push(PACKAGE_ORDER[i]);
    }
    combos.push(combo);
  }

  return combos;
};
