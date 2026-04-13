/**
 * Grading utility for calculating grades based on school's grading system.
 * This utility fetches the grade scale from the backend and provides
 * functions to calculate grades on the frontend.
 */

import { APIService } from '../services/baseUrl';

export interface GradeDefinition {
  grade: string;
  min_marks: number;
  max_marks: number;
  points: number;
  remarks: string;
}

export interface GradeResult {
  grade: string;
  points: number;
  remarks: string;
}

export const GRADING_NOT_CONFIGURED_MESSAGE = 'you need to add you grading system for a particular school';

// Cache for grade scales
const gradeScaleCache: Map<string, { scale: GradeDefinition[]; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the auth type based on available tokens
 */
const getAuthType = (): 'school' | 'staff' => {
  return localStorage.getItem('staff_access_token') ? 'staff' : 'school';
};

/**
 * Fetch grade scale from the API
 */
export const fetchGradeScale = async (
  classId?: string,
  subjectId?: string
): Promise<GradeDefinition[]> => {
  const cacheKey = `${classId || 'all'}_${subjectId || 'all'}`;
  const cached = gradeScaleCache.get(cacheKey);
  
  // Check cache
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.scale;
  }
  
  try {
    const authType = getAuthType();
    let url = '/api/grading/calculate/';
    const params: string[] = [];
    
    if (classId) params.push(`class_id=${classId}`);
    if (subjectId) params.push(`subject_id=${subjectId}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    const response = await APIService.get(url, undefined, authType);
    
    if (response.success && response.grade_scale && response.grade_scale.length > 0) {
      const scale = response.grade_scale;
      gradeScaleCache.set(cacheKey, { scale, timestamp: Date.now() });
      return scale;
    }

    throw new Error(response.error || GRADING_NOT_CONFIGURED_MESSAGE);
  } catch (error) {
    console.error('Error fetching grade scale:', error);
    throw error instanceof Error ? error : new Error(GRADING_NOT_CONFIGURED_MESSAGE);
  }
};

/**
 * Calculate grade from percentage using cached grade scale
 */
export const calculateGrade = (
  percentage: number,
  gradeScale?: GradeDefinition[]
): GradeResult => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return { grade: '', points: 0, remarks: '' };
  }

  if (!gradeScale || gradeScale.length === 0) {
    throw new Error(GRADING_NOT_CONFIGURED_MESSAGE);
  }
  
  // Ensure percentage is within bounds
  const pct = Math.max(0, Math.min(100, percentage));
  
  for (const scale of gradeScale) {
    if (pct >= scale.min_marks && pct <= scale.max_marks) {
      return {
        grade: scale.grade,
        points: scale.points,
        remarks: scale.remarks
      };
    }
  }
  
  // Fallback to lowest grade if no match found
  const lowestGrade = gradeScale[gradeScale.length - 1];
  return {
    grade: lowestGrade?.grade || 'E',
    points: lowestGrade?.points || 1,
    remarks: lowestGrade?.remarks || ''
  };
};

/**
 * Get just the grade letter from percentage
 */
export const getGrade = (
  percentage: number,
  gradeScale?: GradeDefinition[]
): string => {
  return calculateGrade(percentage, gradeScale).grade;
};

/**
 * Get grade color class based on grade letter
 */
export const getGradeColor = (grade: string): string => {
  if (!grade) return 'bg-gray-100 text-gray-800';
  
  const gradeUpper = grade.toUpperCase();
  
  if (gradeUpper.startsWith('A')) {
    return 'bg-green-100 text-green-800';
  } else if (gradeUpper.startsWith('B')) {
    return 'bg-blue-100 text-blue-800';
  } else if (gradeUpper.startsWith('C')) {
    return 'bg-yellow-100 text-yellow-800';
  } else if (gradeUpper.startsWith('D')) {
    return 'bg-orange-100 text-orange-800';
  } else {
    return 'bg-red-100 text-red-800';
  }
};

/**
 * Get grade color for marks (percentage-based)
 */
export const getGradeColorFromMarks = (
  percentage: number,
  gradeScale?: GradeDefinition[]
): string => {
  const { grade } = calculateGrade(percentage, gradeScale);
  return getGradeColor(grade);
};

/**
 * Clear the grade scale cache
 */
export const clearGradeCache = (): void => {
  gradeScaleCache.clear();
};

/**
 * Default export with all functions
 */
export default {
  fetchGradeScale,
  calculateGrade,
  getGrade,
  getGradeColor,
  getGradeColorFromMarks,
  clearGradeCache,
};
