import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAnalytics from '../generalFiles/analytics/StudentAnalytics';
import ClassAnalytics from '../generalFiles/analytics/ClassAnalytics';
import SubjectAnalytics from '../generalFiles/analytics/SubjectAnalytics';

export const StudentAnalyticsWrapper: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  if (!studentId) {
    return <div>Student ID not found</div>;
  }

  return (
    <StudentAnalytics 
      studentId={studentId} 
      onBack={() => navigate('/statistics')}
    />
  );
};

export const ClassAnalyticsWrapper: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  if (!classId) {
    return <div>Class ID not found</div>;
  }

  return (
    <ClassAnalytics 
      classId={classId} 
      onBack={() => navigate('/statistics')}
      onStudentClick={(studentId) => navigate(`/staff/statistics/student/${studentId}`)}
    />
  );
};

export const SubjectAnalyticsWrapper: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  if (!subjectId) {
    return <div>Subject ID not found</div>;
  }

  return (
    <SubjectAnalytics 
      subjectId={subjectId} 
      onBack={() => navigate('/statistics')}
      onClassClick={(classId) => navigate(`/staff/statistics/class/${classId}`)}
    />
  );
};
