import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentsAPI } from '../../services/baseUrl';

interface ParentDashboardResponse {
  student?: {
    id?: number | string;
  };
}

export default function StudentProfileContent() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveStudentAndRedirect = async () => {
      try {
        const data = await ParentsAPI.getDashboard() as ParentDashboardResponse;
        const studentId = data?.student?.id;

        if (!studentId) {
          setError('Student profile is not linked to this parent account.');
          return;
        }

        navigate(`/parent/profile/${studentId}`, { replace: true });
      } catch (err) {
        console.error('Error loading parent profile student:', err);
        setError('Unable to open student profile. Please refresh and try again.');
      }
    };

    resolveStudentAndRedirect();
  }, [navigate]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Profile</h3>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-gray-600">Opening linked student profile...</p>
        )}
      </div>
    </div>
  );
}
