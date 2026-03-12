import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subjectsService } from '../../../services/subjectsService';
import SubjectAnalytics from './SubjectAnalytics';
import { SkeletonCards } from '../../ui/Skeleton';
import type { Subject } from '../../../types/subjects';

const SubjectAnalyticsDashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadSubjects();
    
    // Check if there's a subject in the URL
    const subjectFromUrl = searchParams.get('subject');
    if (subjectFromUrl) {
      const subject = subjects.find(s => s.subject_name.toLowerCase() === subjectFromUrl.toLowerCase());
      if (subject) {
        setSelectedSubjectId(subject.id);
      }
    }
  }, [searchParams]);

  const loadSubjects = async () => {
    try {
      const response = await subjectsService.getSubjects();
      if (response.success && response.data) {
        setSubjects(response.data.results);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Subject Analysis</h1>
        <SkeletonCards count={6} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
      </div>
    );
  }

  if (selectedSubjectId) {
    return (
      <SubjectAnalytics
        subjectId={selectedSubjectId}
        onBack={() => {
          setSelectedSubjectId('');
          setSearchParams({});
        }}
        onClassClick={(classId) => navigate(`/staff/statistics/class/${classId}`)}
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Subject Analysis</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => {
              setSelectedSubjectId(subject.id);
              setSearchParams({ subject: subject.subject_name });
            }}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-indigo-100 rounded">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{subject.subject_name}</h3>
                <p className="text-sm text-gray-500">Code: {subject.subject_code || 'N/A'}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubjectAnalyticsDashboard;