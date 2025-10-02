import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { APIService, API_ENDPOINTS } from '../../../../services/baseUrl';

interface Student {
  id: number;
  upi_no?: string;
  assessment_no?: string;
  surname: string;
  first_name: string;
  other_names?: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  birth_entry_no?: string;
  disability?: string;
  admission_number: string;
  class?: string;
  class_name?: string;
  student_class?: string;
  parent_guardian_name: string;
  parent_guardian_phone: string;
  parent_guardian_email?: string;
  address: string;
  status: string;
  date_added: string;
  date_updated: string;
  added_by: string;
  age: number;
  school_name: string;
}

interface Class {
  uuid: string;
  class_name: string;
  class_code?: string;
}

interface DownloadStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  allStudents: Student[];
  uniqueClasses?: string[]; // Make this optional since we'll fetch from API
}

interface ColumnOption {
  key: keyof Student;
  label: string;
  checked: boolean;
}

const DownloadStudentModal: React.FC<DownloadStudentModalProps> = ({
  isOpen,
  onClose,
  students,
  allStudents
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [allStudentsForDownload, setAllStudentsForDownload] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Define available columns for download - default to unselected
  const [columns, setColumns] = useState<ColumnOption[]>([
    { key: 'upi_no', label: 'UPI Number', checked: false },
    { key: 'first_name', label: 'First Name', checked: false },
    { key: 'surname', label: 'Surname', checked: false },
    { key: 'other_names', label: 'Other Names', checked: false },
    { key: 'admission_number', label: 'Admission Number', checked: false },
    { key: 'assessment_no', label: 'Assessment Number', checked: false },
    { key: 'birth_entry_no', label: 'Birth Entry Number', checked: false },
    { key: 'gender', label: 'Gender', checked: false },
    { key: 'date_of_birth', label: 'Date of Birth', checked: false },
    { key: 'class', label: 'Class', checked: false },
    { key: 'status', label: 'Status', checked: false },
    { key: 'parent_guardian_name', label: 'Parent/Guardian Name', checked: false },
    { key: 'parent_guardian_phone', label: 'Parent/Guardian Phone', checked: false },
    { key: 'parent_guardian_email', label: 'Parent/Guardian Email', checked: false },
    { key: 'address', label: 'Address', checked: false },
    { key: 'disability', label: 'Disability', checked: false }
  ]);

  // Fetch classes and students when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      fetchAllStudents();
    }
  }, [isOpen]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await APIService.get(API_ENDPOINTS.CLASSES, { page: '1', page_size: '100' }, 'school');
      
      console.log('Classes API response:', response);
      
      if (response.results) {
        setClasses(response.results);
        console.log('Set classes from results:', response.results.length);
        console.log('First class sample:', response.results[0]);
      } else if (Array.isArray(response)) {
        setClasses(response);
        console.log('Set classes from array:', response.length);
        console.log('First class sample:', response[0]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    try {
      let allStudentsArray: Student[] = [];
      let page = 1;
      let hasMore = true;
      
      // Fetch all pages of students
      while (hasMore) {
        const response = await APIService.get(API_ENDPOINTS.STUDENTS, { 
          page: page.toString(), 
          page_size: '100' // Use smaller page size but fetch all pages
        }, 'school');
        
        console.log(`Students API response page ${page}:`, response);
        
        if (response.results) {
          allStudentsArray = [...allStudentsArray, ...response.results];
          
          // Check if there are more pages
          hasMore = response.next !== null;
          page += 1;
          
          console.log(`Page ${page - 1}: Added ${response.results.length} students. Total: ${allStudentsArray.length}`);
        } else if (Array.isArray(response)) {
          allStudentsArray = response;
          hasMore = false;
          console.log('Set students from array:', response.length);
        } else {
          hasMore = false;
        }
        
        // Safety check to prevent infinite loops
        if (page > 50) {
          console.warn('Too many pages, stopping fetch');
          break;
        }
      }
      
      setAllStudentsForDownload(allStudentsArray);
      console.log('Total students fetched:', allStudentsArray.length);
      
      if (allStudentsArray.length > 0) {
        console.log('First student sample:', allStudentsArray[0]);
      }
      
    } catch (error) {
      console.error('Error fetching all students:', error);
      // Fallback to the students passed as props
      setAllStudentsForDownload(allStudents.length > 0 ? allStudents : students);
      console.log('Using fallback students:', allStudents.length > 0 ? allStudents.length : students.length);
      if (allStudents.length > 0) {
        console.log('First fallback student sample:', allStudents[0]);
      } else if (students.length > 0) {
        console.log('First fallback student sample:', students[0]);
      }
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleColumnToggle = (index: number) => {
    const updatedColumns = [...columns];
    updatedColumns[index].checked = !updatedColumns[index].checked;
    setColumns(updatedColumns);
  };

  const getFilteredStudents = () => {
    // Use the fetched students first, then fallback to props
    let studentsToUse = allStudentsForDownload.length > 0 
      ? allStudentsForDownload 
      : (allStudents.length > 0 ? allStudents : students);
    
    // If fetched students don't have class info, prefer prop students
    if (studentsToUse.length > 0 && !studentsToUse[0].class && !studentsToUse[0].class_name && !studentsToUse[0].student_class) {
      studentsToUse = allStudents.length > 0 ? allStudents : students;
    }
    
    console.log('Students to use:', studentsToUse.length);
    console.log('Selected class:', selectedClass);
    
    if (selectedClass === 'all') {
      return studentsToUse;
    }
    
    // Find the selected class object to get its name
    const selectedClassObj = classes.find(c => c.uuid === selectedClass);
    const selectedClassName = selectedClassObj ? selectedClassObj.class_name : selectedClass;
    
    console.log('Selected class name:', selectedClassName);
    
    // Filter by class name - handle different possible field names
    const filtered = studentsToUse.filter(student => {
      // Try different possible class field names
      const studentClass = student.class || student.class_name || student.student_class;
      console.log('Student class:', studentClass, 'Selected class name:', selectedClassName, 'Match:', studentClass === selectedClassName);
      return studentClass === selectedClassName;
    });
    
    console.log('Filtered students:', filtered.length);
    return filtered;
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const filteredStudents = getFilteredStudents();
      const selectedColumns = columns.filter(col => col.checked);
      
      if (selectedColumns.length === 0) {
        alert('Please select at least one column to include in the download.');
        setIsGenerating(false);
        return;
      }

      if (filteredStudents.length === 0) {
        alert('No students found for the selected criteria.');
        setIsGenerating(false);
        return;
      }

      const pdf = new jsPDF('landscape', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // PDF title
      const titleClassObj = classes.find(c => c.uuid === selectedClass);
      const titleClassName = titleClassObj ? titleClassObj.class_name : selectedClass;
      
      const title = selectedClass === 'all' 
        ? 'All Students Information' 
        : `${titleClassName} Students Information`;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, 40);
      
      // Date
      const currentDate = new Date().toLocaleDateString();
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${currentDate}`, 40, 60);
      
      // Prepare table headers
      const headers = selectedColumns.map(col => col.label);
      
      // Prepare table data
      const tableData = filteredStudents.map(student => {
        return selectedColumns.map(column => {
          let value;
          
          // Handle special case for class field
          if (column.key === 'class') {
            value = student.class || student.class_name || student.student_class;
          } else {
            value = student[column.key];
          }
          
          // Format specific fields
          if (column.key === 'date_of_birth' && value) {
            value = new Date(value as string).toLocaleDateString();
          } else if (value === null || value === undefined) {
            value = '';
          } else {
            value = String(value);
          }
          
          return value;
        });
      });
      
      console.log('Table data prepared:', {
        headers: headers,
        rowCount: tableData.length,
        columnCount: headers.length,
        sampleRow: tableData[0],
        selectedColumns: selectedColumns.map(col => col.key)
      });
      
      // Validate table data
      const invalidRows = tableData.filter(row => !Array.isArray(row) || row.length !== headers.length);
      if (invalidRows.length > 0) {
        console.error('Invalid table rows found:', invalidRows);
        throw new Error(`Found ${invalidRows.length} invalid table rows`);
      }
      
      // Generate table using manual approach (more reliable)
      try {
        console.log('Starting manual PDF table generation...');
        
        let currentY = 80;
        const rowHeight = 20;
        const maxColWidth = 120;
        const minColWidth = 60;
        const availableWidth = pageWidth - 80;
        const colWidth = Math.min(maxColWidth, Math.max(minColWidth, availableWidth / headers.length));
        
        // Draw headers
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(66, 139, 202);
        pdf.setTextColor(255, 255, 255);
        
        // Header background
        pdf.rect(40, currentY - 12, availableWidth, 18, 'F');
        
        headers.forEach((header, index) => {
          const xPos = 40 + (index * colWidth) + 5;
          pdf.text(header.substring(0, 15), xPos, currentY);
        });
        
        currentY += rowHeight;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        
        // Draw data rows
        tableData.forEach((row, rowIndex) => {
          if (currentY > pageHeight - 50) {
            pdf.addPage();
            currentY = 40;
          }
          
          // Alternate row colors
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(40, currentY - 12, availableWidth, 18, 'F');
          }
          
          row.forEach((cell, colIndex) => {
            const cellText = String(cell || '');
            const xPos = 40 + (colIndex * colWidth) + 5;
            const maxCellLength = Math.floor(colWidth / 6);
            const truncatedText = cellText.length > maxCellLength 
              ? cellText.substring(0, maxCellLength - 3) + '...'
              : cellText;
            pdf.text(truncatedText, xPos, currentY);
          });
          currentY += rowHeight;
        });
        
        // Add footer
        const totalPages = (pdf as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(
            `Page ${i} of ${totalPages} | Total Students: ${filteredStudents.length} | Generated: ${currentDate}`,
            40,
            pageHeight - 20
          );
        }
        
        console.log('Manual PDF table generated successfully');
        
      } catch (manualError: any) {
        console.error('Manual PDF generation failed:', manualError);
        throw new Error(`PDF generation failed: ${manualError.message}`);
      }
      
      // Download the PDF
      const fileClassObj = classes.find(c => c.uuid === selectedClass);
      const fileClassName = fileClassObj ? fileClassObj.class_name : selectedClass;
      
      const fileName = selectedClass === 'all' 
        ? `all_students_${currentDate.replace(/\//g, '_')}.pdf`
        : `${fileClassName.replace(/\s+/g, '_')}_students_${currentDate.replace(/\//g, '_')}.pdf`;
      
      pdf.save(fileName);
      
      // Close modal after successful generation
      onClose();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Download Student Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Class Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingClasses}
          >
            <option value="all">All Classes</option>
            {loadingClasses ? (
              <option disabled>Loading classes...</option>
            ) : (
              classes.map((classItem) => (
                <option key={classItem.uuid} value={classItem.uuid}>
                  {classItem.class_name}
                </option>
              ))
            )}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {loadingStudents ? (
              <span className="text-blue-500">
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></span>
                Loading students...
              </span>
            ) : (
              selectedClass === 'all' 
                ? `This will include all ${allStudentsForDownload.length || allStudents.length || students.length} students`
                : (() => {
                    const selectedClassObj = classes.find(c => c.uuid === selectedClass);
                    const selectedClassName = selectedClassObj ? selectedClassObj.class_name : selectedClass;
                    return `This will include students from ${selectedClassName} class (${getFilteredStudents().length} students)`;
                  })()
            )}
            {loadingClasses && (
              <span className="text-blue-500 ml-2">
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></span>
                Loading classes...
              </span>
            )}
          </p>
        </div>

        {/* Column Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Information to Include
          </label>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {columns.map((column, index) => (
              <label key={column.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={column.checked}
                  onChange={() => handleColumnToggle(index)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">{column.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                const updatedColumns = columns.map(col => ({ ...col, checked: true }));
                setColumns(updatedColumns);
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Select All
            </button>
            <button
              onClick={() => {
                const updatedColumns = columns.map(col => ({ ...col, checked: false }));
                setColumns(updatedColumns);
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={isGenerating || loadingStudents || columns.filter(col => col.checked).length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating || loadingStudents ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {loadingStudents ? 'Loading Students...' : 'Generating PDF...'}
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadStudentModal;
