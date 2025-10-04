import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { teacherSubjectClassService } from '../../../services/teacherSubjectClassService';
import type { TeacherSubjectClass, TeacherListItem } from '../../../services/teacherSubjectClassService';
import { DataAPI } from '../../../services/baseUrl';

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

interface EditTeacherAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignment: TeacherSubjectClass;
}

export default function EditTeacherAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  assignment,
}: EditTeacherAssignmentModalProps) {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState(assignment.teacher);
  const [selectedClass, setSelectedClass] = useState(assignment.class_assigned);
  const [selectedSubject, setSelectedSubject] = useState(assignment.subject);
  const [isActive, setIsActive] = useState(assignment.is_active);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTeachers();
      loadClasses();
      loadSubjects();
      setSelectedTeacher(assignment.teacher);
      setSelectedClass(assignment.class_assigned);
      setSelectedSubject(assignment.subject);
      setIsActive(assignment.is_active);
    }
  }, [isOpen, assignment]);

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
      // Fetch all classes with a very large page_size to get all at once
      const response = await DataAPI.getClasses({ 
        page: '1',
        page_size: '10000' // Very large number to get all classes
      });
      console.log('Classes response:', response);
      setClasses(response.results || response || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      const response = await DataAPI.getSubjects({ page_size: '100' });
      setSubjects(response.results || response || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
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

    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await teacherSubjectClassService.updateAssignment(String(assignment.id), {
        teacher: selectedTeacher,
        class_assigned: selectedClass,
        subject: selectedSubject,
        is_active: isActive,
      });

      if (result.success) {
        alert('Assignment updated successfully');
        onSuccess();
      } else {
        alert(result.message || 'Failed to update assignment');
      }
    } catch (error: any) {
      console.error('Failed to update assignment:', error);
      
      // Extract detailed error messages from backend validation
      let errorMessage = 'Failed to update assignment.\n\n';
      
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
          <h2 className="text-xl font-bold text-gray-900">Edit Teacher Assignment</h2>
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

          {/* Subject Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            {isLoadingSubjects ? (
              <div className="text-sm text-gray-500">Loading subjects...</div>
            ) : (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject_name}
                    {subject.subject_code && ` (${subject.subject_code})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status Toggle */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              disabled={isSubmitting || isLoadingTeachers || isLoadingClasses || isLoadingSubjects}
            >
              {isSubmitting ? 'Updating...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
