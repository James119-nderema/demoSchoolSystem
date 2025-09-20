import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarksAPI } from '../../../services/baseUrl';

interface Student {
  id: number;
  full_name: string;
  admission_number: string;
  current_class: string;
}

interface Class {
  id: number;
  class_name: string;
  class_code: string;
}

interface Subject {
  id: number;
  subject_name: string;
  subject_code: string;
}

interface DropdownData {
  classes: Class[];
  subjects: Subject[];
  exam_types: { value: string; label: string }[];
  terms: { value: string; label: string }[];
}

// interface StudentMark {
//   student_id: number;
//   marks: number;
// }

const InputMarks: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dropdownData, setDropdownData] = useState<DropdownData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentMarks, setStudentMarks] = useState<{ [key: number]: number }>({});
  
  // Form state
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [examType, setExamType] = useState<string>('');
  const [term, setTerm] = useState<string>('');
  const [totalMarks, setTotalMarks] = useState<number | ''>('');
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
    } else {
      setStudents([]);
      setStudentMarks({});
    }
  }, [selectedClass]);

  const fetchDropdownData = async () => {
    try {
      const data = await MarksAPI.getDropdownData();
      setDropdownData(data);
    } catch (err) {
      setError('Failed to fetch dropdown data');
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const data = await MarksAPI.getClassStudents(selectedClass);
      setStudents(data.students);
      // Initialize marks for all students
      const initialMarks: { [key: number]: number } = {};
      data.students.forEach((student: Student) => {
        initialMarks[student.id] = 0;
      });
      setStudentMarks(initialMarks);
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  const handleMarkChange = (studentId: number, marks: number) => {
    if (marks < 0) return; // Don't allow negative numbers
    
    if (totalMarks && marks > totalMarks) {
      setError(`Marks cannot exceed total marks (${totalMarks})`);
      return;
    }
    
    setError(''); // Clear error if marks are valid
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: marks
    }));
  };

  const calculatePercentage = (marks: number): string => {
    if (!totalMarks || totalMarks === 0) return '0%';
    return `${((marks / totalMarks) * 100).toFixed(1)}%`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!selectedClass || !selectedSubject || !examType || !term || !totalMarks) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Prepare results data
      const results = Object.entries(studentMarks).map(([studentId, marks]) => ({
        student_id: parseInt(studentId),
        marks: marks
      }));

      const submitData = {
        class_id: selectedClass,
        subject_id: selectedSubject,
        exam_type: examType,
        term: term,
        total_marks: totalMarks,
        academic_year: academicYear,
        results: results
      };

      const data = await MarksAPI.bulkInput(submitData);
      setSuccess(`Successfully processed ${data.successful_records} out of ${data.total_records} records`);
      if (data.failed_records > 0) {
        setError(`${data.failed_records} records failed: ${data.errors.join(', ')}`);
      }
      
      // Reset form
      setSelectedClass('');
      setSelectedSubject('');
      setExamType('');
      setTerm('');
      setTotalMarks('');
      setStudents([]);
      setStudentMarks({});
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const allMarksEntered = () => {
    return students.length > 0 && Object.keys(studentMarks).length === students.length;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/staff/results')}
            className="mb-4 text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Results
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Input Student Marks</h1>
          <p className="mt-2 text-gray-600">Enter examination marks for students in bulk</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Selection Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Exam Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Class</option>
                  {dropdownData?.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name} ({cls.class_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {dropdownData?.subjects.map((subject) => (
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
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
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
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select Term</option>
                  {dropdownData?.terms.map((termOption) => (
                    <option key={termOption.value} value={termOption.value}>
                      {termOption.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Marks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 100"
                  required
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="2024-2025"
                />
              </div>
            </div>
          </div>

          {/* Students Marks Table */}
          {students.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Student Marks ({students.length} students)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Enter marks for each student. Maximum marks: {totalMarks || 'Not set'}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Class: {student.current_class}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.admission_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max={totalMarks || undefined}
                            value={studentMarks[student.id] || ''}
                            onChange={(e) => handleMarkChange(student.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0"
                          />
                          {totalMarks && (
                            <span className="ml-2 text-sm text-gray-500">
                              / {totalMarks}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {calculatePercentage(studentMarks[student.id] || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {students.length > 0 && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !allMarksEntered()}
                className={`px-6 py-3 border border-transparent text-base font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading || !allMarksEntered()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Marks'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InputMarks;
