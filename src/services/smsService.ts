/**
 * SMS Service for Hostpinnacles Bulk SMS API Integration
 * 
 * This service handles sending SMS notifications to parents about student results
 * using the Hostpinnacles Bulk SMS API.
 * 
 * API Documentation: https://hostpinnacle.co.ke/
 * 
 * Environment Variables Required:
 * - VITE_SMS_API_URL: API endpoint (default: https://sms.hostpinnacle.co.ke/api/sms/send)
 * - VITE_SMS_USER_ID: Hostpinnacles User ID
 * - VITE_SMS_API_KEY: Hostpinnacles API Key
 * - VITE_SMS_SENDER_ID: Sender ID (default: SchoolMaster)
 */

import { SMS_CONFIG as ENV_SMS_CONFIG } from '../config/environment';

// SMS API Configuration - Uses environment variables
const SMS_CONFIG = {
  // Hostpinnacles API endpoint from environment
  API_URL: ENV_SMS_CONFIG.API_URL,
  
  // Default sender ID from environment
  DEFAULT_SENDER_ID: ENV_SMS_CONFIG.SENDER_ID,
  
  // API credentials - Uses environment variables with localStorage fallback
  getCredentials: () => {
    // First check environment variables
    if (ENV_SMS_CONFIG.USER_ID && ENV_SMS_CONFIG.API_KEY) {
      return {
        userId: ENV_SMS_CONFIG.USER_ID,
        apiKey: ENV_SMS_CONFIG.API_KEY,
        senderId: ENV_SMS_CONFIG.SENDER_ID
      };
    }
    
    // Fallback to localStorage for backward compatibility
    const smsSettings = localStorage.getItem('sms_settings');
    if (smsSettings) {
      try {
        return JSON.parse(smsSettings);
      } catch {
        return null;
      }
    }
    return null;
  },
  
  // Check if using environment variables
  isUsingEnvCredentials: () => {
    return !!(ENV_SMS_CONFIG.USER_ID && ENV_SMS_CONFIG.API_KEY);
  }
};

export interface SmsRecipient {
  phoneNumber: string;
  studentName: string;
  studentId: string;
  parentName?: string;
}

export interface SmsMessage {
  recipient: SmsRecipient;
  message: string;
}

export interface SmsSendResult {
  success: boolean;
  recipient: SmsRecipient;
  messageId?: string;
  error?: string;
}

export interface BulkSmsResult {
  totalSent: number;
  totalFailed: number;
  results: SmsSendResult[];
}

export interface StudentResultData {
  studentName: string;
  admissionNumber: string;
  className: string;
  term: string;
  year: string;
  examType: string;
  totalMarks: number;
  average: number;
  grade: string;
  position: number;
  totalStudents: number;
  subjects?: { name: string; marks: number; grade: string }[];
}

export interface TermSummaryData {
  studentName: string;
  admissionNumber: string;
  className: string;
  term: string;
  year: string;
  average: number;
  grade: string;
  position: number;
  totalStudents: number;
  examResults: {
    examType: string;
    average: number;
    grade: string;
  }[];
  topSubjects?: { name: string; marks: number; grade: string }[];
}

/**
 * Format phone number to required format (254XXXXXXXXX)
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove any spaces, dashes, or special characters
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Remove any leading + sign
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  // Validate length (should be 12 digits for Kenya)
  if (cleaned.length !== 12) {
    console.warn(`Phone number ${phone} formatted to ${cleaned} may be invalid`);
  }
  
  return cleaned;
};

/**
 * Generate a result summary message for a student
 */
export const generateResultMessage = (data: StudentResultData, customTemplate?: string): string => {
  if (customTemplate) {
    // Replace placeholders in custom template
    return customTemplate
      .replace(/{studentName}/g, data.studentName)
      .replace(/{admissionNumber}/g, data.admissionNumber)
      .replace(/{className}/g, data.className)
      .replace(/{term}/g, data.term)
      .replace(/{year}/g, data.year)
      .replace(/{examType}/g, data.examType)
      .replace(/{totalMarks}/g, data.totalMarks.toString())
      .replace(/{average}/g, data.average.toFixed(1))
      .replace(/{grade}/g, data.grade)
      .replace(/{position}/g, data.position.toString())
      .replace(/{totalStudents}/g, data.totalStudents.toString());
  }
  
  // Default message template
  return `Dear Parent,

${data.studentName} (${data.admissionNumber}) has completed ${data.examType} for Term ${data.term} ${data.year}.

Results Summary:
- Class: ${data.className}
- Average: ${data.average.toFixed(1)}%
- Grade: ${data.grade}
- Position: ${data.position} of ${data.totalStudents}

For detailed report, please visit the school or parent portal.

- SchoolMaster Pro`;
};

/**
 * Generate a term summary message with all exams for a student
 */
