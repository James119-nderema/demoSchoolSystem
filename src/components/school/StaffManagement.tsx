import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/environment';
import AddStaffModal from './modals/AddStaffModal';
import EditStaffModal from './modals/EditStaffModal';

interface Staff {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
}

const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const roleOptions = [
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'CLASS_TEACHER', label: 'Class Teacher' },
    { value: 'HOD', label: 'Head of Department' },
    { value: 'DIRECTOR_OF_STUDIES', label: 'Director of Studies' },
    { value: 'BURSAR', label: 'Bursar/Accountant' },
    { value: 'ADMINISTRATIVE_STAFF', label: 'Administrative Staff' },
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found. Please login again.' });
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/schools/staff/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setStaffList(response.data.staff);
      setSchoolName(response.data.school);
      setTotalCount(response.data.total_count);
      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setMessage({
          type: 'error',
          text: 'Authentication failed. Please login again.'
        });
        // Clear invalid token
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_info');
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to fetch staff members'
        });
      }
      setLoading(false);
    }
  };

  const handleAddStaff = async (data: { email: string; role: string }) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found. Please login again.' });
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/schools/staff/`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage({
        type: 'success',
        text: response.data.message
      });

      setShowAddModal(false);
      fetchStaff();

    } catch (error: any) {
      if (error.response?.status === 401) {
        setMessage({
          type: 'error',
          text: 'Authentication failed. Please login again.'
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_info');
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || error.response?.data?.email?.[0] || 'Failed to add staff member'
        });
      }
      throw error; // Re-throw to be handled by modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = async (staffId: string, data: { 
    role: string; 
    full_name: string; 
    phone_number: string; 
    is_active: boolean 
  }) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found. Please login again.' });
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/api/schools/staff/${staffId}/`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage({
        type: 'success',
        text: response.data.message
      });

      setShowEditModal(false);
      setEditingStaff(null);
      fetchStaff();

    } catch (error: any) {
      if (error.response?.status === 401) {
        setMessage({
          type: 'error',
          text: 'Authentication failed. Please login again.'
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('school_info');
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to update staff member'
        });
      }
      throw error; // Re-throw to be handled by modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setShowEditModal(true);
  };

  const handleDelete = async (staffId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from your staff?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.delete(`${API_BASE_URL}/api/schools/staff/${staffId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage({
        type: 'success',
        text: response.data.message
      });

      fetchStaff(); // Refresh the list
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to remove staff member'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading staff members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">{schoolName} • {totalCount} staff members</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            + Add Staff Member
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
        </div>

        {staffList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No staff members added yet.</p>
            <p className="text-sm">Click "Add Staff Member" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {staff.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {staff.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staff.phone_number || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {staff.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(staff.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(staff)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(staff.id, staff.email)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStaff}
        roleOptions={roleOptions}
        isLoading={isSubmitting}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={showEditModal}
        staff={editingStaff}
        onClose={() => {
          setShowEditModal(false);
          setEditingStaff(null);
        }}
        onSubmit={handleEditStaff}
        roleOptions={roleOptions}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default StaffManagement;
