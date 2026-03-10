import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MarksAPI } from '../../../services/baseUrl';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Class {
  id: string;
  class_name: string;
  class_code: string;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
}

interface DropdownData {
  classes: Class[];
  subjects: Subject[];
  exam_types: { value: string; label: string }[];
  terms: { value: string; label: string }[];
}

interface ParsedRow {
  admission_number: string;
  full_name: string;
  marks: Record<string, number | null>;
}

interface ParsedSheet {
  sheetName: string;
  rows: ParsedRow[];
  subjectHeaders: string[];
}

interface MatchedStudent {
  student_id: string;
  admission_number: string;
  full_name: string;
  marks: Record<string, number | null>;
  matched: boolean;
}

interface ClassMatchGroup {
  class_id: string;
  class_name: string;
  subjects: Subject[];
  students: MatchedStudent[];
  allSubjectKeys: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  dropdownData: DropdownData | null;
}

const ALL_CLASSES = '__all__';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const BulkUploadMarksModal: React.FC<Props> = ({ open, onClose, dropdownData }) => {
  // --- class / subject state ---
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [loadingClass, setLoadingClass] = useState(false);

  // --- exam details ---
  const [examType, setExamType] = useState('');
  const [term, setTerm] = useState('');
  const [totalMarks, setTotalMarks] = useState<number | ''>('');
  const currentYear = new Date().getFullYear();
  const academicYearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const [academicYear, setAcademicYear] = useState(currentYear.toString());

  // --- file upload ---
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [parsedRowsFlat, setParsedRowsFlat] = useState<ParsedRow[]>([]);
  const [subjectHeadersFlat, setSubjectHeadersFlat] = useState<string[]>([]);

  // --- preview data (grouped by class) ---
  const [matchedGroups, setMatchedGroups] = useState<ClassMatchGroup[]>([]);

  // --- download template ---
  const [downloadClass, setDownloadClass] = useState('');
  const [downloading, setDownloading] = useState(false);

  // --- submission ---
  const [submitting, setSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- step ---
  const [step, setStep] = useState<'config' | 'preview'>('config');

  const isAllClasses = selectedClass === ALL_CLASSES;

  /* ---------------------------------------------------------------- */
  /*  Fetch class students & subjects when a single class is selected  */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!selectedClass || selectedClass === ALL_CLASSES) {
      setClassStudents([]);
      setClassSubjects([]);
      return;
    }
    (async () => {
      setLoadingClass(true);
      try {
        const [studRes, subRes] = await Promise.all([
          MarksAPI.getClassStudents(selectedClass),
          MarksAPI.getClassSubjects(selectedClass),
        ]);
        setClassStudents(studRes.students ?? []);
        setClassSubjects(subRes.subjects ?? []);
      } catch {
        setError('Failed to load class data');
      } finally {
        setLoadingClass(false);
      }
    })();
  }, [selectedClass]);

  /* ---------------------------------------------------------------- */
  /*  Reset on close                                                   */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!open) {
      setStep('config');
      setSelectedClass('');
      setParsedSheets([]);
      setParsedRowsFlat([]);
      setSubjectHeadersFlat([]);
      setMatchedGroups([]);
      setFileName('');
      setError('');
      setSuccess('');
      setExamType('');
      setTerm('');
      setTotalMarks('');
      setDownloadClass('');
      setSubmissionProgress('');
    }
  }, [open]);

  /* ---------------------------------------------------------------- */
  /*  Download XLSX template                                           */
  /* ---------------------------------------------------------------- */
  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError('');

    try {
      let classesToProcess: { classObj: Class; students: any[]; subjects: Subject[] }[] = [];

      if (downloadClass) {
        const [studRes, subRes] = await Promise.all([
          MarksAPI.getClassStudents(downloadClass),
          MarksAPI.getClassSubjects(downloadClass),
        ]);
        const cls = dropdownData?.classes.find(c => c.id === downloadClass);
        if (cls) {
          classesToProcess.push({
            classObj: cls,
            students: studRes.students ?? [],
            subjects: subRes.subjects ?? [],
          });
        }
      } else {
        for (const cls of dropdownData?.classes ?? []) {
          try {
            const [studRes, subRes] = await Promise.all([
              MarksAPI.getClassStudents(cls.id),
              MarksAPI.getClassSubjects(cls.id),
            ]);
            if ((studRes.students ?? []).length > 0) {
              classesToProcess.push({
                classObj: cls,
                students: studRes.students ?? [],
                subjects: subRes.subjects ?? [],
              });
            }
          } catch { /* skip */ }
        }
      }

      if (classesToProcess.length === 0) {
        setError('No students found for the selected class(es).');
        setDownloading(false);
        return;
      }

      const wb = XLSX.utils.book_new();

      for (const { classObj, students, subjects } of classesToProcess) {
        const headers = ['Adm No', 'Name', ...subjects.map(s => s.subject_name)];
        const rows = students.map((stu: any) => [
          stu.admission_number || '',
          stu.full_name || '',
          ...subjects.map(() => null),
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        ws['!cols'] = [
          { wch: 16 },
          { wch: 30 },
          ...subjects.map(() => ({ wch: 14 })),
        ];

        let sheetName = classObj.class_name.substring(0, 31);
        let counter = 1;
        while (wb.SheetNames.includes(sheetName)) {
          const suffix = ` (${counter})`;
          sheetName = classObj.class_name.substring(0, 31 - suffix.length) + suffix;
          counter++;
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      const filename = downloadClass
        ? `Marks_Template_${classesToProcess[0].classObj.class_name}.xlsx`
        : 'Marks_Template_All_Classes.xlsx';

      XLSX.writeFile(wb, filename);
      setSuccess('Template downloaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Parse uploaded XLSX — store per-sheet AND flat merged             */
  /* ---------------------------------------------------------------- */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setParsedSheets([]);
    setParsedRowsFlat([]);
    setSubjectHeadersFlat([]);
    setMatchedGroups([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheets: ParsedSheet[] = [];
        const flatRows: ParsedRow[] = [];
        const flatSubjectHeaders = new Set<string>();

        for (const sheetName of workbook.SheetNames) {
          const ws = workbook.Sheets[sheetName];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
          if (jsonRows.length === 0) continue;

          const keys = Object.keys(jsonRows[0]);
          const admColKey = keys.find(k =>
            /adm|admission|adm.no|admission.no|admission.number/i.test(k)
          ) || keys[0];
          const nameColKey = keys.find(k =>
            /^name$|full.?name|student.?name/i.test(k)
          ) || keys[1];

          const subjectKeys = keys.filter(k => k !== admColKey && k !== nameColKey);
          subjectKeys.forEach(k => flatSubjectHeaders.add(k));

          const sheetRows: ParsedRow[] = [];

          for (const row of jsonRows) {
            const admNo = row[admColKey];
            if (!admNo && admNo !== 0) continue;
            const admStr = String(admNo).trim();
            if (!admStr) continue;

            const marks: Record<string, number | null> = {};
            for (const sk of subjectKeys) {
              const val = row[sk];
              if (val === null || val === undefined || val === '' || val === '-') {
                marks[sk] = null;
              } else {
                const num = Number(val);
                marks[sk] = isNaN(num) ? null : num;
              }
            }

            sheetRows.push({
              admission_number: admStr,
              full_name: row[nameColKey] ? String(row[nameColKey]).trim() : '',
              marks,
            });

            // Also merge into flat list
            const existing = flatRows.find(r => r.admission_number === admStr);
            if (existing) {
              Object.entries(marks).forEach(([k, v]) => {
                if (v !== null) existing.marks[k] = v;
              });
            } else {
              flatRows.push({
                admission_number: admStr,
                full_name: row[nameColKey] ? String(row[nameColKey]).trim() : '',
                marks: { ...marks },
              });
            }
          }

          if (sheetRows.length > 0) {
            sheets.push({ sheetName, rows: sheetRows, subjectHeaders: subjectKeys });
          }
        }

        if (flatRows.length === 0) {
          setError('No valid data rows found in the uploaded file.');
          return;
        }

        setParsedSheets(sheets);
        setParsedRowsFlat(flatRows);
        setSubjectHeadersFlat(Array.from(flatSubjectHeaders));
      } catch (err: any) {
        setError('Failed to parse Excel file: ' + (err.message || err));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  /* ---------------------------------------------------------------- */
  /*  Helper: build a ClassMatchGroup                                  */
  /* ---------------------------------------------------------------- */
  const buildMatchGroup = (
    classId: string,
    className: string,
    subjects: Subject[],
    students: any[],
    rows: ParsedRow[],
  ): ClassMatchGroup => {
    const subjectMap: Record<string, string> = {};
    for (const sub of subjects) {
      subjectMap[sub.subject_name.toLowerCase()] = sub.id;
      if (sub.subject_code) subjectMap[sub.subject_code.toLowerCase()] = sub.id;
    }

    const studentMap: Record<string, any> = {};
    for (const stu of students) {
      studentMap[String(stu.admission_number).trim().toLowerCase()] = stu;
    }

    const matched: MatchedStudent[] = rows.map(row => {
      const student = studentMap[row.admission_number.toLowerCase()];
      const mappedMarks: Record<string, number | null> = {};
      for (const [header, value] of Object.entries(row.marks)) {
        const subId = subjectMap[header.toLowerCase()];
        if (subId) {
          mappedMarks[subId] = value;
        } else {
          mappedMarks[`_unmatched_${header}`] = value;
        }
      }
      return {
        student_id: student?.id || '',
        admission_number: row.admission_number,
        full_name: student?.full_name || row.full_name,
        marks: mappedMarks,
        matched: !!student,
      };
    });

    const allKeys = new Set<string>();
    matched.forEach(s => Object.keys(s.marks).forEach(k => allKeys.add(k)));

    return {
      class_id: classId,
      class_name: className,
      subjects,
      students: matched,
      allSubjectKeys: Array.from(allKeys),
    };
  };

  /* ---------------------------------------------------------------- */
  /*  Proceed to preview                                               */
  /* ---------------------------------------------------------------- */
  const handleProceedToPreview = async () => {
    setError('');

    if (!selectedClass) {
      setError('Please select a class.');
      return;
    }
    if (!examType) {
      setError('Please select an exam type.');
      return;
    }
    if (!term) {
      setError('Please select a term.');
      return;
    }
    if (!totalMarks) {
      setError('Please enter total marks.');
      return;
    }
    if (parsedSheets.length === 0 && parsedRowsFlat.length === 0) {
      setError('Please upload a file first.');
      return;
    }

    if (isAllClasses) {
      // --- ALL CLASSES MODE ---
      setLoadingClass(true);
      try {
        const classes = dropdownData?.classes ?? [];

        // Build lookup: lowercase class name / code → Class
        const classNameMap: Record<string, Class> = {};
        for (const cls of classes) {
          classNameMap[cls.class_name.toLowerCase()] = cls;
          if (cls.class_code) classNameMap[cls.class_code.toLowerCase()] = cls;
        }

        const groups: ClassMatchGroup[] = [];
        const unmatchedSheets: string[] = [];

        for (const sheet of parsedSheets) {
          // Try exact match, then partial / includes
          const sheetLower = sheet.sheetName.trim().toLowerCase();
          const cls =
            classNameMap[sheetLower] ||
            classes.find(c =>
              c.class_name.toLowerCase() === sheetLower ||
              c.class_code.toLowerCase() === sheetLower ||
              sheetLower.includes(c.class_name.toLowerCase()) ||
              c.class_name.toLowerCase().includes(sheetLower)
            );

          if (!cls) {
            unmatchedSheets.push(sheet.sheetName);
            continue;
          }

          // Fetch students & subjects for this class
          const [studRes, subRes] = await Promise.all([
            MarksAPI.getClassStudents(cls.id),
            MarksAPI.getClassSubjects(cls.id),
          ]);

          groups.push(
            buildMatchGroup(cls.id, cls.class_name, subRes.subjects ?? [], studRes.students ?? [], sheet.rows)
          );
        }

        if (groups.length === 0) {
          setError(
            'No worksheets could be matched to classes. ' +
            'Make sure worksheet names match class names.\n' +
            `Unmatched sheets: ${unmatchedSheets.join(', ')}`
          );
          setLoadingClass(false);
          return;
        }

        if (unmatchedSheets.length > 0) {
          setError(`Some worksheets were skipped (no matching class): ${unmatchedSheets.join(', ')}`);
        }

        setMatchedGroups(groups);
        setStep('preview');
      } catch (err: any) {
        setError('Failed to process classes: ' + (err.message || err));
      } finally {
        setLoadingClass(false);
      }
    } else {
      // --- SINGLE CLASS MODE ---
      const group = buildMatchGroup(
        selectedClass,
        dropdownData?.classes.find(c => c.id === selectedClass)?.class_name || '',
        classSubjects,
        classStudents,
        parsedRowsFlat,
      );
      setMatchedGroups([group]);
      setStep('preview');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Submit all groups                                                 */
  /* ---------------------------------------------------------------- */
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    setSubmissionProgress('');

    try {
      let totalSuccessful = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];
      const allSkipped: string[] = [];

      for (let gi = 0; gi < matchedGroups.length; gi++) {
        const group = matchedGroups[gi];
        setSubmissionProgress(`Processing ${group.class_name} (${gi + 1}/${matchedGroups.length})...`);

        const subjectGroups: Record<string, { student_id: string; marks: number }[]> = {};
        for (const stu of group.students) {
          if (!stu.matched) continue;
          for (const [key, val] of Object.entries(stu.marks)) {
            if (key.startsWith('_unmatched_')) continue;
            if (val === null || val === undefined) continue;
            if (totalMarks && val > Number(totalMarks)) continue;
            if (!subjectGroups[key]) subjectGroups[key] = [];
            subjectGroups[key].push({ student_id: stu.student_id, marks: val });
          }
        }

        for (const subjectId of Object.keys(subjectGroups)) {
          const results = subjectGroups[subjectId];
          if (results.length === 0) continue;

          const subjectName = group.subjects.find(s => s.id === subjectId)?.subject_name || subjectId;
          const label = `${group.class_name} → ${subjectName}`;

          try {
            const response = await MarksAPI.bulkInput({
              class_id: group.class_id,
              subject_id: subjectId,
              exam_type: examType,
              term,
              total_marks: Number(totalMarks),
              academic_year: academicYear,
              results,
            });

            totalSuccessful += response.successful_records || 0;
            totalSkipped += response.skipped_records || 0;
            totalFailed += response.failed_records || 0;
            if (response.skipped_students?.length) {
              allSkipped.push(`${label}: ${response.skipped_students.join(', ')}`);
            }
            if (response.errors?.length) {
              allErrors.push(`${label}: ${response.errors.join(', ')}`);
            }
          } catch (err: any) {
            if (err.response?.status === 409) {
              totalSkipped += results.length;
              allSkipped.push(`${label}: All students already have marks`);
            } else {
              totalFailed += results.length;
              allErrors.push(`${label}: ${err.response?.data?.error || err.message}`);
            }
          }
        }
      }

      let msg = `Upload complete: ${totalSuccessful} marks saved`;
      if (totalSkipped > 0) msg += `, ${totalSkipped} skipped (already exist)`;
      if (totalFailed > 0) msg += `, ${totalFailed} failed`;
      setSuccess(msg);
      setSubmissionProgress('');

      if (allSkipped.length > 0) console.info('Skipped details:', allSkipped);
      if (allErrors.length > 0) setError(allErrors.join('\n'));

      if (totalSuccessful > 0) {
        setTimeout(() => onClose(), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
      setSubmissionProgress('');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Derived helpers                                                  */
  /* ---------------------------------------------------------------- */
  const totalMatched = matchedGroups.reduce((sum, g) => sum + g.students.filter(s => s.matched).length, 0);
  const totalUnmatched = matchedGroups.reduce((sum, g) => sum + g.students.filter(s => !s.matched).length, 0);
  const totalSubjectsMatched = matchedGroups.reduce(
    (sum, g) => sum + g.allSubjectKeys.filter(k => !k.startsWith('_unmatched_')).length, 0
  );

  const getSubjectNameForGroup = (group: ClassMatchGroup, key: string): string => {
    if (key.startsWith('_unmatched_')) return key.replace('_unmatched_', '') + ' ⚠️';
    return group.subjects.find(s => s.id === key)?.subject_name || key;
  };

  const totalParsedRows = parsedSheets.reduce((s, sh) => s + sh.rows.length, 0) || parsedRowsFlat.length;
  const canPreview = !!selectedClass && !!examType && !!term && !!totalMarks && totalParsedRows > 0;

  if (!open) return null;

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {step === 'config' ? 'Upload Marks from Excel' : 'Preview & Submit'}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {step === 'config'
                  ? 'Download a template, fill in marks, then upload'
                  : `${matchedGroups.length} class(es) · ${totalMatched} matched, ${totalUnmatched} unmatched`}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700 whitespace-pre-line">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {step === 'config' && (
              <>
                {/* ========== DOWNLOAD TEMPLATE ========== */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Step 1: Download Template
                  </h4>
                  <p className="text-xs text-gray-500">
                    Download an Excel template with student Adm No, Name, and subject columns.
                    Select a class for a single sheet or leave blank for all classes (separate worksheets).
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={downloadClass}
                      onChange={e => setDownloadClass(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">All Classes</option>
                      {dropdownData?.classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      disabled={downloading}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {downloading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download XLSX
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ========== UPLOAD / CONFIG ========== */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Step 2: Configure & Upload
                  </h4>

                  {/* Class selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedClass}
                      onChange={e => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Class</option>
                      <option value={ALL_CLASSES}>📋 All Classes (match worksheets to classes)</option>
                      {dropdownData?.classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name} ({c.class_code})</option>
                      ))}
                    </select>
                    {loadingClass && (
                      <p className="text-xs text-indigo-500 mt-1 animate-pulse">Loading class data...</p>
                    )}
                    {selectedClass && selectedClass !== ALL_CLASSES && !loadingClass && (
                      <p className="text-xs text-gray-500 mt-1">
                        {classStudents.length} students · {classSubjects.length} subjects
                      </p>
                    )}
                    {isAllClasses && (
                      <p className="text-xs text-indigo-600 mt-1">
                        Each worksheet name must match a class name. All matching worksheets will be processed.
                      </p>
                    )}
                  </div>

                  {/* Exam details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exam Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={examType}
                        onChange={e => setExamType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select</option>
                        {dropdownData?.exam_types.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Term <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select</option>
                        {dropdownData?.terms.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total Marks <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalMarks}
                        onChange={e => setTotalMarks(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Academic Year
                      </label>
                      <select
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        {academicYearOptions.map(y => (
                          <option key={y} value={y.toString()}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Excel File <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {fileName ? (
                        <div>
                          <svg className="mx-auto h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="mt-2 text-sm font-medium text-gray-900">{fileName}</p>
                          <p className="text-xs text-gray-500">
                            {parsedSheets.length} worksheet(s) · {totalParsedRows} student rows · {subjectHeadersFlat.length} subject columns
                          </p>
                          {parsedSheets.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Sheets: {parsedSheets.map(s => s.sheetName).join(', ')}
                            </p>
                          )}
                          <p className="text-xs text-indigo-600 mt-1">Click to change file</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">.xlsx or .xls files</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ========== PREVIEW ========== */}
            {step === 'preview' && (
              <div className="space-y-6">
                {/* Top summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{matchedGroups.length}</p>
                    <p className="text-xs text-indigo-600">Class(es)</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{totalMatched}</p>
                    <p className="text-xs text-green-600">Matched</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{totalUnmatched}</p>
                    <p className="text-xs text-red-600">Unmatched</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{totalSubjectsMatched}</p>
                    <p className="text-xs text-blue-600">Subjects</p>
                  </div>
                </div>

                {totalUnmatched > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm text-amber-800">
                      <strong>{totalUnmatched}</strong> admission number(s) could not be matched.
                      These rows will be skipped during submission.
                    </p>
                  </div>
                )}

                {/* Per-class groups */}
                {matchedGroups.map((group, gi) => {
                  const groupMatched = group.students.filter(s => s.matched).length;
                  const groupUnmatched = group.students.filter(s => !s.matched).length;
                  const unmatchedSubKeys = group.allSubjectKeys.filter(k => k.startsWith('_unmatched_'));

                  return (
                    <div key={gi} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Class header */}
                      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">
                          {group.class_name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-700">{groupMatched} matched</span>
                          {groupUnmatched > 0 && (
                            <span className="text-red-600">{groupUnmatched} unmatched</span>
                          )}
                          <span className="text-blue-600">
                            {group.allSubjectKeys.filter(k => !k.startsWith('_unmatched_')).length} subjects
                          </span>
                        </div>
                      </div>

                      {unmatchedSubKeys.length > 0 && (
                        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-700">
                          Unmatched subject columns: {unmatchedSubKeys.map(k => k.replace('_unmatched_', '')).join(', ')}
                        </div>
                      )}

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adm No</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                              {group.allSubjectKeys.map(k => (
                                <th key={k} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                  {getSubjectNameForGroup(group, k)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {group.students.map((stu, idx) => (
                              <tr key={idx} className={stu.matched ? '' : 'bg-red-50'}>
                                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium text-gray-900">{stu.admission_number}</td>
                                <td className="px-3 py-2 text-gray-700">{stu.full_name}</td>
                                <td className="px-3 py-2 text-center">
                                  {stu.matched ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      ✗
                                    </span>
                                  )}
                                </td>
                                {group.allSubjectKeys.map(k => (
                                  <td key={k} className={`px-3 py-2 text-center ${k.startsWith('_unmatched_') ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {stu.marks[k] !== null && stu.marks[k] !== undefined ? stu.marks[k] : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
            {step === 'preview' ? (
              <button
                type="button"
                onClick={() => { setStep('config'); setMatchedGroups([]); }}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {submissionProgress && (
                <span className="text-xs text-indigo-600 animate-pulse">{submissionProgress}</span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>

              {step === 'config' && (
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  disabled={!canPreview || loadingClass}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {loadingClass ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Preview →'
                  )}
                </button>
              )}

              {step === 'preview' && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || totalMatched === 0}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    `Submit ${totalMatched} Student(s) across ${matchedGroups.length} Class(es)`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadMarksModal;
