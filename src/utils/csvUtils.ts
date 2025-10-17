/**
 * Utility functions for CSV file handling with cross-browser compatibility
 */

export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates if a file is a valid CSV file with cross-browser compatibility
 * Handles different MIME types that browsers might report for CSV files
 */
export const validateCSVFile = (file: File): FileValidationResult => {
  // Debug logging for browser compatibility
  console.log('Validating file:', {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified
  });

  // Check file extension first (most reliable)
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return {
      isValid: false,
      errorMessage: 'Please select a file with .csv extension'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      errorMessage: 'File size cannot exceed 5MB'
    };
  }

  // Check MIME type (different browsers report different types for CSV)
  const validMimeTypes = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel', // Some versions of Excel
    'text/comma-separated-values', // Alternative CSV MIME type
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel files sometimes
    '', // Some browsers don't set MIME type for CSV
  ];

  const hasValidMimeType = validMimeTypes.includes(file.type);

  if (!hasValidMimeType) {
    console.warn('Unexpected MIME type for CSV file:', file.type);
    // Don't reject based on MIME type alone, as browsers are inconsistent
    // The file extension check is more reliable
  }

  return {
    isValid: true
  };
};

/**
 * Standard accept attribute for CSV file inputs
 * Includes multiple MIME types for better browser compatibility
 */
export const CSV_ACCEPT_TYPES = '.csv,text/csv,application/csv,text/plain';

/**
 * Handles file selection with proper validation
 */
export const handleCSVFileSelection = (
  file: File | null,
  onSuccess: (file: File) => void,
  onError: (message: string) => void
): void => {
  if (!file) {
    onError('No file selected');
    return;
  }

  const validation = validateCSVFile(file);
  
  if (validation.isValid) {
    onSuccess(file);
  } else {
    onError(validation.errorMessage || 'Invalid file');
  }
};
