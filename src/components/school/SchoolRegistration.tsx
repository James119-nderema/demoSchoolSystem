import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataAPI } from '../../services/baseUrl'

interface SchoolFormData {
  school_name: string
  principal_name: string
  phone_number: string
  email: string
  school_domain: string
  password: string
  address: string
  logo: File | null
  motto: string
  vision: string
  mission: string
}

export default function SchoolRegistration() {
  const [formData, setFormData] = useState<SchoolFormData>({
    school_name: '',
    principal_name: '',
    phone_number: '',
    email: '',
    school_domain: '',
    password: '',
    address: '',
    logo: null,
    motto: '',
    vision: '',
    mission: ''
  })
  
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      school_name: '',
      principal_name: '',
      phone_number: '',
      email: '',
      school_domain: '',
      password: '',
      address: '',
      logo: null,
      motto: '',
      vision: '',
      mission: ''
    })
  }

  const createSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Create FormData to handle file upload
      const submitData = new FormData()
      submitData.append('school_name', formData.school_name)
      submitData.append('principal_name', formData.principal_name)
      submitData.append('phone_number', formData.phone_number)
      submitData.append('email', formData.email)
      submitData.append('password', formData.password)
      
      if (formData.school_domain) submitData.append('school_domain', formData.school_domain)
      if (formData.address) submitData.append('address', formData.address)
      if (formData.motto) submitData.append('motto', formData.motto)
      if (formData.vision) submitData.append('vision', formData.vision)
      if (formData.mission) submitData.append('mission', formData.mission)
      if (formData.logo) submitData.append('logo', formData.logo)

      await DataAPI.createSchool(submitData as any);
      setMessage('School registered successfully! Redirecting to login...')
      setMessageType('success')
      resetForm()
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      setMessage(error.message || 'Failed to create school')
      setMessageType('error')
    }

    setLoading(false)

    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage('')
    }, 5000)
  }



  // const viewSchoolDetails = (school: any) => {
  //   const details = `
  // School: ${school.school_name}
  // Email: ${school.email || 'N/A'}
  // Phone: ${school.phone_number || 'N/A'}
  // Principal: ${school.principal_name || 'N/A'}
  // Domain: ${school.school_domain || 'N/A'}
  // Created: ${new Date(school.created_at).toLocaleDateString()}
  //   `
  //   alert(details)
  // }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">School Management System</h1>
          <p className="text-xl text-gray-600">Create and manage your school with ease</p>
        </div>

        {/* Add School Form */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">Register Your School</h2>
            
            <form onSubmit={createSchool} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="school_name" className="block text-sm font-medium text-gray-700 mb-2">
                    School Name *
                  </label>
                  <input 
                    type="text" 
                    id="school_name" 
                    name="school_name"
                    value={formData.school_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <label htmlFor="school_domain" className="block text-sm font-medium text-gray-700 mb-2">
                    School Domain (Optional)
                  </label>
                  <input 
                    type="text" 
                    id="school_domain" 
                    name="school_domain"
                    value={formData.school_domain}
                    onChange={handleInputChange}
                    placeholder="e.g., yourschool.edu"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input 
                    type="tel" 
                    id="phone_number" 
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="principal_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Principal/Head Teacher Name *
                </label>
                <input 
                  type="text" 
                  id="principal_name" 
                  name="principal_name"
                  value={formData.principal_name}
                  onChange={handleInputChange}
                  placeholder="Enter principal's full name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password *
                </label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>
              </div>

              {/* Optional Fields Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information (Optional)</h3>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      School Address
                    </label>
                    <textarea 
                      id="address" 
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter school physical address"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                      School Logo
                    </label>
                    <input 
                      type="file" 
                      id="logo" 
                      name="logo"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: PNG or JPG, max 2MB</p>
                  </div>

                  <div>
                    <label htmlFor="motto" className="block text-sm font-medium text-gray-700 mb-2">
                      School Motto
                    </label>
                    <input 
                      type="text" 
                      id="motto" 
                      name="motto"
                      value={formData.motto}
                      onChange={handleInputChange}
                      placeholder="e.g., Excellence in Education"
                      maxLength={500}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="vision" className="block text-sm font-medium text-gray-700 mb-2">
                      School Vision
                    </label>
                    <textarea 
                      id="vision" 
                      name="vision"
                      value={formData.vision}
                      onChange={handleInputChange}
                      placeholder="Enter your school's vision statement"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="mission" className="block text-sm font-medium text-gray-700 mb-2">
                      School Mission
                    </label>
                    <textarea 
                      id="mission" 
                      name="mission"
                      value={formData.mission}
                      onChange={handleInputChange}
                      placeholder="Enter your school's mission statement"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4 pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating School...
                    </>
                  ) : (
                    'Create School'
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition duration-200"
                >
                  Reset Form
                </button>
              </div>
            </form>
            
            {/* Success/Error Messages */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                <p className="font-medium">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
