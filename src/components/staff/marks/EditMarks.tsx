import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MarksAPI } from '../../../services/baseUrl';

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

interface ExistingResult {
  id: number;
  student_name: string;
  student_admission_number: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  student: string;
}

const EditMarks: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('class_id') || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get('subject_id') || '');
  const [examType, setExamType] = useState<string>(searchParams.get('exam_type') || '');
  const [term, setTerm] = useState<string>(searchParams.get('term') || '');
  const [academicYear, setAcademicYear] = useState<string>(searchParams.get('academic_year') || '');

  // Available subjects for selected class
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // Results data
  const [results, setResults] = useState<ExistingResult[]>([]);
  const [editedMarks, setEditedMarks] = useState<{ [resultId: number]: number }>({});
  const [originalMarks, setOriginalMarks] = useState<{ [resultId: number]: number }>({});

  // Available academic years from actual data
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    fetchDropdownData();
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects();
    } else {
      setAvailableSubjects([]);
    }
  }, [selectedClass]);

  // Auto-fetch results when all filters are set (e.g., coming from ViewResults with query params)
  const autoFetched = React.useRef(false);
  useEffect(() => {
    if (!autoFetched.current && selectedClass && selectedSubject && examType && term && academicYear && dropdownData) {
      autoFetched.current = true;
      fetchResults();
    }
  }, [selectedClass, selectedSubject, examType, term, academicYear, dropdownData]);

  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const data = await MarksAPI.getDropdownData();
      setDropdownData(data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      setError('Failed to fetch dropdown data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    try {
      const data = await MarksAPI.getResults({ page_size: '1000' });
      const resultsList = data.results || data;
      const years = [...new Set(resultsList.map((r: any) => r.academic_year))].filter(Boolean) as string[];
      years.sort().reverse();
      setAvailableYears(years);
      // If no year selected yet but years available, pick the first
      if (!academicYear && years.length > 0) {
        setAcademicYear(years[0]);
      }
    } catch (err) {
      console.error('Error fetching available years:', err);
    }
  };

  const fetchClassSubjects = async () => {
    try {
      const data = await MarksAPI.getClassSubjects(selectedClass);
      setAvailableSubjects(data.subjects);
    } catch (err) {
      console.error('Error fetching subjects for class:', err);
    }
  };

  const fetchResults = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !examType || !term || !academicYear) {
      setError('Please select all filters before loading results');
      return;
    }

    setFetchingResults(true);
    setError('');
    setResults([]);
    setEditedMarks({});
    setOriginalMarks({});

    try {
      const params: Record<string, string> = {
        class_id: selectedClass,
        subject_id: selectedSubject,
        exam_type: examType,
        term: term,
        academic_year: academicYear,
      };

      const data = await MarksAPI.getResults(params);
      const resultsList: ExistingResult[] = data.results || data;

      if (resultsList.length === 0) {
        setError('No results found for the selected filters. Try different filter options.');
        setFetchingResults(false);
        return;
      }

      setResults(resultsList);

      // Initialize marks
      const marks: { [id: number]: number } = {};
      const originals: { [id: number]: number } = {};
      resultsList.forEach((r) => {
        marks[r.id] = r.marks_obtained;
        originals[r.id] = r.marks_obtained;
      });
      setEditedMarks(marks);
      setOriginalMarks(originals);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to fetch results');
    } finally {
      setFetchingResults(false);
    }
  }, [selectedClass, selectedSubject, examType, term, academicYear]);

  const handleMarkChange = (resultId: number, marks: number, totalMarks: number) => {
    if (marks < 0) return;
    if (marks > totalMarks) {
      setError(`Marks cannot exceed total marks (${totalMarks})`);
      return;
    }
    setError('');
    setEditedMarks((prev) => ({
      ...prev,
      [resultId]: marks,
    }));
  };

  const calculatePercentage = (marks: number, totalMarks: number): string => {
    if (!totalMarks || totalMarks === 0) return '0.0%';
    return `${((marks / totalMarks) * 100).toFixed(1)}%`;
  };

  const getChangedResults = () => {
    return results.filter((r) => editedMarks[r.id] !== originalMarks[r.id]);
  };

  const handleSave = async () => {
    const changed = getChangedResults();
    if (changed.length === 0) {
      setError('No changes to save');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const result of changed) {
      try {
        await MarksAPI.updateResult(result.id.toString(), {
          marks_obtained: editedMarks[result.id],
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push(`Failed to update ${result.student_name}: ${err?.response?.data?.error || 'Unknown error'}`);
      }
    }

    if (successCount > 0) {
      setSuccess(`Successfully updated ${successCount} result${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      setError(errors.join('. '));
    }

    setSaving(false);
    if (successCount > 0 && failCount === 0) {
      // Redirect to view results after successful save
      setTimeout(() => navigate('/view-results'), 1500);
    }
  };

  const handleReset = () => {
    setEditedMarks({ ...originalMarks });
    setError('');
  };

  const changedCount = getChangedResults().length;

  const getSelectedClassName = (): string => {
    const cls = dropdownData?.classes.find((c) => c.id === selectedClass);
    return cls ? cls.class_name : '';
  };

  const getSelectedSubjectName = (): string => {
    const subj = availableSubjects.find((s) => s.id === selectedSubject) || 
                 dropdownData?.subjects.find((s) => s.id === selectedSubject);
    return subj ? subj.subject_name : '';
  };

  const getExamTypeLabel = (): string => {
    const et = dropdownData?.exam_types.find((e) => e.value === examType);
    return et ? et.label : examType;
  };

  const getTermLabel = (): string => {
    const t = dropdownData?.terms.find((t) => t.value === term);
    return t ? t.label : `Term ${term}`;
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/view-results')}
            className="mb-4 text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Results
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Student Marks</h1>
            <p className="mt-2 text-gray-600">Update examination marks for students</p>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-green-700">{success}</div>
            </div>
          </div>
        )}

        {/* Selection Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Results to Edit</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSubject('');
                  setResults([]);
                  setEditedMarks({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Class</option>
                {dropdownData?.classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.class_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setResults([]);
                  setEditedMarks({});
                }}
                disabled={!selectedClass}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!selectedClass ? 'Select a class first' : 'Select Subject'}
                </option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name} ({subject.subject_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type <span className="text-red-500">*</span>
              </label>
              <select
                value={examType}
                onChange={(e) => {
                  setExamType(e.target.value);
                  setResults([]);
                  setEditedMarks({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Exam Type</option>
                {dropdownData?.exam_types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setResults([]);
                  setEditedMarks({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Term</option>
                {dropdownData?.terms.map((termOption) => (
                  <option key={termOption.value} value={termOption.value}>
                    {termOption.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                value={academicYear}
                onChange={(e) => {
                  setAcademicYear(e.target.value);
                  setResults([]);
                  setEditedMarks({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Year</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={fetchResults}
                disabled={fetchingResults || !selectedClass || !selectedSubject || !examType || !term || !academicYear}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {fetchingResults ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Load Results'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Edit Section */}
        {results.length > 0 && (
          <>
            {/* Info Bar */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-indigo-800">
                    <span className="font-semibold">{getSelectedClassName()}</span>
                    {' — '}
                    <span className="font-medium">{getSelectedSubjectName()}</span>
                    {' — '}
                    <span>{getExamTypeLabel()}, {getTermLabel()}, {academicYear}</span>
                  </div>
                </div>
                <div className="text-sm text-indigo-700 font-medium">
                  {results.length} student{results.length !== 1 ? 's' : ''}
                  {changedCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {changedCount} changed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Marks Table / Cards */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Edit Marks ({results.length} students)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Modify marks and click Save to update. Total marks: {results[0]?.total_marks || 'N/A'}
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks Obtained
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result, index) => {
                      const isChanged = editedMarks[result.id] !== originalMarks[result.id];
                      const currentMarks = editedMarks[result.id] ?? result.marks_obtained;
                      const currentPct = calculatePercentage(currentMarks, result.total_marks);
                      return (
                        <tr key={result.id} className={`hover:bg-gray-50 ${isChanged ? 'bg-amber-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {result.student_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.student_admission_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max={result.total_marks}
                                value={currentMarks}
                                onChange={(e) =>
                                  handleMarkChange(result.id, parseFloat(e.target.value) || 0, result.total_marks)
                                }
                                className={`w-24 px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                  isChanged ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                                }`}
                              />
                              <span className="text-sm text-gray-500">/ {result.total_marks}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{currentPct}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isChanged ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isChanged ? '—' : result.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {results.map((result, index) => {
                  const isChanged = editedMarks[result.id] !== originalMarks[result.id];
                  const currentMarks = editedMarks[result.id] ?? result.marks_obtained;
                  const currentPct = calculatePercentage(currentMarks, result.total_marks);
                  return (
                    <div key={result.id} className={`p-4 transition-colors ${isChanged ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'}`}>
                      {/* Student Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {result.student_name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {result.student_admission_number}
                            </p>
                          </div>
                        </div>
                        {isChanged && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Changed
                          </span>
                        )}
                        {!isChanged && (
                          <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800`}>
                            {result.grade}
                          </span>
                        )}
                      </div>

                      {/* Marks Input Section */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Marks Obtained
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max={result.total_marks}
                                value={currentMarks}
                                onChange={(e) =>
                                  handleMarkChange(result.id, parseFloat(e.target.value) || 0, result.total_marks)
                                }
                                className={`w-20 px-3 py-2 text-center border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium ${
                                  isChanged ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                                }`}
                              />
                              <span className="text-sm text-gray-500 font-medium">
                                / {result.total_marks}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Percentage
                            </label>
                            <span className="text-lg font-bold text-indigo-600">
                              {currentPct}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${isChanged ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${Math.min((currentMarks / result.total_marks) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="text-sm text-gray-600">
                {changedCount > 0 ? (
                  <span className="text-amber-700 font-medium">
                    {changedCount} mark{changedCount !== 1 ? 's' : ''} modified
                  </span>
                ) : (
                  <span>No changes yet</span>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={handleReset}
                  disabled={changedCount === 0}
                  className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reset Changes
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || changedCount === 0}
                  className={`px-6 py-3 border border-transparent text-base font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                    saving || changedCount === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    `Save Changes (${changedCount})`
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty state when no results loaded yet */}
        {!fetchingResults && results.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Select filters to load results</h3>
            <p className="mt-2 text-sm text-gray-500">
              Choose a class, subject, exam type, term, and academic year, then click "Load Results" to edit marks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditMarks;
