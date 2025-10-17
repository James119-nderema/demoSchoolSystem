import { useState, useEffect } from 'react';
import { DataAPI } from '../../services/baseUrl';

interface SchoolProfile {
  id: string;
  school_name: string;
  principal_name: string;
  phone_number: string;
  email: string;
  school_domain: string;
  address: string;
  motto: string;
  vision: string;
  mission: string;
  logo: string;
  logo_url: string | null;
  created_at: string;
  is_active: boolean;
}

export default function SchoolProfile() {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    school_name: '',
    principal_name: '',
    phone_number: '',
    email: '',
    school_domain: '',
    address: '',
    motto: '',
    vision: '',
    mission: '',
    logo: null as File | null
  });

  useEffect(() => {
    fetchSchoolProfile();
  }, []);

  const fetchSchoolProfile = async () => {
    setLoading(true);
    try {
      const userInfo = localStorage.getItem('school_info');
      if (!userInfo) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userInfo);
      const schoolId = user.id;
      
      const response = await DataAPI.getSchool(schoolId.toString());
      setProfile(response);
      
      setFormData({
        school_name: response.school_name || '',
        principal_name: response.principal_name || '',
        phone_number: response.phone_number || '',
        email: response.email || '',
        school_domain: response.school_domain || '',
        address: response.address || '',
        motto: response.motto || '',
        vision: response.vision || '',
        mission: response.mission || '',
        logo: null
      });
      
      if (response.logo_url) {
        setLogoPreview(response.logo_url);
      }
    } catch (error: any) {
      console.error('Error fetching school profile:', error);
      setMessage(error.message || 'Failed to load school profile');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => { setLogoPreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const userInfo = localStorage.getItem('school_info');
      if (!userInfo) throw new Error('User not authenticated');
      
      const user = JSON.parse(userInfo);
      const schoolId = user.id;
      
      const submitData = new FormData();
      submitData.append('school_name', formData.school_name);
      submitData.append('principal_name', formData.principal_name);
      submitData.append('phone_number', formData.phone_number);
      submitData.append('email', formData.email);
      
      if (formData.school_domain) submitData.append('school_domain', formData.school_domain);
      if (formData.address) submitData.append('address', formData.address);
      if (formData.motto) submitData.append('motto', formData.motto);
      if (formData.vision) submitData.append('vision', formData.vision);
      if (formData.mission) submitData.append('mission', formData.mission);
      if (formData.logo) submitData.append('logo', formData.logo);

      await DataAPI.updateSchool(schoolId.toString(), submitData as any);
      
      setMessage('School profile updated successfully!');
      setMessageType('success');
      setEditing(false);
      await fetchSchoolProfile();
    } catch (error: any) {
      setMessage(error.message || 'Failed to update school profile');
      setMessageType('error');
    } finally {
      setSaving(false);
    }

    setTimeout(() => { setMessage(''); }, 5000);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        school_name: profile.school_name || '',
        principal_name: profile.principal_name || '',
        phone_number: profile.phone_number || '',
        email: profile.email || '',
        school_domain: profile.school_domain || '',
        address: profile.address || '',
        motto: profile.motto || '',
        vision: profile.vision || '',
        mission: profile.mission || '',
        logo: null
      });
      
      if (profile.logo_url) {
        setLogoPreview(profile.logo_url);
      } else {
        setLogoPreview(null);
      }
    }
    setEditing(false);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading school profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>Failed to load school profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {logoPreview && (
              <img src={logoPreview} alt="School Logo" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{profile.school_name}</h1>
              <p className="text-gray-600">{profile.motto || 'No motto set'}</p>
            </div>
          </div>
          
          {!editing ? (
            <button onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200">
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition duration-200">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition duration-200">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          <p className="font-medium">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
              {editing ? (
                <input type="text" name="school_name" value={formData.school_name} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3">{profile.school_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal/Head Teacher *</label>
              {editing ? (
                <input type="text" name="principal_name" value={formData.principal_name} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3">{profile.principal_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              {editing ? (
                <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3">{profile.phone_number}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
              {editing ? (
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3">{profile.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Domain</label>
              {editing ? (
                <input type="text" name="school_domain" value={formData.school_domain} onChange={handleInputChange} placeholder="e.g., yourschool.edu" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3">{profile.school_domain || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registered On</label>
              <p className="text-gray-900 py-3">{new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Additional Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
              {editing ? (
                <div>
                  <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  {logoPreview && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img src={logoPreview} alt="Logo Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {logoPreview ? (
                    <img src={logoPreview} alt="School Logo" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <p className="text-gray-500 py-3">No logo uploaded</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Address</label>
              {editing ? (
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} placeholder="Enter school physical address" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3 whitespace-pre-wrap">{profile.address || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Motto</label>
              {editing ? (
                <input type="text" name="motto" value={formData.motto} onChange={handleInputChange} maxLength={500} placeholder="e.g., Excellence in Education" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3">{profile.motto || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Vision</label>
              {editing ? (
                <textarea name="vision" value={formData.vision} onChange={handleInputChange} rows={4} placeholder="Enter your school's vision statement" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3 whitespace-pre-wrap">{profile.vision || 'Not set'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Mission</label>
              {editing ? (
                <textarea name="mission" value={formData.mission} onChange={handleInputChange} rows={4} placeholder="Enter your school's mission statement" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <p className="text-gray-900 py-3 whitespace-pre-wrap">{profile.mission || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div className="md:hidden flex space-x-3">
            <button type="button" onClick={handleCancel} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition duration-200">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition duration-200">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
