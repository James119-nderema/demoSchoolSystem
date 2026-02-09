import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MarksAPI } from '../../../services/api';
import { Card, CardContent } from '../../ui/card';
import { BookOpen, ArrowUpRight } from 'lucide-react';

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  total_students?: number;
  average_score?: number;
}

const SubjectList = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await MarksAPI.get('/api/subjects/');
        setSubjects(response.data.results || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching subjects:', err);
        setError(err.response?.data?.detail || 'Failed to fetch subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-2">Loading subjects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="h-6 w-6 mr-2" />
          Subject Analytics
        </h1>
        <p className="text-gray-600">Select a subject to view detailed analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Link key={subject.id} to={`/statistics/subject/${subject.id}`}>
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{subject.subject_name}</h2>
                    <p className="text-sm text-gray-600">Code: {subject.subject_code}</p>
                    {subject.total_students && (
                      <p className="text-sm text-gray-600 mt-1">
                        {subject.total_students} students
                      </p>
                    )}
                    {subject.average_score !== undefined && (
                      <p className="text-sm text-gray-600">
                        Avg. Score: {subject.average_score.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SubjectList;