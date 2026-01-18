// Grade calculation utilities for report card generation

// Grade scale type for custom grading from database
export interface GradeScaleEntry {
  grade: string;
  min_marks: number;
  max_marks: number;
  points: number;
  remarks?: string;
}

// Default grade scale (matches backend Grading/utils.py DEFAULT_GRADE_SCALE)
export const DEFAULT_GRADE_SCALE: GradeScaleEntry[] = [
  { grade: 'A', min_marks: 80, max_marks: 100, points: 12, remarks: 'Excellent' },
  { grade: 'A-', min_marks: 75, max_marks: 79.99, points: 11, remarks: 'Very Good' },
  { grade: 'B+', min_marks: 70, max_marks: 74.99, points: 10, remarks: 'Good' },
  { grade: 'B', min_marks: 65, max_marks: 69.99, points: 9, remarks: 'Good' },
  { grade: 'B-', min_marks: 60, max_marks: 64.99, points: 8, remarks: 'Satisfactory' },
  { grade: 'C+', min_marks: 55, max_marks: 59.99, points: 7, remarks: 'Satisfactory' },
  { grade: 'C', min_marks: 50, max_marks: 54.99, points: 6, remarks: 'Average' },
  { grade: 'C-', min_marks: 45, max_marks: 49.99, points: 5, remarks: 'Below Average' },
  { grade: 'D+', min_marks: 40, max_marks: 44.99, points: 4, remarks: 'Below Average' },
  { grade: 'D', min_marks: 35, max_marks: 39.99, points: 3, remarks: 'Poor' },
  { grade: 'D-', min_marks: 30, max_marks: 34.99, points: 2, remarks: 'Poor' },
  { grade: 'E', min_marks: 0, max_marks: 29.99, points: 1, remarks: 'Very Poor' },
];

/**
 * Get grade from custom grade scale or use default
 * @param percentage - The percentage score
 * @param gradeScale - Optional custom grade scale from database
 * @returns The grade letter
 */
export const getGradeFromScale = (percentage: number, gradeScale?: GradeScaleEntry[]): string => {
  const scale = gradeScale || DEFAULT_GRADE_SCALE;
  for (const entry of scale) {
    if (percentage >= entry.min_marks && percentage <= entry.max_marks) {
      return entry.grade;
    }
  }
  return 'E'; // Fallback
};

/**
 * Get grade points from custom grade scale or use default
 * @param grade - The grade letter
 * @param gradeScale - Optional custom grade scale from database
 * @returns The grade points
 */
export const getPointsFromScale = (grade: string, gradeScale?: GradeScaleEntry[]): number => {
  const scale = gradeScale || DEFAULT_GRADE_SCALE;
  const entry = scale.find(e => e.grade === grade);
  return entry?.points || 0;
};

/**
 * Get remarks from custom grade scale or use default
 * @param percentage - The percentage score
 * @param gradeScale - Optional custom grade scale from database
 * @returns The remarks string
 */
export const getRemarksFromScale = (percentage: number, gradeScale?: GradeScaleEntry[]): string => {
  const scale = gradeScale || DEFAULT_GRADE_SCALE;
  for (const entry of scale) {
    if (percentage >= entry.min_marks && percentage <= entry.max_marks) {
      return entry.remarks || '';
    }
  }
  return 'Needs Improvement';
};

// Legacy functions that use default grade scale
export const getGrade = (percentage: number): string => {
  return getGradeFromScale(percentage);
};

export const getGradePoints = (grade: string): number => {
  return getPointsFromScale(grade);
};

export const getRemarks = (percentage: number): string => {
  return getRemarksFromScale(percentage);
};

export const getCBCRating = (percentage: number): { rating: string; column: number } => {
  if (percentage >= 75) return { rating: 'EE', column: 0 }; // Exceeding Expectation
  if (percentage >= 50) return { rating: 'ME', column: 1 }; // Meeting Expectation
  if (percentage >= 25) return { rating: 'AE', column: 2 }; // Approaching Expectation
  return { rating: 'BE', column: 3 }; // Below Expectation
};
