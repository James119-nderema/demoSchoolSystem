import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { teacherSubjectClassService } from '../../../services/teacherSubjectClassService';
import type { TeacherListItem } from '../../../services/teacherSubjectClassService';
import { APIService } from '../../../services/baseUrl';

interface Class {
  id: string;
  class_name: string;
  class_code: string;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_code?: string;
}

interface AddTeacherAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTeacherAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTeacherAssignmentModalProps) {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeachers();
      loadClasses();
      loadSubjects();
    }
  }, [isOpen]);

  const loadTeachers = async () => {
    try {
      setIsLoadingTeachers(true);
      const response = await teacherSubjectClassService.getTeachers();
      if (response.success && response.data) {
        setTeachers(response.data.results || []);
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const loadClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const params = {
        page: '1',
        page_size: '10000'
      };
      
      const response = await APIService.get('/api/staff/classes/', params, 'staff');
      
      if (response.results) {
        setClasses(response.results);
      } else if (Array.isArray(response)) {
        setClasses(response);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      const params = {
        page: '1',
        page_size: '10000'
      };
      
      const response = await APIService.get('/api/staff/subjects/', params, 'staff');
      
      if (response.results) {
        setSubjects(response.results);
      } else if (Array.isArray(response)) {
        setSubjects(response);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacher) {
      alert('Please select a teacher');
      return;
    }

    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await teacherSubjectClassService.createAssignments({
        teacher: selectedTeacher,
        class_assigned: selectedClass,
        subjects: selectedSubjects,
      });

      if (result.success) {
        const data = result.data;
        const message = data?.message || 'Assignments created successfully';
        const warnings = data?.warnings;
        const creationErrors = data?.errors;
        
        // Build success message
        let displayMessage = message;
        
        // Add warnings about duplicates if any
        if (warnings && warnings.duplicates && warnings.duplicates.length > 0) {
          displayMessage += '\n\nℹ️ Skipped Duplicates:\n' + warnings.duplicates.join('\n');
        }
        
        // Add creation errors if any
        if (creationErrors && creationErrors.length > 0) {
          displayMessage += '\n\n⚠️ Errors:\n' + creationErrors.join('\n');
        }
        
        alert(displayMessage);
        
        // Reset form and close modal
        setSelectedTeacher('');
        setSelectedClass('');
        setSelectedSubjects([]);
        onSuccess();
      } else {
        alert(result.message || 'Failed to create assignments');
      }
    } catch (error: any) {
      console.error('Failed to create assignments:', error);
      
      // Extract detailed error messages from backend validation
      let errorMessage = 'Failed to create assignments.\n\n';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation error format: { error: '...', details: {...} }
        if (errorData.details) {
          errorMessage += '❌ Validation Errors:\n';
          
          // Extract all error messages from details object
          Object.entries(errorData.details).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errors.forEach((err: string) => {
                errorMessage += `• ${err}\n`;
              });
            } else {
              errorMessage += `• ${field}: ${errors}\n`;
            }
          });
        } else if (errorData.error) {
          errorMessage += errorData.error;
        } else if (errorData.message) {
          errorMessage += errorData.message;
        } else {
          errorMessage += 'Please check your input and try again.';
        }
      } else {
        errorMessage += 'Please check your input and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Teacher Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Teacher Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teacher <span className="text-red-500">*</span>
            </label>
            {isLoadingTeachers ? (
              <div className="text-sm text-gray-500">Loading teachers...</div>
            ) : (
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Class Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class <span className="text-red-500">*</span>
            </label>
            {isLoadingClasses ? (
              <div className="text-sm text-gray-500">Loading classes...</div>
            ) : (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.class_code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subjects Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subjects <span className="text-red-500">*</span>
            </label>
            {isLoadingSubjects ? (
              <div className="text-sm text-gray-500">Loading subjects...</div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                {subjects.length === 0 ? (
                  <div className="text-sm text-gray-500">No subjects available</div>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          disabled={isSubmitting}
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {subject.subject_name}
                          {subject.subject_code && (
                            <span className="text-gray-500"> ({subject.subject_code})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            {selectedSubjects.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedSubjects.length} subject{selectedSubjects.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLoadingTeachers || isLoadingClasses || isLoadingSubjects}
            >
              {isSubmitting ? 'Creating...' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
