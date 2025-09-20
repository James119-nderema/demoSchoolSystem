export default function StudentProfileContent() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Profile</h3>
        <p className="text-gray-600">Student profile information will be displayed here.</p>
        
        {/* Placeholder content */}
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-900">Loading...</span>
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Admission Number
            </label>
            <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-900">Loading...</span>
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Class
            </label>
            <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-900">Loading...</span>
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <div className="mt-1 p-3 border border-gray-300 rounded-md bg-gray-50">
              <span className="text-gray-900">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
