// Grade calculation utilities for report card generation

// Grade scale type for custom grading from database
export interface GradeScaleEntry {
  grade: string;
  min_marks: number;
  max_marks: number;
  points: number;
  remarks?: string;
}

export const GRADING_NOT_CONFIGURED_MESSAGE = 'you need to add you grading system for a particular school';

/**
 * Get grade from custom grade scale
 * @param percentage - The percentage score
 * @param gradeScale - Optional custom grade scale from database
 * @returns The grade letter
 */
export const getGradeFromScale = (percentage: number, gradeScale?: GradeScaleEntry[]): string => {
  const scale = gradeScale || [];
  if (scale.length === 0) {
    throw new Error(GRADING_NOT_CONFIGURED_MESSAGE);
  }
  for (const entry of scale) {
    if (percentage >= entry.min_marks && percentage <= entry.max_marks) {
      return entry.grade;
    }
  }
  throw new Error(GRADING_NOT_CONFIGURED_MESSAGE);
};

/**
 * Get grade points from custom grade scale
 * @param grade - The grade letter
 * @param gradeScale - Optional custom grade scale from database
 * @returns The grade points
 */
export const getPointsFromScale = (grade: string, gradeScale?: GradeScaleEntry[]): number => {
  const scale = gradeScale || [];
  if (scale.length === 0) {
    throw new Error(GRADING_NOT_CONFIGURED_MESSAGE);
  }
  const entry = scale.find(e => e.grade === grade);
  if (!entry) {
    throw new Error(GRADING_NOT_CONFIGURED_MESSAGE);
  }
  return entry.points;
};

/**
 * Get remarks from custom grade scale
 * @param percentage - The percentage score
 * @param gradeScale - Optional custom grade scale from database
 * @returns The remarks string
 */
export const getRemarksFromScale = (percentage: number, gradeScale?: GradeScaleEntry[]): string => {
  const scale = gradeScale || [];
  if (scale.length === 0) {
    throw new Error(GRADING_NOT_CONFIGURED_MESSAGE);
  }
  for (const entry of scale) {
    if (percentage >= entry.min_marks && percentage <= entry.max_marks) {
      return entry.remarks || '';
    }
  }
  throw new Error(GRADING_NOT_CONFIGURED_MESSAGE);
};

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
