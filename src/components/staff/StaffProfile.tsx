import React, { useState, useEffect } from 'react';
import { APIService } from '../../services/baseUrl';

interface StaffInfo {
  id: string;
  email: string;
  full_name: string;
  school_id: number;
  school_name: string;
  phone_number: string;
}

interface ClassData {
  id: string;
  class_name: string;
  class_code: string;
  description: string;
}

interface SubjectData {
  id: string;
  subject_name: string;
  subject_code: string;
  description: string;
}

interface Assignment {
  id?: string;
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
  is_class_teacher?: boolean;
}

interface ClassSubjectAssignment {
  class_id: string;
  subject_ids: string[];
  is_class_teacher: boolean;
}

const StaffProfile: React.FC = () => {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAssignmentEditing, setIsAssignmentEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classSubjectAssignments, setClassSubjectAssignments] = useState<ClassSubjectAssignment[]>([]);

  useEffect(() => {
    const info = localStorage.getItem('staff_info');
    if (info) {
      try {
        setStaffInfo(JSON.parse(info));
        fetchProfileData();
      } catch (error) {
        console.error('Error parsing staff info:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch available classes and subjects first
      const availableResponse = await APIService.get('/api/staff/profile/available_classes_subjects/');
      if (availableResponse.classes) {
        setClasses(availableResponse.classes);
      }
      if (availableResponse.subjects) {
        setSubjects(availableResponse.subjects);
      }

      // Fetch profile and assignments after classes/subjects are loaded
      const profileResponse = await APIService.get('/api/staff/profile/my_profile/');
      if (profileResponse.assignments) {
        setAssignments(profileResponse.assignments);
        // Group assignments by class for editing after both classes and subjects are loaded
        setTimeout(() => {
          groupAssignmentsByClass(profileResponse.assignments, availableResponse.classes, availableResponse.subjects);
        }, 100);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupAssignmentsByClass = (assignmentsList: Assignment[], classesData?: ClassData[], subjectsData?: SubjectData[]) => {
    const grouped: { [key: string]: ClassSubjectAssignment } = {};
    
    // Use provided data or fall back to state
    const availableClasses = classesData || classes;
    const availableSubjects = subjectsData || subjects;
    
    assignmentsList.forEach(assignment => {
      const classObj = availableClasses.find(c => c.class_name === assignment.class_name);
      const classId = classObj?.id;
      
      if (classId) {
        if (!grouped[classId]) {
          grouped[classId] = {
            class_id: classId,
            subject_ids: [],
            is_class_teacher: assignment.is_class_teacher || false
          };
        }
        
        const subjectObj = availableSubjects.find(s => s.subject_name === assignment.subject_name);
        const subjectId = subjectObj?.id;
        
        if (subjectId && !grouped[classId].subject_ids.includes(subjectId)) {
          grouped[classId].subject_ids.push(subjectId);
        }
      }
    });

    const groupedAssignments = Object.values(grouped);
    setClassSubjectAssignments(groupedAssignments);
  };

  const handleAddClassAssignment = () => {
    setClassSubjectAssignments([
      ...classSubjectAssignments,
      { class_id: '', subject_ids: [], is_class_teacher: false }
    ]);
  };

  const handleRemoveClassAssignment = (index: number) => {
    const updated = classSubjectAssignments.filter((_, i) => i !== index);
    setClassSubjectAssignments(updated);
  };

  const handleClassChange = (index: number, classId: string) => {
    const updated = [...classSubjectAssignments];
    updated[index] = { ...updated[index], class_id: classId };
    setClassSubjectAssignments(updated);
  };

  const handleSubjectChange = (index: number, subjectId: string, checked: boolean) => {
    const updated = [...classSubjectAssignments];
    if (checked) {
      if (!updated[index].subject_ids.includes(subjectId)) {
        updated[index].subject_ids.push(subjectId);
      }
    } else {
      updated[index].subject_ids = updated[index].subject_ids.filter(id => id !== subjectId);
    }
    setClassSubjectAssignments(updated);
  };

  const handleSaveAssignments = async () => {
    try {
      setSaving(true);
      const validAssignments = classSubjectAssignments.filter(
        assignment => assignment.class_id !== '' && assignment.subject_ids.length > 0
      );

      if (validAssignments.length === 0) {
        alert('Please add at least one valid assignment with a class and subjects selected.');
        return;
      }

      await APIService.post('/api/staff/profile/update_assignments/', {
        assignments: validAssignments
      });

      alert('Assignments updated successfully!');
      setIsAssignmentEditing(false);
      fetchProfileData(); // Refresh data
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Error saving assignments. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!staffInfo || loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Manage your profile information</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-none">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-indigo-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm hover:bg-indigo-700 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    defaultValue={staffInfo.full_name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{staffInfo.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    defaultValue={staffInfo.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{staffInfo.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    defaultValue={staffInfo.phone_number}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{staffInfo.phone_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">School</label>
                <p className="mt-1 text-sm text-gray-900">{staffInfo.school_name}</p>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Save Changes
                </button>
              </div>
            )}

            {/* Security Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-base font-medium text-gray-900 mb-4">Security</h3>
              <div className="space-y-3">
                <div>
                  <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                    Change Password
                  </button>
                  <p className="text-xs text-gray-500 mt-1">Update your account password</p>
                </div>
              </div>
            </div>
          </div>

          {/* Class and Subject Assignments Section */}
          <div className="bg-white overflow-hidden shadow-sm rounded-lg p-4 sm:p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Teaching Assignments</h2>
              <button
                onClick={() => {
                  if (!isAssignmentEditing) {
                    // When entering edit mode, populate with current assignments
                    if (assignments.length > 0) {
                      groupAssignmentsByClass(assignments, classes, subjects);
                    } else {
                      // If no assignments exist, start with one empty assignment
                      setClassSubjectAssignments([{
                        class_id: '',
                        subject_ids: [],
                        is_class_teacher: false
                      }]);
                    }
                  }
                  setIsAssignmentEditing(!isAssignmentEditing);
                }}
                className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm hover:bg-green-700 transition-colors"
              >
                {isAssignmentEditing ? 'Cancel' : 'Edit Assignments'}
              </button>
            </div>

            {/* Current Assignments Display */}
            {!isAssignmentEditing && (
              <div className="space-y-4">
                {assignments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignments.map((assignment, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{assignment.class_name}</h4>
                          {assignment.is_class_teacher && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Class Teacher
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Subject:</strong> {assignment.subject_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Code: {assignment.subject_code}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No teaching assignments found. Click "Edit Assignments" to add some.</p>
                )}
              </div>
            )}

            {/* Assignment Editing Interface */}
            {isAssignmentEditing && (
              <div className="space-y-6">
                {classSubjectAssignments.map((assignment, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Assignment {index + 1}</h4>
                      <button
                        onClick={() => handleRemoveClassAssignment(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Class Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Class
                      </label>
                      <select
                        value={assignment.class_id}
                        onChange={(e) => handleClassChange(index, e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select a class...</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.class_name} ({cls.class_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Subjects (Check all that apply)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                        {subjects.map((subject) => (
                          <label key={subject.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={assignment.subject_ids.includes(subject.id)}
                              onChange={(e) => handleSubjectChange(index, subject.id, e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">
                              {subject.subject_name} ({subject.subject_code})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Class Teacher Checkbox 
                    <div className="mb-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={assignment.is_class_teacher}
                          onChange={(e) => _handleClassTeacherChange(index, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          I am the class teacher for this class
                        </span>
                      </label>
                    </div>
                    */}
                  </div>
                ))}

                {/* Add New Assignment Button */}
                <button
                  onClick={handleAddClassAssignment}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Add New Class Assignment
                </button>

                {/* Save/Cancel Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsAssignmentEditing(false);
                      // Reset to original assignments when canceling
                      if (assignments.length > 0) {
                        groupAssignmentsByClass(assignments, classes, subjects);
                      } else {
                        setClassSubjectAssignments([]);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAssignments}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Assignments'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