export const generateTermSummaryMessage = (data: TermSummaryData, customTemplate?: string): string => {
  if (customTemplate) {
    // Replace placeholders in custom template
    return customTemplate
      .replace(/{studentName}/g, data.studentName)
      .replace(/{admissionNumber}/g, data.admissionNumber)
      .replace(/{className}/g, data.className)
      .replace(/{term}/g, data.term)
      .replace(/{year}/g, data.year)
      .replace(/{average}/g, data.average.toFixed(1))
      .replace(/{grade}/g, data.grade)
      .replace(/{position}/g, data.position.toString())
      .replace(/{totalStudents}/g, data.totalStudents.toString());
  }
  
  // Build exam breakdown
  const examBreakdown = data.examResults
    .map(e => `  - ${e.examType}: ${e.average.toFixed(1)}% (${e.grade})`)
    .join('\n');
  
  // Build top subjects if available
  let subjectsSummary = '';
  if (data.topSubjects && data.topSubjects.length > 0) {
    subjectsSummary = '\n\nTop Subjects:\n' + data.topSubjects
      .slice(0, 5)
      .map(s => `  - ${s.name}: ${s.marks} (${s.grade})`)
      .join('\n');
  }
  
  // Default message template
  return `Dear Parent,

Term ${data.term} ${data.year} Summary for ${data.studentName} (${data.admissionNumber})

Class: ${data.className}

Exam Results:
${examBreakdown}

Overall Performance:
- Term Average: ${data.average.toFixed(1)}%
- Grade: ${data.grade}
- Position: ${data.position} of ${data.totalStudents}${subjectsSummary}

For detailed report, visit the parent portal.

- SchoolMaster Pro`;
};

/**
 * Send a single SMS via Hostpinnacles API
 */
export const sendSingleSms = async (
  phoneNumber: string,
  message: string,
  senderId?: string
): Promise<SmsSendResult> => {
  const credentials = SMS_CONFIG.getCredentials();
  
  if (!credentials || !credentials.apiKey || !credentials.userId) {
    return {
      success: false,
      recipient: { phoneNumber, studentName: '', studentId: '' },
      error: 'SMS credentials not configured. Please configure SMS settings first.'
    };
  }
  
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  if (!formattedPhone || formattedPhone.length !== 12) {
    return {
      success: false,
      recipient: { phoneNumber, studentName: '', studentId: '' },
      error: `Invalid phone number: ${phoneNumber}`
    };
  }
  
  try {
    // Hostpinnacles API request
    const response = await fetch(SMS_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        userid: credentials.userId,
        password: credentials.apiKey,
        mobile: formattedPhone,
        msg: message,
        senderid: senderId || credentials.senderId || SMS_CONFIG.DEFAULT_SENDER_ID,
        msgType: 'text',
        duplicatecheck: 'true',
        output: 'json'
      })
    });
    
    const result = await response.json();
    
    // Check response status (Hostpinnacles returns specific status codes)
    if (result.status === 'success' || result.status === '000') {
      return {
        success: true,
        recipient: { phoneNumber: formattedPhone, studentName: '', studentId: '' },
        messageId: result.messageid || result.msgid
      };
    } else {
      return {
        success: false,
        recipient: { phoneNumber: formattedPhone, studentName: '', studentId: '' },
        error: result.message || result.reason || 'Failed to send SMS'
      };
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      recipient: { phoneNumber: formattedPhone, studentName: '', studentId: '' },
      error: error instanceof Error ? error.message : 'Network error sending SMS'
    };
  }
};

/**
 * Send bulk SMS to multiple recipients
 */
export const sendBulkSms = async (
  messages: SmsMessage[],
  onProgress?: (current: number, total: number) => void
): Promise<BulkSmsResult> => {
  const results: SmsSendResult[] = [];
  let successCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < messages.length; i++) {
    const { recipient, message } = messages[i];
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, messages.length);
    }
    
    const result = await sendSingleSms(recipient.phoneNumber, message);
    result.recipient = recipient;
    
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
    
    // Add a small delay to avoid rate limiting
    if (i < messages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return {
    totalSent: successCount,
    totalFailed: failedCount,
    results
  };
};

/**
 * Save SMS settings to localStorage
 */
export const saveSmsSettings = (settings: {
  userId: string;
  apiKey: string;
  senderId: string;
}): void => {
  localStorage.setItem('sms_settings', JSON.stringify(settings));
};

/**
 * Get SMS settings from localStorage
 */
export const getSmsSettings = (): {
  userId: string;
  apiKey: string;
  senderId: string;
} | null => {
  return SMS_CONFIG.getCredentials();
};

/**
 * Check if SMS is configured (via environment or localStorage)
 */
export const isSmsConfigured = (): boolean => {
  const credentials = SMS_CONFIG.getCredentials();
  return !!(credentials && credentials.apiKey && credentials.userId);
};

/**
 * Check if SMS is configured via environment variables
 */
export const isUsingEnvCredentials = (): boolean => {
  return SMS_CONFIG.isUsingEnvCredentials();
};

export default {
  sendSingleSms,
  sendBulkSms,
  formatPhoneNumber,
  generateResultMessage,
  generateTermSummaryMessage,
  saveSmsSettings,
  getSmsSettings,
  isSmsConfigured,
  isUsingEnvCredentials
};
