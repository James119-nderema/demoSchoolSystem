/**
 * SMS Service for Ping Africa Bulk SMS API Integration
 * 
 * This service handles sending SMS notifications to parents about student results
 * using the Ping Africa Bulk SMS API.
 * 
 * API Endpoint: POST https://bulk.ping.africa/api/sms/send-bulk
 * Auth: Bearer Token
 * 
 * Environment Variables Required:
 * - VITE_SMS_API_URL: API endpoint (default: https://bulk.ping.africa/api/sms/send-bulk)
 * - VITE_SMS_API_TOKEN: Ping Africa Bearer Token
 * - VITE_SMS_SENDER_ID: Sender ID (max 11 characters)
 * - VITE_SMS_IS_INTERNATIONAL: Whether recipients are international (default: false)
 */

import { SMS_CONFIG as ENV_SMS_CONFIG } from '../config/environment';

// Maximum recipients per API call (Ping Africa limit)
const MAX_RECIPIENTS_PER_BATCH = 1000;

// SMS API Configuration
const SMS_CONFIG = {
  API_URL: ENV_SMS_CONFIG.API_URL,
  DEFAULT_SENDER_ID: ENV_SMS_CONFIG.SENDER_ID,
  IS_INTERNATIONAL: ENV_SMS_CONFIG.IS_INTERNATIONAL,

  // Get API token from env or localStorage fallback
  getCredentials: (): { apiToken: string; senderId: string } | null => {
    // First check environment variables
    if (ENV_SMS_CONFIG.API_TOKEN) {
      return {
        apiToken: ENV_SMS_CONFIG.API_TOKEN,
        senderId: ENV_SMS_CONFIG.SENDER_ID,
      };
    }

    // Fallback to localStorage
    const smsSettings = localStorage.getItem('sms_settings');
    if (smsSettings) {
      try {
        const parsed = JSON.parse(smsSettings);
        if (parsed.apiToken) {
          return {
            apiToken: parsed.apiToken,
            senderId: parsed.senderId || '',
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  },

  isUsingEnvCredentials: (): boolean => {
    return !!ENV_SMS_CONFIG.API_TOKEN;
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

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

/** Ping Africa API request body */
interface PingAfricaBulkRequest {
  message: string;
  sender_id: string | null;
  is_international: boolean;
  sms_provider_id: number | null;
  batch_name: string | null;
  recipients: string[];
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Format phone number to required format (254XXXXXXXXX for Kenya)
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

// ─── Message Generators ──────────────────────────────────────────────────────

/**
 * Generate a result summary message for a student
 */
export const generateResultMessage = (data: StudentResultData, customTemplate?: string): string => {
  if (customTemplate) {
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

  const examBreakdown = data.examResults
    .map(e => `  - ${e.examType}: ${e.average.toFixed(1)}% (${e.grade})`)
    .join('\n');

  let subjectsSummary = '';
  if (data.topSubjects && data.topSubjects.length > 0) {
    subjectsSummary = '\n\nTop Subjects:\n' + data.topSubjects
      .slice(0, 5)
      .map(s => `  - ${s.name}: ${s.marks} (${s.grade})`)
      .join('\n');
  }

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

// ─── Ping Africa API Functions ───────────────────────────────────────────────

/**
 * Send a single bulk SMS request to Ping Africa.
 * All recipients in the array receive the SAME message.
 * Max 1000 recipients per call.
 */
const sendPingAfricaBulk = async (
  message: string,
  recipients: string[],
  options?: { senderId?: string; batchName?: string }
): Promise<{ success: boolean; error?: string }> => {
  const credentials = SMS_CONFIG.getCredentials();

  if (!credentials || !credentials.apiToken) {
    return {
      success: false,
      error: 'SMS credentials not configured. Please configure your Ping Africa API token first.',
    };
  }

  if (recipients.length === 0) {
    return { success: false, error: 'No recipients provided' };
  }

  if (recipients.length > MAX_RECIPIENTS_PER_BATCH) {
    return {
      success: false,
      error: `Too many recipients (${recipients.length}). Maximum is ${MAX_RECIPIENTS_PER_BATCH} per batch.`,
    };
  }

  if (message.length > 1600) {
    return {
      success: false,
      error: `Message too long (${message.length} chars). Maximum is 1600 characters.`,
    };
  }

  const body: PingAfricaBulkRequest = {
    message,
    sender_id: options?.senderId || credentials.senderId || SMS_CONFIG.DEFAULT_SENDER_ID || null,
    is_international: SMS_CONFIG.IS_INTERNATIONAL,
    sms_provider_id: null,
    batch_name: options?.batchName || null,
    recipients,
  };

  try {
    // Route through Vercel rewrite proxy (same origin → no CORS).
    // In production: /api/ping-africa/sms/send-bulk → https://bulk.ping.africa/api/sms/send-bulk
    // In development: fall back to direct URL from SMS_CONFIG.
    const isVercelProd = typeof window !== 'undefined' && (
      window.location.hostname.includes('schoolmaster.co.ke') ||
      window.location.hostname.includes('vercel.app')
    );
    const smsUrl = isVercelProd
      ? '/api/ping-africa/sms/send-bulk'
      : SMS_CONFIG.API_URL;

    const response = await fetch(smsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${credentials.apiToken}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const result = await response.json();
      // Ping Africa returns { success: true, batch_id, status: "processing", ... }
      if (result?.success === true || result?.status === 'processing') {
        return { success: true };
      }
      // Also accept plain 201 integer response (per docs)
      if (result === 201) {
        return { success: true };
      }
      return { success: false, error: `Unexpected response: ${JSON.stringify(result)}` };
    }

    if (response.status === 401) {
      return { success: false, error: 'Authentication failed. Please check your API token.' };
    }

    const errorBody = await response.text();
    return {
      success: false,
      error: `API error (${response.status}): ${errorBody}`,
    };
  } catch (error) {
    console.error('Ping Africa SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error sending SMS',
    };
  }
};

/**
 * Send bulk SMS to multiple recipients.
 *
 * Smart batching strategy:
 * - Groups messages with identical content → sends as one bulk API call (up to 1000 recipients)
 * - Personalized (unique per student) messages → sends each individually
 * - Reports progress throughout
 */
export const sendBulkSms = async (
  messages: SmsMessage[],
  onProgress?: (current: number, total: number) => void
): Promise<BulkSmsResult> => {
  const results: SmsSendResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  // Group messages by identical content for efficient batching
  const messageGroups = new Map<string, { recipients: SmsRecipient[]; phones: string[] }>();

  for (const msg of messages) {
    const formattedPhone = formatPhoneNumber(msg.recipient.phoneNumber);
    if (!formattedPhone || formattedPhone.length < 10) {
      results.push({
        success: false,
        recipient: msg.recipient,
        error: `Invalid phone number: ${msg.recipient.phoneNumber}`,
      });
      failedCount++;
      continue;
    }

    const existing = messageGroups.get(msg.message);
    if (existing) {
      existing.recipients.push(msg.recipient);
      existing.phones.push(formattedPhone);
    } else {
      messageGroups.set(msg.message, {
        recipients: [msg.recipient],
        phones: [formattedPhone],
      });
    }
  }

  // Calculate total API calls needed for progress tracking
  let totalCalls = 0;
  for (const [, group] of messageGroups) {
    totalCalls += Math.ceil(group.phones.length / MAX_RECIPIENTS_PER_BATCH);
  }

  let completedCalls = 0;

  for (const [message, group] of messageGroups) {
    // Chunk recipients into batches of MAX_RECIPIENTS_PER_BATCH
    for (let i = 0; i < group.phones.length; i += MAX_RECIPIENTS_PER_BATCH) {
      const batchPhones = group.phones.slice(i, i + MAX_RECIPIENTS_PER_BATCH);
      const batchRecipients = group.recipients.slice(i, i + MAX_RECIPIENTS_PER_BATCH);

      const batchName = `SMS Batch - ${new Date().toISOString().slice(0, 16)}`;
      const result = await sendPingAfricaBulk(message, batchPhones, { batchName });

      if (result.success) {
        for (const recipient of batchRecipients) {
          results.push({ success: true, recipient });
          successCount++;
        }
      } else {
        for (const recipient of batchRecipients) {
          results.push({ success: false, recipient, error: result.error });
          failedCount++;
        }
      }

      completedCalls++;
      if (onProgress) {
        onProgress(completedCalls, totalCalls);
      }

      // Small delay between batch calls to avoid rate limiting
      if (i + MAX_RECIPIENTS_PER_BATCH < group.phones.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  // Ensure final progress update
  if (onProgress) {
    onProgress(totalCalls, totalCalls);
  }

  return {
    totalSent: successCount,
    totalFailed: failedCount,
    results,
  };
};

// ─── Settings Management ─────────────────────────────────────────────────────

/**
 * Save SMS settings (Ping Africa credentials) to localStorage
 */
export const saveSmsSettings = (settings: {
  apiToken: string;
  senderId: string;
}): void => {
  localStorage.setItem('sms_settings', JSON.stringify(settings));
};

/**
 * Get SMS settings from environment or localStorage
 */
export const getSmsSettings = (): {
  apiToken: string;
  senderId: string;
} | null => {
  const credentials = SMS_CONFIG.getCredentials();
  if (!credentials) return null;
  return {
    apiToken: credentials.apiToken,
    senderId: credentials.senderId,
  };
};

/**
 * Check if SMS is configured (via environment or localStorage)
 */
export const isSmsConfigured = (): boolean => {
  const credentials = SMS_CONFIG.getCredentials();
  return !!(credentials && credentials.apiToken);
};

/**
 * Check if SMS is configured via environment variables
 */
export const isUsingEnvCredentials = (): boolean => {
  return SMS_CONFIG.isUsingEnvCredentials();
};

export default {
  sendBulkSms,
  formatPhoneNumber,
  generateResultMessage,
  generateTermSummaryMessage,
  saveSmsSettings,
  getSmsSettings,
  isSmsConfigured,
  isUsingEnvCredentials,
};
