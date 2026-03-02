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
      // Check for school admin info first, then staff info
      let userInfo = localStorage.getItem('school_info');
      let schoolId: string | null = null;
      
      if (userInfo) {
        const user = JSON.parse(userInfo);
        schoolId = user.id;
      } else {
        // Try staff info
        userInfo = localStorage.getItem('staff_info');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          schoolId = user.school_id;
        }
      }
      
      if (!schoolId) {
        throw new Error('User not authenticated');
      }
      
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
      // Check for school admin info first, then staff info
      let userInfo = localStorage.getItem('school_info');
      let schoolId: string | null = null;
      
      if (userInfo) {
        const user = JSON.parse(userInfo);
        schoolId = user.id;
      } else {
        userInfo = localStorage.getItem('staff_info');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          schoolId = user.school_id;
        }
      }
      
      if (!schoolId) throw new Error('User not authenticated');
      
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading school profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-semibold">Failed to load school profile</p>
          <p className="text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const schoolInitials = profile.school_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/20" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white/10" />
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-28">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>School Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">School Profile</h1>
          <p className="mt-1 text-blue-200 text-sm">Manage your school's information, branding, and identity</p>
        </div>
      </div>

      {/* ─── Profile Card (overlaps hero) ────────────────────────────── */}
      <div className="relative px-4 sm:px-6 lg:px-8 -mt-20 pb-8">
        {/* Message toast */}
        {message && (
          <div className={`mb-5 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-sm ${
            messageType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <svg className={`w-5 h-5 flex-shrink-0 ${messageType === 'success' ? 'text-emerald-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {messageType === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <p className="text-sm font-semibold">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ─── Main Profile Card ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* School header strip */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Logo / Avatar */}
              <div className="relative flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg ring-4 ring-white" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/60 ring-4 ring-white">
                    <span className="text-xl sm:text-2xl font-bold text-white">{schoolInitials}</span>
                  </div>
                )}
                {editing && (
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Name & motto */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{profile.school_name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {profile.motto && (
                    <span className="text-sm text-slate-500 italic">"{profile.motto}"</span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                    profile.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!editing ? (
                <button type="button" onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200/50 hover:shadow-lg transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200/50 disabled:opacity-50 transition-all">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* ─── Basic Information ──────────────────────────────────── */}
            <div className="border-t border-slate-100 px-6 py-6 sm:px-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* School Name */}
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">School Name</label>
                    {editing ? (
                      <input type="text" name="school_name" value={formData.school_name} onChange={handleInputChange} required
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-800">{profile.school_name}</p>
                    )}
                  </div>
                </div>

                {/* Principal */}
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Principal / Head Teacher</label>
                    {editing ? (
                      <input type="text" name="principal_name" value={formData.principal_name} onChange={handleInputChange} required
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-800">{profile.principal_name}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone Number</label>
                    {editing ? (
                      <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-800">{profile.phone_number}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address</label>
                    {editing ? (
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-800">{profile.email}</p>
                    )}
                  </div>
                </div>

                {/* Domain */}
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">School Domain</label>
                    {editing ? (
                      <input type="text" name="school_domain" value={formData.school_domain} onChange={handleInputChange} placeholder="e.g., yourschool.edu"
                        className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-slate-800">{profile.school_domain || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Registered */}
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Registered On</label>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Address ───────────────────────────────────────────── */}
            <div className="border-t border-slate-100 px-6 py-6 sm:px-8">
              <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">School Address</label>
                  {editing ? (
                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} placeholder="Enter school physical address"
                      className="mt-1 block w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none" />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-slate-800 whitespace-pre-wrap">{profile.address || '—'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Vision, Mission & Motto ────────────────────────────── */}
          <div className="mt-6 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 sm:px-8 sm:py-6">
              <h3 className="text-lg font-bold text-slate-800">Vision, Mission & Motto</h3>
              <p className="text-sm text-slate-400 mt-0.5">Your school's identity and guiding principles</p>
            </div>

            <div className="border-t border-slate-100 px-6 sm:px-8 py-6 space-y-5">
              {/* Motto */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100/80">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-indigo-700">School Motto</h4>
                </div>
                {editing ? (
                  <input type="text" name="motto" value={formData.motto} onChange={handleInputChange} maxLength={500} placeholder="e.g., Excellence in Education"
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                ) : (
                  <p className="text-sm text-slate-700 italic">{profile.motto ? `"${profile.motto}"` : '— Not set'}</p>
                )}
              </div>

              {/* Vision */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-100/80">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-emerald-700">Vision</h4>
                </div>
                {editing ? (
                  <textarea name="vision" value={formData.vision} onChange={handleInputChange} rows={3} placeholder="Enter your school's vision statement"
                    className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none" />
                ) : (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{profile.vision || '— Not set'}</p>
                )}
              </div>

              {/* Mission */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 border border-amber-100/80">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-amber-700">Mission</h4>
                </div>
                {editing ? (
                  <textarea name="mission" value={formData.mission} onChange={handleInputChange} rows={3} placeholder="Enter your school's mission statement"
                    className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none" />
                ) : (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{profile.mission || '— Not set'}</p>
                )}
              </div>
            </div>

            {/* School logo section */}
            {editing && (
              <div className="border-t border-slate-100 px-6 sm:px-8 py-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">School Logo</h3>
                <div className="flex items-center gap-5">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center border border-dashed border-slate-300">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Logo
                      <input type="file" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">JPG, PNG, or SVG. Recommended 200×200px.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile save buttons */}
            {editing && (
              <div className="border-t border-slate-100 px-6 sm:px-8 py-5 sm:hidden">
                <div className="flex gap-3">
                  <button type="button" onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
