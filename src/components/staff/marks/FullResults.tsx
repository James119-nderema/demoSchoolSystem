import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { APIService } from '../../../services/baseUrl';
import { usePermissions } from '../../../hooks/usePermissions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubjectMark {
  marks: number;
  total_marks: number;
  percentage: number;
  grade: string;
}

interface Student {
  id: string;
  name: string;
  admission_number: string;
  subject_marks: { [key: string]: SubjectMark | null };
  total_marks: number;
  average: number;
  subjects_count: number;
  position: number;
}

interface ClassData {
  class_id: string;
  class_name: string;
  class_code: string;
  subjects: Subject[];
  students: Student[];
  total_students: number;
}

interface FiltersData {
  terms: string[];
  academic_years: string[];
  exam_types: string[];
  classes: { id: string; name: string }[];
}

interface FullResultsResponse {
  classes: ClassData[];
  filters: FiltersData;
  current_filters: {
    term: string;
    academic_year: string;
    exam_type: string;
    class_id: string;
  };
  user_role: string;
  user_type?: string;
  can_download: boolean;
}

const FullResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const permissions = usePermissions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<FullResultsResponse | null>(null);
  
  // Filter states
  const selectedTerm = searchParams.get('term') || '';
  const selectedAcademicYear = searchParams.get('academic_year') || '';
  const selectedExamType = searchParams.get('exam_type') || '';
  const selectedClass = searchParams.get('class_id') || '';
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  
  // Download state
  const [downloading, setDownloading] = useState(false);

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!data || !searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase().trim();
    
    return {
      ...data,
      classes: data.classes.map(classData => ({
        ...classData,
        students: classData.students.filter(student => 
          student.name.toLowerCase().includes(query) ||
          student.admission_number.toLowerCase().includes(query)
        ),
        total_students: classData.students.filter(student => 
          student.name.toLowerCase().includes(query) ||
          student.admission_number.toLowerCase().includes(query)
        ).length
      })).filter(classData => classData.students.length > 0)
    };
  }, [data, searchQuery]);

  const fetchFullResults = async (override?: {
    term?: string;
    academic_year?: string;
    exam_type?: string;
    class_id?: string;
  }) => {
    try {
      setLoading(true);
      setError('');
      
      const params: Record<string, string> = {};
      const term = override?.term ?? selectedTerm;
      const academicYear = override?.academic_year ?? selectedAcademicYear;
      const examType = override?.exam_type ?? selectedExamType;
      const classId = override?.class_id ?? selectedClass;

      if (term) params.term = term;
      if (academicYear) params.academic_year = academicYear;
      if (examType) params.exam_type = examType;
      if (classId) params.class_id = classId;
      
      const response = await APIService.get<FullResultsResponse>(
        '/api/input-marks/full-results/',
        params,
        'staff'
      );
      
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullResults();
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (selectedTerm) next.set('term', selectedTerm);
    if (selectedAcademicYear) next.set('academic_year', selectedAcademicYear);
    if (selectedExamType) next.set('exam_type', selectedExamType);
    if (selectedClass) next.set('class_id', selectedClass);
    if (searchQuery) next.set('q', searchQuery);

    if (searchParams.toString() !== next.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    selectedTerm,
    selectedAcademicYear,
    selectedExamType,
    selectedClass,
    searchQuery,
    searchParams,
    setSearchParams,
  ]);

  const getExamTypeLabel = (examType: string): string => {
    const labels: { [key: string]: string } = {
      'exam_1': 'Exam 1',
      'exam_2': 'Exam 2',
      'exam_3': 'Exam 3',
    };
    return labels[examType] || examType;
  };

  const getTermLabel = (term: string): string => {
    const labels: { [key: string]: string } = {
      '1': 'Term 1',
      '2': 'Term 2',
      '3': 'Term 3',
    };
    return labels[term] || `Term ${term}`;
  };

  const handleDownloadPDF = async () => {
    if (!data || !data.can_download) return;
    
    setDownloading(true);
    
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Get school info from localStorage
      const staffInfo = localStorage.getItem('staff_info');
      let schoolName = 'School';
      if (staffInfo) {
        try {
          const info = JSON.parse(staffInfo);
          schoolName = info.school_name || 'School';
        } catch (e) {
          console.error('Error parsing staff info:', e);
        }
      }
      
      // Process each class on a separate page
      data.classes.forEach((classData, classIndex) => {
        if (classIndex > 0) {
          doc.addPage();
        }
        
        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName, pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(`Full Results - ${classData.class_name}`, pageWidth / 2, 22, { align: 'center' });
        
        // Filter info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let filterText = '';
        if (selectedTerm) filterText += `${getTermLabel(selectedTerm)} | `;
        if (selectedAcademicYear) filterText += `${selectedAcademicYear} | `;
        if (selectedExamType) filterText += getExamTypeLabel(selectedExamType);
        if (filterText) {
          doc.text(filterText.replace(/ \| $/, ''), pageWidth / 2, 28, { align: 'center' });
        }
        
        // Build table headers
        const headers = ['Pos', 'Adm No', 'Student Name'];
        classData.subjects.forEach(subject => {
          headers.push(subject.name.length > 10 ? subject.name.substring(0, 10) : subject.name);
        });
        headers.push('Total', 'Avg');
        
        // Build table data (already sorted by position/total marks from backend)
        const tableData = classData.students.map((student )=> {
          const row: (string | number)[] = [
            student.position,
            student.admission_number,
            student.name
          ];
          
          classData.subjects.forEach(subject => {
            const mark = student.subject_marks[subject.id];
            row.push(mark ? `${mark.grade} ${mark.marks}` : '-');
          });
          
          row.push(student.total_marks.toString());
          row.push(student.average.toFixed(1));
          
          return row;
        });
        
        // Add table
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: 35,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 7,
          },
          columnStyles: {
            0: { cellWidth: 10 }, // Pos
            1: { cellWidth: 20 }, // Adm No
            2: { cellWidth: 35 }, // Name
          },
          didDrawPage: (data: any) => {
            // Footer
            doc.setFontSize(8);
            doc.text(
              `Page ${data.pageNumber} | Generated on ${new Date().toLocaleDateString()}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' }
            );
          },
        });
      });
      
      // Generate filename
      const filename = `Full_Results_${selectedAcademicYear || 'All'}_${selectedTerm ? 'Term' + selectedTerm : 'AllTerms'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Check access - Director of Studies, Class Teacher, or Administrative Staff (including school admin)
  if (!permissions.canViewFullResults()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Director of Studies, Administrative Staff, and Class Teachers can access full results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Full Results</h1>
              <p className="mt-1 text-sm text-gray-500">
                View complete student results with all subjects
                {data?.user_role === 'CLASS_TEACHER' && ' (Your assigned class only)'}
              </p>
            </div>
            
            {/* Download Button - Only for Director of Studies */}
            {data?.can_download && (
              <button
                onClick={handleDownloadPDF}
                disabled={downloading || loading || !data?.classes?.length}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by admission number or student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-500">
                Showing results matching "{searchQuery}"
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">Loading results...</span>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && (!filteredData?.classes || filteredData.classes.length === 0) && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No students matching "${searchQuery}". Try a different search term.` 
                : 'No results match the selected filters. Try adjusting your filters.'}
            </p>
          </div>
        )}

        {/* Results Tables */}
        {!loading && filteredData?.classes && filteredData.classes.length > 0 && (
          <div className="space-y-8">
            {filteredData.classes.map((classData) => (
              <div key={classData.class_id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Class Header */}
                <div className="bg-indigo-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">{classData.class_name}</h2>
                    <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
                      {classData.total_students} Students
                    </span>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adm No</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Student Name</th>
                        {classData.subjects.map((subject) => (
                          <th key={subject.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title={subject.name}>
                            {subject.name.length > 10 ? subject.name.substring(0, 10) : subject.name}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">Total</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-indigo-50">Avg</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classData.students.map((student, index) => (
                        <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                              student.position <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {student.position}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{student.admission_number}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                          {classData.subjects.map((subject) => {
                            const mark = student.subject_marks[subject.id];
                            return (
                              <td key={subject.id} className="px-3 py-2 whitespace-nowrap text-center text-sm">
                                {mark ? (
                                  <span className={`font-medium ${
                                    mark.percentage >= 80 ? 'text-green-600' :
                                    mark.percentage >= 60 ? 'text-blue-600' :
                                    mark.percentage >= 40 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {mark.grade} {mark.marks}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-bold text-indigo-600 bg-indigo-50">
                            {student.total_marks}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium text-indigo-600 bg-indigo-50">
                            {student.average.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  <div className="divide-y divide-gray-200">
                    {classData.students.map((student) => (
                      <div key={student.id} className="p-4 hover:bg-gray-50">
                        {/* Student Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              student.position <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {student.position}
                            </span>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-xs text-gray-500">{student.admission_number}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">{student.total_marks}</div>
                            <div className="text-xs text-gray-500">Avg: {student.average.toFixed(1)}</div>
                          </div>
                        </div>
                        
                        {/* Subject Marks Grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                          {classData.subjects.map((subject) => {
                            const mark = student.subject_marks[subject.id];
                            return (
                              <div key={subject.id} className="bg-gray-50 rounded-lg p-2 text-center">
                                <div className="text-xs text-gray-500 truncate" title={subject.name}>
                                  {subject.name.length > 8 ? subject.name.substring(0, 8) : subject.name}
                                </div>
                                <div className={`text-sm font-semibold ${
                                  mark 
                                    ? mark.percentage >= 80 ? 'text-green-600' 
                                    : mark.percentage >= 60 ? 'text-blue-600' 
                                    : mark.percentage >= 40 ? 'text-yellow-600' 
                                    : 'text-red-600'
                                    : 'text-gray-400'
                                }`}>
                                  {mark ? `${mark.grade} ${mark.marks}` : '-'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FullResults;
