import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle,
  Search,
  BookOpen,
  Users
} from 'lucide-react';
import gradingService, { 
  type GradeScaleGrouped, 
  type GradeDefinition, 
  type GradeScaleCreateData,
  type GradeScaleStats,
  type ClassItem,
  type SubjectItem
} from '../../services/gradingService';
import { SkeletonTable } from '../ui/Skeleton';

const Grading: React.FC = () => {
  // State
  const [gradeScales, setGradeScales] = useState<GradeScaleGrouped[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [stats, setStats] = useState<GradeScaleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [grades, setGrades] = useState<GradeDefinition[]>([
    { grade: '', min_marks: 0, max_marks: 0, points: 0, remarks: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel using gradingService (with staff auth)
      const [gradesRes, subjectsData, classesData, statsRes] = await Promise.all([
        gradingService.getGradeScales(),
        gradingService.getSubjects(),
        gradingService.getClasses(),
        gradingService.getStats()
      ]);
      
      if (gradesRes.success) {
        setGradeScales(gradesRes.data);
      }
      
      setSubjects(subjectsData);
      setClasses(classesData);
      
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedSubjects(new Set());
    setSelectedClasses(new Set());
    setGrades([{ grade: '', min_marks: 0, max_marks: 0, points: 0, remarks: '' }]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubjectToggle = (subjectId: string) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleClassToggle = (classId: string) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(classId)) {
      newSelected.delete(classId);
    } else {
      newSelected.add(classId);
    }
    setSelectedClasses(newSelected);
  };

  const handleSelectAllSubjects = () => {
    if (selectedSubjects.size === subjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(subjects.map(s => s.id)));
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClasses.size === classes.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(classes.map(c => c.id)));
    }
  };

  const handleGradeChange = (index: number, field: keyof GradeDefinition, value: string | number) => {
    const newGrades = [...grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setGrades(newGrades);
  };

  const handleAddGrade = () => {
    setGrades([...grades, { grade: '', min_marks: 0, max_marks: 0, points: 0, remarks: '' }]);
  };

  const handleRemoveGrade = (index: number) => {
    const newGrades = grades.filter((_, i) => i !== index);
    setGrades(newGrades);
  };

  const handleSubmit = async () => {
    if (selectedSubjects.size === 0) {
      setError('Please select at least one subject');
      return;
    }
    if (selectedClasses.size === 0) {
      setError('Please select at least one class');
      return;
    }
    if (grades.length === 0) {
      setError('Please add at least one grade');
      return;
    }
    
    // Validate grades
    for (const grade of grades) {
      if (!grade.grade.trim()) {
        setError('All grades must have a grade name');
        return;
      }
      if (grade.min_marks >= grade.max_marks) {
        setError(`Grade ${grade.grade}: Min marks must be less than max marks`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    const data: GradeScaleCreateData = {
      subject_ids: Array.from(selectedSubjects),
      class_ids: Array.from(selectedClasses),
      grades: grades.map(g => ({
        grade: g.grade,
        min_marks: Number(g.min_marks),
        max_marks: Number(g.max_marks),
        points: Number(g.points),
        remarks: g.remarks || ''
      }))
    };

    try {
      const result = await gradingService.createGradeScales(data);
      
      if (result.success) {
        setSuccess(`Successfully assigned grading to ${result.count} class-subject combinations`);
        setIsModalOpen(false);
        fetchData();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || 'Failed to create grade scales');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create grade scales');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGradeScale = async (classId: string, subjectId: string) => {
    if (!confirm('Are you sure you want to delete this grade scale?')) {
      return;
    }

    try {
      const result = await gradingService.deleteByClassSubject(classId, subjectId);
      
      if (result.success) {
        setSuccess('Grade scale deleted successfully');
        fetchData();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || 'Failed to delete grade scale');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete grade scale');
    }
  };

  // Filter grade scales
  const filteredGradeScales = gradeScales.filter(scale => {
    const matchesSearch = 
      scale.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scale.subject_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || scale.class_id === filterClass;
    const matchesSubject = !filterSubject || scale.subject_id === filterSubject;
    return matchesSearch && matchesClass && matchesSubject;
  });

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Grading System</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 flex-1 max-w-sm" />
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-28" />
          <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-28" />
        </div>
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Grading System</h1>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Assign Grading
          </button>
        </div>
        <p className="text-gray-600">Configure grade scales for classes and subjects</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_assignments}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Classes with Grades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.classes_with_grades}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subjects with Grades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.subjects_with_grades}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Grade Entries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_entries}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by class or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="min-w-[200px]">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px]">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grade Scales Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredGradeScales.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Grade Scales Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterClass || filterSubject 
                ? 'No results match your filters' 
                : 'Get started by assigning grading to classes and subjects'}
            </p>
            {!searchTerm && !filterClass && !filterSubject && (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Assign Grading
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grades
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGradeScales.map((scale) => (
                    <tr key={`${scale.class_id}-${scale.subject_id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{scale.class_name}</div>
                        <div className="text-sm text-gray-500">{scale.class_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{scale.subject_name}</div>
                        <div className="text-sm text-gray-500">{scale.subject_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {scale.grades.map((grade, gIndex) => (
                            <span
                              key={gIndex}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              title={`${grade.min_marks}-${grade.max_marks} marks, ${grade.points} points`}
                            >
                              {grade.grade}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDeleteGradeScale(scale.class_id, scale.subject_id)}
                          className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete grade scale"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredGradeScales.map((scale) => (
                <div key={`${scale.class_id}-${scale.subject_id}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{scale.class_name}</h3>
                        <p className="text-xs text-gray-500">{scale.class_code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGradeScale(scale.class_id, scale.subject_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete grade scale"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-700">
                      <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium">{scale.subject_name}</span>
                      <span className="text-gray-400">({scale.subject_code})</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {scale.grades.map((grade, gIndex) => (
                      <span
                        key={gIndex}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        title={`${grade.min_marks}-${grade.max_marks} marks, ${grade.points} points`}
                      >
                        {grade.grade}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Assign Grading</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Classes Selection */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Select Classes</h3>
                    <button
                      type="button"
                      onClick={handleSelectAllClasses}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {selectedClasses.size === classes.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {classes.map(cls => (
                      <label
                        key={cls.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClasses.has(cls.id)}
                          onChange={() => handleClassToggle(cls.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{cls.class_name}</span>
                        <span className="text-gray-400 text-sm">({cls.class_code})</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedClasses.size} class(es) selected
                  </p>
                </div>

                {/* Subjects Selection */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Select Subjects</h3>
                    <button
                      type="button"
                      onClick={handleSelectAllSubjects}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {selectedSubjects.size === subjects.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {subjects.map(sub => (
                      <label
                        key={sub.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.has(sub.id)}
                          onChange={() => handleSubjectToggle(sub.id)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{sub.subject_name}</span>
                        {sub.subject_code && (
                          <span className="text-gray-400 text-sm">({sub.subject_code})</span>
                        )}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedSubjects.size} subject(s) selected
                  </p>
                </div>
              </div>

              {/* Grade Definitions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Grade Definitions</h3>
                  <button
                    type="button"
                    onClick={handleAddGrade}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-4 h-4" />
                    Add Grade
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Min Marks</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((grade, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={grade.grade}
                              onChange={(e) => handleGradeChange(index, 'grade', e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                              placeholder="A"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={grade.min_marks}
                              onChange={(e) => handleGradeChange(index, 'min_marks', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              step="0.01"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={grade.max_marks}
                              onChange={(e) => handleGradeChange(index, 'max_marks', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              step="0.01"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={grade.points}
                              onChange={(e) => handleGradeChange(index, 'points', parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              step="0.01"
                              min="0"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={grade.remarks || ''}
                              onChange={(e) => handleGradeChange(index, 'remarks', e.target.value)}
                              className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Excellent"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveGrade(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              disabled={grades.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                This will create {selectedClasses.size * selectedSubjects.size * grades.length} grade entries
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || selectedClasses.size === 0 || selectedSubjects.size === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Assign Grading
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grading;
