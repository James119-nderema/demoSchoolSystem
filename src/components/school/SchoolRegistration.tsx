import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface SchoolFormData {
  school_name: string
  principal_name: string
  phone_number: string
  email: string
  school_domain: string
  password: string
  confirmPassword: string
  address: string
  logo: File | null
  motto: string
  vision: string
  mission: string
}

export default function SchoolRegistration() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<SchoolFormData>({
    school_name: '',
    principal_name: '',
    phone_number: '',
    email: '',
    school_domain: '',
    password: '',
    confirmPassword: '',
    address: '',
    logo: null,
    motto: '',
    vision: '',
    mission: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.school_name.trim()) {
      newErrors.school_name = 'School name is required'
    }
    if (!formData.principal_name.trim()) {
      newErrors.principal_name = 'Principal name is required'
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required'
    } else if (!/^(0|254|\+254)?[17]\d{8}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Please enter a valid phone number'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Store registration data in sessionStorage and redirect to package selection page
    const registrationData = {
      school_name: formData.school_name,
      principal_name: formData.principal_name,
      phone_number: formData.phone_number,
      email: formData.email,
      school_domain: formData.school_domain,
      password: formData.password,
      address: formData.address,
      motto: formData.motto,
      vision: formData.vision,
      mission: formData.mission,
    }
    
    // Store in sessionStorage for persistence across pages
    sessionStorage.setItem('pendingSchoolRegistration', JSON.stringify(registrationData))

    // Store logo in sessionStorage if present (as base64)
    if (formData.logo) {
      const reader = new FileReader()
      reader.onload = () => {
        sessionStorage.setItem('school_logo', reader.result as string)
        sessionStorage.setItem('school_logo_name', formData.logo!.name)
        sessionStorage.setItem('school_logo_type', formData.logo!.type)
        // Navigate after logo is saved
        navigate('/package-selection', {
          state: {
            registrationData,
            fromRegistration: true
          }
        })
      }
      reader.readAsDataURL(formData.logo)
    } else {
      // Navigate immediately if no logo
      navigate('/package-selection', {
        state: {
          registrationData,
          fromRegistration: true
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">School Management System</h1>
          <p className="text-xl text-gray-600">Create and manage your school with ease</p>
        </div>

        {/* Steps Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">1</div>
              <span className="font-medium text-indigo-600">Registration</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">2</div>
              <span className="text-gray-500">Choose Packages</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">3</div>
              <span className="text-gray-500">Dashboard</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">Step 1: Register Your School</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.school_name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter school name"
                  />
                  {errors.school_name && <p className="text-red-500 text-sm mt-1">{errors.school_name}</p>}
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
                    placeholder="0712345678"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone_number ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
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
                    placeholder="school@example.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.principal_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.principal_name && <p className="text-red-500 text-sm mt-1">{errors.principal_name}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        rows={3}
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
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center pt-4">
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                >
                  <span>Continue to Select Plan</span>
                  <span>→</span>
                </button>
              </div>
            </form>
            
            <p className="text-center text-gray-600 mt-6">
              Already have an account?{' '}
              <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
